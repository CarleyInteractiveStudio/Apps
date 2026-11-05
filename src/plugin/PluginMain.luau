--!strict
--[[
    FPSLibrary - Roblox Studio Plugin con Interfaz Gráfica (UI)

    Características:
    1. Botón "Instalar Sistema":
       - Coloca y estructura automáticamente los módulos y controladores en ReplicatedStorage,
         ServerScriptService y StarterPlayerScripts con 1 solo clic.
    2. "Generador de Armas" (Weapon Generator UI):
       - Formulario visual para crear un nuevo Tool de arma FPS configurado:
         * Nombre del Arma
         * Balas en cargador (ej. 30)
         * Munición de recarga (ej. "ilimited" o 90)
         * Daño base (ej. 35)
         * Multiplicador por Headshot (ej. 2.0)
         * Modo de disparo (Auto, Semi, Rafaga, Escopeta)
         * Tecla de recarga (ej. "r")
         * Tecla de apuntar (ej. "click_derecho")
         * Imagen/Icono para el HUD
         * Crear Tool completo con Handle, Muzzle y Script listo para disparar.
]]

local ChangeHistoryService = game:GetService("ChangeHistoryService")
local Selection = game:GetService("Selection")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")
local StarterPlayer = game:GetService("StarterPlayer")
local StarterPlayerScripts = StarterPlayer:WaitForChild("StarterPlayerScripts", 5) or StarterPlayer:FindFirstChild("StarterPlayerScripts")

-- Crear la barra de herramientas y botón en la pestaña de Plugins de Roblox Studio
local toolbar = plugin:CreateToolbar("FPS Library Studio")
local toggleButton = toolbar:CreateButton(
    "FPS Creator",
    "Abre el panel de control e instalación de FPSLibrary",
    "rbxassetid://6031075931"
)

-- Configuración del DockWidgetPluginGui
local widgetInfo = DockWidgetPluginGuiInfo.new(
    Enum.InitialDockState.Float,
    false,
    false,
    380,
    540,
    340,
    420
)

local widget = plugin:CreateDockWidgetPluginGui("FPSLibraryStudioPanel", widgetInfo)
widget.Title = "FPS Library - Panel de Control"

toggleButton.Click:Connect(function()
    widget.Enabled = not widget.Enabled
end)

-- UI Base
local background = Instance.new("ScrollingFrame")
background.Name = "PanelBackground"
background.Size = UDim2.new(1, 0, 1, 0)
background.BackgroundColor3 = Color3.fromRGB(24, 26, 32)
background.BorderSizePixel = 0
background.ScrollBarThickness = 6
background.CanvasSize = UDim2.new(0, 0, 0, 720)
background.Parent = widget

local padding = Instance.new("UIPadding")
padding.PaddingTop = UDim.new(0, 15)
padding.PaddingLeft = UDim.new(0, 15)
padding.PaddingRight = UDim.new(0, 15)
padding.PaddingBottom = UDim.new(0, 20)
padding.Parent = background

local layout = Instance.new("UIListLayout")
layout.SortOrder = Enum.SortOrder.LayoutOrder
layout.Padding = UDim.new(0, 12)
layout.Parent = background

-- Encabezado
local titleLabel = Instance.new("TextLabel")
titleLabel.Name = "HeaderTitle"
titleLabel.Text = "FPS Library v2.0"
titleLabel.Font = Enum.Font.GothamBlack
titleLabel.TextSize = 20
titleLabel.TextColor3 = Color3.fromRGB(0, 200, 255)
titleLabel.Size = UDim2.new(1, 0, 0, 25)
titleLabel.BackgroundTransparency = 1
titleLabel.LayoutOrder = 1
titleLabel.Parent = background

local descLabel = Instance.new("TextLabel")
descLabel.Name = "HeaderDesc"
descLabel.Text = "Configura e instala tu sistema de armas FPS en segundos."
descLabel.Font = Enum.Font.Gotham
descLabel.TextSize = 12
descLabel.TextColor3 = Color3.fromRGB(160, 165, 175)
descLabel.Size = UDim2.new(1, 0, 0, 20)
descLabel.BackgroundTransparency = 1
descLabel.LayoutOrder = 2
descLabel.Parent = background

-- SECCIÓN 1: Instalación del Sistema
local installSection = Instance.new("Frame")
installSection.Name = "InstallSection"
installSection.Size = UDim2.new(1, 0, 0, 85)
installSection.BackgroundColor3 = Color3.fromRGB(32, 35, 45)
installSection.BorderSizePixel = 0
installSection.LayoutOrder = 3
installSection.Parent = background

local installCorner = Instance.new("UICorner")
installCorner.CornerRadius = UDim.new(0, 8)
installCorner.Parent = installSection

local installBtn = Instance.new("TextButton")
installBtn.Name = "InstallBtn"
installBtn.Size = UDim2.new(1, -20, 0, 42)
installBtn.Position = UDim2.new(0, 10, 0, 10)
installBtn.BackgroundColor3 = Color3.fromRGB(0, 150, 230)
installBtn.Font = Enum.Font.GothamBold
installBtn.TextSize = 14
installBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
installBtn.Text = "⚡ Instalar Sistema en el Juego (1-Clic)"
installBtn.BorderSizePixel = 0
installBtn.Parent = installSection

local installBtnCorner = Instance.new("UICorner")
installBtnCorner.CornerRadius = UDim.new(0, 6)
installBtnCorner.Parent = installBtn

local statusLabel = Instance.new("TextLabel")
statusLabel.Name = "StatusLabel"
statusLabel.Size = UDim2.new(1, -20, 0, 20)
statusLabel.Position = UDim2.new(0, 10, 0, 58)
statusLabel.BackgroundTransparency = 1
statusLabel.Font = Enum.Font.GothamMedium
statusLabel.TextSize = 11
statusLabel.TextColor3 = Color3.fromRGB(140, 220, 140)
statusLabel.Text = "Estado: Listo para instalar"
statusLabel.Parent = installSection

-- SECCIÓN 2: Generador de Armas
local genSectionTitle = Instance.new("TextLabel")
genSectionTitle.Text = "Generador Visual de Armas"
genSectionTitle.Font = Enum.Font.GothamBold
genSectionTitle.TextSize = 16
genSectionTitle.TextColor3 = Color3.fromRGB(255, 255, 255)
genSectionTitle.Size = UDim2.new(1, 0, 0, 22)
genSectionTitle.BackgroundTransparency = 1
genSectionTitle.LayoutOrder = 4
genSectionTitle.Parent = background

local formFrame = Instance.new("Frame")
formFrame.Name = "FormFrame"
formFrame.Size = UDim2.new(1, 0, 0, 480)
formFrame.BackgroundColor3 = Color3.fromRGB(32, 35, 45)
formFrame.BorderSizePixel = 0
formFrame.LayoutOrder = 5
formFrame.Parent = background

local formCorner = Instance.new("UICorner")
formCorner.CornerRadius = UDim.new(0, 8)
formCorner.Parent = formFrame

local formLayout = Instance.new("UIListLayout")
formLayout.SortOrder = Enum.SortOrder.LayoutOrder
formLayout.Padding = UDim.new(0, 8)
formLayout.Parent = formFrame

local formPadding = Instance.new("UIPadding")
formPadding.PaddingTop = UDim.new(0, 12)
formPadding.PaddingLeft = UDim.new(0, 12)
formPadding.PaddingRight = UDim.new(0, 12)
formPadding.PaddingBottom = UDim.new(0, 12)
formPadding.Parent = formFrame

local function createInputField(name: string, labelText: string, defaultText: string, order: number): TextBox
    local container = Instance.new("Frame")
    container.Name = name .. "_Container"
    container.Size = UDim2.new(1, 0, 0, 36)
    container.BackgroundTransparency = 1
    container.LayoutOrder = order
    container.Parent = formFrame

    local lbl = Instance.new("TextLabel")
    lbl.Text = labelText
    lbl.Font = Enum.Font.GothamMedium
    lbl.TextSize = 12
    lbl.TextColor3 = Color3.fromRGB(190, 195, 205)
    lbl.Size = UDim2.new(0.48, 0, 1, 0)
    lbl.BackgroundTransparency = 1
    lbl.TextXAlignment = Enum.TextXAlignment.Left
    lbl.Parent = container

    local box = Instance.new("TextBox")
    box.Name = name .. "_Input"
    box.Text = defaultText
    box.PlaceholderText = defaultText
    box.Font = Enum.Font.Gotham
    box.TextSize = 12
    box.TextColor3 = Color3.fromRGB(255, 255, 255)
    box.BackgroundColor3 = Color3.fromRGB(22, 24, 30)
    box.Size = UDim2.new(0.5, 0, 1, 0)
    box.Position = UDim2.new(0.5, 0, 0, 0)
    box.BorderSizePixel = 0
    box.Parent = container

    local boxCorner = Instance.new("UICorner")
    boxCorner.CornerRadius = UDim.new(0, 4)
    boxCorner.Parent = box

    return box
end

local inputNombre = createInputField("Nombre", "Nombre del Arma:", "Rifle Asalto M4", 1)
local inputBalas = createInputField("Balas", "Balas en cargador:", "30", 2)
local inputRecarga = createInputField("Recarga", "Reserva (o 'ilimited'):", "90", 3)
local inputDano = createInputField("Dano", "Daño Base:", "32", 4)
local inputModo = createInputField("Modo", "Modo (auto/semi/escopeta):", "auto", 5)
local inputTeclaR = createInputField("TeclaR", "Tecla Recargar:", "r", 6)
local inputTeclaAim = createInputField("TeclaAim", "Tecla Apuntar:", "click_derecho", 7)
local inputImagen = createInputField("Imagen", "ID Imagen HUD (opcional):", "", 8)

-- Botón para Crear el Arma
local createWeaponBtn = Instance.new("TextButton")
createWeaponBtn.Name = "CreateWeaponBtn"
createWeaponBtn.Size = UDim2.new(1, 0, 0, 44)
createWeaponBtn.BackgroundColor3 = Color3.fromRGB(46, 204, 113)
createWeaponBtn.Font = Enum.Font.GothamBold
createWeaponBtn.TextSize = 14
createWeaponBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
createWeaponBtn.Text = "🔫 Crear Arma en Workspace"
createWeaponBtn.BorderSizePixel = 0
createWeaponBtn.LayoutOrder = 10
createWeaponBtn.Parent = formFrame

local createWeaponCorner = Instance.new("UICorner")
createWeaponCorner.CornerRadius = UDim.new(0, 6)
createWeaponCorner.Parent = createWeaponBtn

-- Lógica del botón "Instalar Sistema en el Juego"
installBtn.MouseButton1Click:Connect(function()
    ChangeHistoryService:SetWaypoint("Antes de Instalar FPSLibrary")

    -- 1. Instalar o asegurar RemoteEvents
    local remotesFolder = ReplicatedStorage:FindFirstChild("FPSLibrary_Remotes")
    if not remotesFolder then
        remotesFolder = Instance.new("Folder")
        remotesFolder.Name = "FPSLibrary_Remotes"
        remotesFolder.Parent = ReplicatedStorage

        local remotes = {"FireWeapon", "ReplicateBullet", "ReloadWeapon", "CombatLog", "Hitmarker"}
        for _, rName in ipairs(remotes) do
            local ev = Instance.new("RemoteEvent")
            ev.Name = rName
            ev.Parent = remotesFolder
        end
    end

    -- 2. Asegurar módulos en ReplicatedStorage
    local function ensureModule(name: string, sourceCandidate: Instance?): ModuleScript
        local existing = ReplicatedStorage:FindFirstChild(name)
        if existing and existing:IsA("ModuleScript") then
            return existing
        end
        if sourceCandidate and sourceCandidate:IsA("ModuleScript") then
            local cloned = sourceCandidate:Clone()
            cloned.Name = name
            cloned.Parent = ReplicatedStorage
            return cloned
        end
        local newMod = Instance.new("ModuleScript")
        newMod.Name = name
        newMod.Parent = ReplicatedStorage
        return newMod
    end

    local pluginFolder = script.Parent
    local mainMod = ensureModule("FPSLibrary", pluginFolder:FindFirstChild("FPSLibrary"))
    local serverMod = ensureModule("FPSLibrary_ServerController", pluginFolder:FindFirstChild("ServerController"))
    local clientMod = ensureModule("FPSLibrary_ClientController", pluginFolder:FindFirstChild("ClientController"))

    -- 3. Crear ServerScript en ServerScriptService
    local serverScript = ServerScriptService:FindFirstChild("FPSLibrary_ServerController")
    if not serverScript then
        serverScript = Instance.new("Script")
        serverScript.Name = "FPSLibrary_ServerController"
        serverScript.Source = [[-- Inicializador del servidor FPSLibrary
local ServerController = require(game:GetService("ReplicatedStorage"):WaitForChild("FPSLibrary_ServerController"))
ServerController:Init()
]]
        serverScript.Parent = ServerScriptService
    end

    -- 4. Crear ClientScript en StarterPlayerScripts
    if StarterPlayerScripts then
        local clientScript = StarterPlayerScripts:FindFirstChild("FPSLibrary_ClientController")
        if not clientScript then
            clientScript = Instance.new("LocalScript")
            clientScript.Name = "FPSLibrary_ClientController"
            clientScript.Source = [[-- Inicializador del cliente FPSLibrary
local ClientController = require(game:GetService("ReplicatedStorage"):WaitForChild("FPSLibrary_ClientController"))
ClientController:Init()
]]
            clientScript.Parent = StarterPlayerScripts
        end
    end

    statusLabel.Text = "✅ ¡Sistema instalado correctamente en los servicios!"
    statusLabel.TextColor3 = Color3.fromRGB(100, 255, 120)
    ChangeHistoryService:SetWaypoint("Instalacion FPSLibrary Completada")
end)

-- Lógica del botón "Crear Arma"
createWeaponBtn.MouseButton1Click:Connect(function()
    ChangeHistoryService:SetWaypoint("Antes de Crear Arma FPS")

    local weaponName = inputNombre.Text ~= "" and inputNombre.Text or "Arma FPS"
    local balasVal = tonumber(inputBalas.Text) or 30
    local recargaVal = inputRecarga.Text ~= "" and inputRecarga.Text or "90"
    local danoVal = tonumber(inputDano.Text) or 30
    local modoVal = inputModo.Text ~= "" and string.lower(inputModo.Text) or "auto"
    local teclaRVal = inputTeclaR.Text ~= "" and inputTeclaR.Text or "r"
    local teclaAimVal = inputTeclaAim.Text ~= "" and inputTeclaAim.Text or "click_derecho"
    local imagenVal = inputImagen.Text

    -- Crear Tool
    local tool = Instance.new("Tool")
    tool.Name = weaponName
    tool.RequiresHandle = true
    tool.CanBeDropped = true

    -- Crear Handle básico
    local handle = Instance.new("Part")
    handle.Name = "Handle"
    handle.Size = Vector3.new(0.5, 0.8, 2.2)
    handle.Color = Color3.fromRGB(40, 40, 45)
    handle.Material = Enum.Material.Metal
    handle.Parent = tool

    -- Crear Muzzle (punto de salida de la bala)
    local muzzle = Instance.new("Attachment")
    muzzle.Name = "Muzzle"
    muzzle.Position = Vector3.new(0, 0.2, -1.1)
    muzzle.Parent = handle

    -- Crear Script configurador dentro del arma
    local weaponScript = Instance.new("Script")
    weaponScript.Name = "ConfiguracionArma"
    weaponScript.Source = string.format([[-- Script de Configuración de %s
-- Esta arma utiliza FPSLibrary. ¡Modifica los valores a tu gusto!

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local FPSLibrary = require(ReplicatedStorage:WaitForChild("FPSLibrary"))

FPSLibrary:RegisterWeapon(script.Parent, {
    nombre = "%s",
    bala = %d,
    recarga = "%s",
    dano = %d,
    modo_disparo = "%s",
    tecla_recargar = "%s",
    tecla_apuntar = "%s",
    imagen_arma = "%s",

    -- Opciones adicionales listas para personalizar:
    multiplicador_cabeza = 2.0,
    sistema_mira = "zoom",
    zoom_fov = 50,
    retroceso_camara = 1.2
})
]], weaponName, weaponName, balasVal, recargaVal, danoVal, modoVal, teclaRVal, teclaAimVal, imagenVal)
    weaponScript.Parent = tool

    -- Ubicar en Workspace y seleccionarlo
    tool.Parent = workspace
    Selection:Set({tool})

    statusLabel.Text = string.format("🔫 Arma '%s' creada en Workspace!", weaponName)
    statusLabel.TextColor3 = Color3.fromRGB(0, 200, 255)
    ChangeHistoryService:SetWaypoint("Arma FPS Creada")
end)
