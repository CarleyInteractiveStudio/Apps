--!strict
--[[
    FPSLibrary - ClientController
    Controlador del cliente:
    - Escucha dinámica de equipamiento de armas (Character.ChildAdded)
      para que funcione instantáneamente sin importar si el arma fue configurada
      con un Script del Servidor, LocalScript o Plugin.
    - Gestión de inputs (disparo por mouse/tecla, recarga, apuntado ADS)
    - Modos de disparo: Automático, Semiautomático, Ráfaga, Escopeta
    - Sistema de balística Hitscan con Raycast
    - Trazadoras de bala con TweenService
    - Efectos de impacto de bala (partículas, chispas)
    - Sistema de retroceso de cámara procedural (Camera Recoil + Screen Shake)
    - Sistema de Apuntado ADS (Zoom suave de FOV o alineación a AimPart)
    - Crosshair dinámico animado (se abre al correr o disparar)
    - Hitmarker visual y sonoro al acertar a un enemigo (normal o rojo si es Headshot)
    - Interfaz HUD moderna integrada (contador de balas, reserva, nombre e imagen del arma)
]]

local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")
local SoundService = game:GetService("SoundService")

local LocalPlayer = Players.LocalPlayer
local Camera = workspace.CurrentCamera

local ClientController = {}
ClientController.__index = ClientController

-- Variables de estado
local ActiveTool: Tool? = nil
local ActiveConfig: { [string]: any }? = nil
local CurrentAmmo = 0
local ReserveAmmo = 0
local IsReloading = false
local IsAiming = false
local IsFiring = false
local LastShotTime = 0

-- UI Elements
local ScreenGui: ScreenGui? = nil
local AmmoLabel: TextLabel? = nil
local WeaponNameLabel: TextLabel? = nil
local WeaponIconImage: ImageLabel? = nil
local CrosshairFrame: Frame? = nil
local CrosshairLines: { [string]: Frame } = {}
local HitmarkerFrame: Frame? = nil
local CurrentRecoilOffset = Vector3.new()
local TargetRecoilOffset = Vector3.new()
local OriginalFOV = 70

local Remotes = nil

function ClientController:Init()
    local FPSLibrary = require(ReplicatedStorage:WaitForChild("FPSLibrary"))
    Remotes = FPSLibrary.GetOrCreateRemotes()

    OriginalFOV = Camera.FieldOfView

    -- Construir interfaz HUD y Crosshair
    self:BuildHUD()

    -- Escuchar herramientas equipadas en el personaje de manera dinámica
    local function onCharacterAdded(char: Model)
        char.ChildAdded:Connect(function(child: Instance)
            if child:IsA("Tool") then
                self:CheckAndBindTool(child)
            end
        end)
        char.ChildRemoved:Connect(function(child: Instance)
            if child == ActiveTool then
                self:UnbindActiveTool()
            end
        end)
    end

    if LocalPlayer.Character then
        onCharacterAdded(LocalPlayer.Character)
    end
    LocalPlayer.CharacterAdded:Connect(onCharacterAdded)

    -- Eventos de replicación entrantes
    Remotes.ReplicateBullet.OnClientEvent:Connect(function(shooterPlayer: Player, origin: Vector3, targetPos: Vector3, tool: Tool)
        if shooterPlayer ~= LocalPlayer then
            self:CreateBulletVisuals(origin, targetPos, Color3.fromRGB(255, 230, 120))
        end
    end)

    Remotes.Hitmarker.OnClientEvent:Connect(function(hitData)
        self:ShowHitmarker(hitData.IsHeadshot)
    end)

    -- Bucle de renderizado para Retroceso, Apuntado suave y Crosshair
    RunService.RenderStepped:Connect(function(dt)
        self:OnRenderStep(dt)
    end)

    -- Gestión de inputs globales
    UserInputService.InputBegan:Connect(function(input, gameProcessed)
        if gameProcessed or not ActiveTool or not ActiveConfig then return end
        self:OnInputBegan(input)
    end)

    UserInputService.InputEnded:Connect(function(input)
        if not ActiveTool or not ActiveConfig then return end
        self:OnInputEnded(input)
    end)
end

-- Detecta si un Tool en el personaje es un arma FPSLibrary
function ClientController:CheckAndBindTool(tool: Tool)
    local FPSLibrary = require(ReplicatedStorage:WaitForChild("FPSLibrary"))

    -- Esperar brevemente por si los atributos o configuración se están replicando
    task.spawn(function()
        local configFolder = tool:WaitForChild("FPSWeaponConfig", 2)
        if not configFolder then return end

        local config = FPSLibrary.GetConfigFromTool(tool)
        if config then
            self:BindTool(tool, config)
        end
    end)
end

-- Vincular un Tool al equiparse
function ClientController:BindTool(tool: Tool, config: { [string]: any })
    ActiveTool = tool
    ActiveConfig = config
    CurrentAmmo = config.Bala
    ReserveAmmo = config.Recarga
    IsReloading = false
    IsAiming = false
    IsFiring = false

    if config.MostrarHUD then
        self:UpdateHUD()
        if ScreenGui then ScreenGui.Enabled = true end
    end

    if config.MostrarCrosshair and CrosshairFrame then
        CrosshairFrame.Visible = true
    end

    if config.AnimacionEquipar and LocalPlayer.Character then
        local humanoid = LocalPlayer.Character:FindFirstChildOfClass("Humanoid")
        if humanoid then
            local anim = Instance.new("Animation")
            anim.AnimationId = config.AnimacionEquipar
            local track = humanoid:LoadAnimation(anim)
            track:Play()
        end
    end
end

function ClientController:UnbindActiveTool()
    ActiveTool = nil
    ActiveConfig = nil
    IsAiming = false
    IsFiring = false
    IsReloading = false
    Camera.FieldOfView = OriginalFOV

    if ScreenGui then ScreenGui.Enabled = false end
    if CrosshairFrame then CrosshairFrame.Visible = false end
end

function ClientController:OnInputBegan(input: InputObject)
    if not ActiveConfig then return end

    local triggerInput = ActiveConfig.TeclaDisparar
    local reloadInput = ActiveConfig.TeclaRecargar
    local aimInput = ActiveConfig.TeclaApuntar

    -- Disparo
    if (input.KeyCode == triggerInput) or (input.UserInputType == triggerInput) then
        IsFiring = true
        self:HandleFireInput()
    end

    -- Recarga
    if (input.KeyCode == reloadInput) or (input.UserInputType == reloadInput) then
        self:Reload()
    end

    -- Apuntar
    if (input.KeyCode == aimInput) or (input.UserInputType == aimInput) then
        IsAiming = true
    end
end

function ClientController:OnInputEnded(input: InputObject)
    if not ActiveConfig then return end

    local triggerInput = ActiveConfig.TeclaDisparar
    local aimInput = ActiveConfig.TeclaApuntar

    if (input.KeyCode == triggerInput) or (input.UserInputType == triggerInput) then
        IsFiring = false
    end

    if (input.KeyCode == aimInput) or (input.UserInputType == aimInput) then
        IsAiming = false
    end
end

function ClientController:HandleFireInput()
    if not ActiveConfig or IsReloading then return end

    local mode = ActiveConfig.ModoDisparo

    if mode == "auto" then
        task.spawn(function()
            while IsFiring and ActiveTool and not IsReloading do
                self:Shoot()
                task.wait(ActiveConfig.Cadencia)
            end
        end)
    elseif mode == "semi" then
        self:Shoot()
    elseif mode == "rafaga" or mode == "burst" then
        task.spawn(function()
            local burstCount = ActiveConfig.BalasPorRafaga or 3
            for i = 1, burstCount do
                if not ActiveTool or IsReloading or CurrentAmmo <= 0 then break end
                self:Shoot()
                task.wait(0.08)
            end
        end)
    elseif mode == "escopeta" or mode == "shotgun" then
        self:ShootShotgun()
    else
        self:Shoot()
    end
end

function ClientController:Shoot()
    local now = tick()
    if now - LastShotTime < (ActiveConfig.Cadencia or 0.1) then
        return
    end

    if CurrentAmmo <= 0 then
        self:PlaySound(ActiveConfig.SonidoVacio)
        self:Reload()
        return
    end

    LastShotTime = now
    CurrentAmmo = CurrentAmmo - 1
    self:UpdateHUD()

    self:PlaySound(ActiveConfig.SonidoDisparo)
    self:ApplyRecoil()
    self:FireSingleBullet()
end

function ClientController:ShootShotgun()
    local now = tick()
    if now - LastShotTime < (ActiveConfig.Cadencia or 0.5) then
        return
    end

    if CurrentAmmo <= 0 then
        self:PlaySound(ActiveConfig.SonidoVacio)
        self:Reload()
        return
    end

    LastShotTime = now
    CurrentAmmo = CurrentAmmo - 1
    self:UpdateHUD()

    self:PlaySound(ActiveConfig.SonidoDisparo)
    self:ApplyRecoil()

    local pellets = ActiveConfig.Perdigones or 8
    for i = 1, pellets do
        self:FireSingleBullet(true)
    end
end

function ClientController:FireSingleBullet(isShotgun: boolean?)
    if not ActiveTool or not LocalPlayer.Character then return end

    -- Origen del disparo (Muzzle o Handle del Tool, o la cámara)
    local muzzle = ActiveTool:FindFirstChild("Muzzle") or ActiveTool:FindFirstChild("Handle") :: BasePart?
    local origin = muzzle and muzzle.Position or Camera.CFrame.Position

    -- Dirección calculada hacia el centro de la pantalla con dispersión
    local spreadFactor = ActiveConfig.Dispersion or 0.015
    if IsAiming then
        spreadFactor = spreadFactor * 0.4
    end
    if isShotgun then
        spreadFactor = spreadFactor * 3.0
    end

    local spreadX = (math.random() - 0.5) * 2 * spreadFactor
    local spreadY = (math.random() - 0.5) * 2 * spreadFactor
    local forward = Camera.CFrame.LookVector
    local right = Camera.CFrame.RightVector
    local up = Camera.CFrame.UpVector

    local direction = (forward + (right * spreadX) + (up * spreadY)).Unit
    local maxDist = ActiveConfig.DistanciaMaxima or 500

    -- Raycast con parámetros de exclusión
    local rayParams = RaycastParams.new()
    rayParams.FilterType = RaycastFilterType.Exclude
    rayParams.FilterDescendantsInstances = { LocalPlayer.Character }
    rayParams.IgnoreWater = true

    local rayResult = workspace:Raycast(Camera.CFrame.Position, direction * maxDist, rayParams)
    local endPosition = rayResult and rayResult.Position or (Camera.CFrame.Position + (direction * maxDist))
    local hitInstance = rayResult and rayResult.Instance or nil

    -- Efecto visual local de trazadora
    if ActiveConfig.TrazadoraBala then
        self:CreateBulletVisuals(origin, endPosition, ActiveConfig.ColorTrazadora)
    end

    -- Efecto de impacto
    if rayResult and ActiveConfig.EfectoImpacto then
        self:CreateImpactEffect(rayResult.Position, rayResult.Normal)
    end

    -- Enviar información al servidor para validación y daño
    Remotes.FireWeapon:FireServer(ActiveTool, {
        Origin = origin,
        Position = endPosition,
        Instance = hitInstance,
        Tool = ActiveTool
    })
end

function ClientController:CreateBulletVisuals(origin: Vector3, targetPos: Vector3, color: Color3)
    local distance = (targetPos - origin).Magnitude
    local tracer = Instance.new("Part")
    tracer.Name = "BulletTracer"
    tracer.Anchored = true
    tracer.CanCollide = false
    tracer.Material = Enum.Material.Neon
    tracer.Color = color or Color3.fromRGB(255, 230, 120)
    tracer.Size = Vector3.new(0.08, 0.08, math.clamp(distance, 0.5, 30))
    tracer.CFrame = CFrame.lookAt(origin, targetPos) * CFrame.new(0, 0, -tracer.Size.Z / 2)
    tracer.Parent = workspace

    local tweenInfo = TweenInfo.new(0.08, Enum.EasingStyle.Linear)
    local tween = TweenService:Create(tracer, tweenInfo, {
        CFrame = CFrame.lookAt(targetPos, targetPos + (targetPos - origin).Unit) * CFrame.new(0, 0, -tracer.Size.Z / 2),
        Transparency = 1
    })

    tween:Play()
    tween.Completed:Connect(function()
        tracer:Destroy()
    end)
    Debris:AddItem(tracer, 0.2)
end

function ClientController:CreateImpactEffect(pos: Vector3, normal: Vector3)
    local impactPart = Instance.new("Part")
    impactPart.Name = "ImpactFlash"
    impactPart.Size = Vector3.new(0.2, 0.2, 0.2)
    impactPart.Position = pos
    impactPart.Anchored = true
    impactPart.CanCollide = false
    impactPart.Transparency = 1
    impactPart.Parent = workspace

    local attachment = Instance.new("Attachment")
    attachment.CFrame = CFrame.lookAt(Vector3.zero, normal)
    attachment.Parent = impactPart

    local sparkles = Instance.new("ParticleEmitter")
    sparkles.Color = ColorSequence.new(Color3.fromRGB(255, 200, 80))
    sparkles.Size = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.15), NumberSequenceKeypoint.new(1, 0)})
    sparkles.Speed = NumberRange.new(5, 12)
    sparkles.Lifetime = NumberRange.new(0.1, 0.25)
    sparkles.SpreadAngle = Vector2.new(45, 45)
    sparkles.Rate = 0
    sparkles.Parent = attachment

    sparkles:Emit(6)
    Debris:AddItem(impactPart, 0.5)
end

function ClientController:ApplyRecoil()
    if not ActiveConfig then return end
    local recoilStrength = ActiveConfig.RetrocesoCamara or 1.2
    local kickUp = math.rad(recoilStrength * math.random(8, 12) / 10)
    local kickSide = math.rad((math.random() - 0.5) * recoilStrength * 0.5)

    TargetRecoilOffset = TargetRecoilOffset + Vector3.new(kickUp, kickSide, 0)
end

function ClientController:Reload()
    if IsReloading or not ActiveConfig then return end
    if CurrentAmmo >= ActiveConfig.BalaMaxima then return end
    if ReserveAmmo ~= math.huge and ReserveAmmo <= 0 then return end

    IsReloading = true
    self:PlaySound(ActiveConfig.SonidoRecarga)

    -- Animación de recarga si existe
    if ActiveConfig.AnimacionRecarga and LocalPlayer.Character then
        local humanoid = LocalPlayer.Character:FindFirstChildOfClass("Humanoid")
        if humanoid then
            local anim = Instance.new("Animation")
            anim.AnimationId = ActiveConfig.AnimacionRecarga
            local track = humanoid:LoadAnimation(anim)
            track:Play()
        end
    end

    Remotes.ReloadWeapon:FireServer(ActiveTool)

    task.delay(ActiveConfig.TiempoRecarga or 2.0, function()
        if not ActiveConfig then
            IsReloading = false
            return
        end

        local needed = ActiveConfig.BalaMaxima - CurrentAmmo
        if ReserveAmmo == math.huge then
            CurrentAmmo = ActiveConfig.BalaMaxima
        else
            local take = math.min(needed, ReserveAmmo)
            CurrentAmmo = CurrentAmmo + take
            ReserveAmmo = ReserveAmmo - take
        end

        IsReloading = false
        self:UpdateHUD()
    end)
end

function ClientController:OnRenderStep(dt: number)
    -- Suavizado de retroceso
    local recoverySpeed = (ActiveConfig and ActiveConfig.RecuperacionRetroceso) or 6.0
    CurrentRecoilOffset = CurrentRecoilOffset:Lerp(TargetRecoilOffset, math.clamp(dt * 20, 0, 1))
    TargetRecoilOffset = TargetRecoilOffset:Lerp(Vector3.new(), math.clamp(dt * recoverySpeed, 0, 1))

    if CurrentRecoilOffset.Magnitude > 0.0001 then
        Camera.CFrame = Camera.CFrame * CFrame.Angles(CurrentRecoilOffset.X, CurrentRecoilOffset.Y, 0)
    end

    -- Apuntado (ADS)
    if ActiveConfig then
        local targetFOV = OriginalFOV
        if IsAiming then
            if ActiveConfig.SistemaMira == "zoom" then
                targetFOV = ActiveConfig.ZoomFOV or 50
            end
        end
        Camera.FieldOfView = Camera.FieldOfView + (targetFOV - Camera.FieldOfView) * math.clamp(dt * 12, 0, 1)
    end

    -- Dinamismo del crosshair
    if CrosshairFrame and CrosshairFrame.Visible then
        local spreadBase = 12
        if IsAiming then
            spreadBase = 4
        end
        local char = LocalPlayer.Character
        local hum = char and char:FindFirstChildOfClass("Humanoid")
        if hum and hum.MoveDirection.Magnitude > 0 then
            spreadBase = spreadBase + 8
        end

        CrosshairLines.Top.Position = UDim2.new(0.5, -1, 0.5, -spreadBase - 8)
        CrosshairLines.Bottom.Position = UDim2.new(0.5, -1, 0.5, spreadBase)
        CrosshairLines.Left.Position = UDim2.new(0.5, -spreadBase - 8, 0.5, -1)
        CrosshairLines.Right.Position = UDim2.new(0.5, spreadBase, 0.5, -1)
    end
end

function ClientController:PlaySound(soundId: string?)
    if not soundId or soundId == "" then return end
    local sound = Instance.new("Sound")
    sound.SoundId = soundId
    sound.Volume = 0.7
    sound.Parent = SoundService
    sound:Play()
    sound.Ended:Connect(function()
        sound:Destroy()
    end)
end

function ClientController:ShowHitmarker(isHeadshot: boolean)
    if not HitmarkerFrame then return end
    HitmarkerFrame.Visible = true
    HitmarkerFrame.BackgroundColor3 = isHeadshot and Color3.fromRGB(255, 40, 40) or Color3.fromRGB(255, 255, 255)

    if ActiveConfig and ActiveConfig.SonidoHitmarker then
        self:PlaySound(ActiveConfig.SonidoHitmarker)
    end

    task.delay(0.15, function()
        if HitmarkerFrame then
            HitmarkerFrame.Visible = false
        end
    end)
end

function ClientController:UpdateHUD()
    if not AmmoLabel or not WeaponNameLabel then return end
    local reserveText = (ReserveAmmo == math.huge) and "∞" or tostring(ReserveAmmo)
    AmmoLabel.Text = string.format("%d / %s", CurrentAmmo, reserveText)
    if ActiveConfig then
        WeaponNameLabel.Text = ActiveConfig.Nombre or "Arma"
        if WeaponIconImage and ActiveConfig.ImagenArma and ActiveConfig.ImagenArma ~= "" then
            WeaponIconImage.Image = ActiveConfig.ImagenArma
            WeaponIconImage.Visible = true
        elseif WeaponIconImage then
            WeaponIconImage.Visible = false
        end
    end
end

function ClientController:BuildHUD()
    local playerGui = LocalPlayer:WaitForChild("PlayerGui")
    ScreenGui = Instance.new("ScreenGui")
    ScreenGui.Name = "FPSLibrary_HUD"
    ScreenGui.ResetOnSpawn = false
    ScreenGui.Enabled = false
    ScreenGui.Parent = playerGui

    -- Contenedor de Munición en la esquina inferior derecha
    local ammoContainer = Instance.new("Frame")
    ammoContainer.Name = "AmmoContainer"
    ammoContainer.Size = UDim2.new(0, 220, 0, 70)
    ammoContainer.Position = UDim2.new(1, -240, 1, -90)
    ammoContainer.BackgroundColor3 = Color3.fromRGB(20, 24, 30)
    ammoContainer.BackgroundTransparency = 0.25
    ammoContainer.BorderSizePixel = 0
    ammoContainer.Parent = ScreenGui

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 10)
    corner.Parent = ammoContainer

    local stroke = Instance.new("UIStroke")
    stroke.Color = Color3.fromRGB(0, 180, 255)
    stroke.Thickness = 1.5
    stroke.Parent = ammoContainer

    WeaponIconImage = Instance.new("ImageLabel")
    WeaponIconImage.Name = "WeaponIcon"
    WeaponIconImage.Size = UDim2.new(0, 45, 0, 45)
    WeaponIconImage.Position = UDim2.new(0, 12, 0.5, -22)
    WeaponIconImage.BackgroundTransparency = 1
    WeaponIconImage.Visible = false
    WeaponIconImage.Parent = ammoContainer

    WeaponNameLabel = Instance.new("TextLabel")
    WeaponNameLabel.Name = "WeaponName"
    WeaponNameLabel.Size = UDim2.new(0, 150, 0, 20)
    WeaponNameLabel.Position = UDim2.new(0, 65, 0, 10)
    WeaponNameLabel.BackgroundTransparency = 1
    WeaponNameLabel.Font = Enum.Font.GothamBold
    WeaponNameLabel.TextSize = 14
    WeaponNameLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
    WeaponNameLabel.TextXAlignment = Enum.TextXAlignment.Left
    WeaponNameLabel.Text = "Rifle"
    WeaponNameLabel.Parent = ammoContainer

    AmmoLabel = Instance.new("TextLabel")
    AmmoLabel.Name = "AmmoCount"
    AmmoLabel.Size = UDim2.new(0, 150, 0, 30)
    AmmoLabel.Position = UDim2.new(0, 65, 0, 30)
    AmmoLabel.BackgroundTransparency = 1
    AmmoLabel.Font = Enum.Font.GothamBlack
    AmmoLabel.TextSize = 22
    AmmoLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    AmmoLabel.TextXAlignment = Enum.TextXAlignment.Left
    AmmoLabel.Text = "30 / 90"
    AmmoLabel.Parent = ammoContainer

    -- Crosshair dinámico en el centro de pantalla
    CrosshairFrame = Instance.new("Frame")
    CrosshairFrame.Name = "CrosshairFrame"
    CrosshairFrame.Size = UDim2.new(0, 40, 0, 40)
    CrosshairFrame.Position = UDim2.new(0.5, -20, 0.5, -20)
    CrosshairFrame.BackgroundTransparency = 1
    CrosshairFrame.Visible = false
    CrosshairFrame.Parent = ScreenGui

    local function makeCrosshairLine(name: string, size: UDim2, pos: UDim2): Frame
        local line = Instance.new("Frame")
        line.Name = name
        line.Size = size
        line.Position = pos
        line.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
        line.BorderSizePixel = 0
        line.Parent = CrosshairFrame
        return line
    end

    CrosshairLines.Top = makeCrosshairLine("Top", UDim2.new(0, 2, 0, 8), UDim2.new(0.5, -1, 0.5, -18))
    CrosshairLines.Bottom = makeCrosshairLine("Bottom", UDim2.new(0, 2, 0, 8), UDim2.new(0.5, -1, 0.5, 10))
    CrosshairLines.Left = makeCrosshairLine("Left", UDim2.new(0, 8, 0, 2), UDim2.new(0.5, -18, 0.5, -1))
    CrosshairLines.Right = makeCrosshairLine("Right", UDim2.new(0, 8, 0, 2), UDim2.new(0.5, 10, 0.5, -1))

    -- Hitmarker Indicator
    HitmarkerFrame = Instance.new("Frame")
    HitmarkerFrame.Name = "Hitmarker"
    HitmarkerFrame.Size = UDim2.new(0, 8, 0, 8)
    HitmarkerFrame.Position = UDim2.new(0.5, -4, 0.5, -4)
    HitmarkerFrame.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
    HitmarkerFrame.BorderSizePixel = 0
    HitmarkerFrame.Rotation = 45
    HitmarkerFrame.Visible = false
    HitmarkerFrame.Parent = ScreenGui
end

return ClientController
