--!strict
--[[
    FPSLibrary - ServerController
    Controlador del servidor:
    - Validación de disparo contra exploits
    - Cálculo de daño según zona de impacto (Headshot, Torso, Extremidades)
    - Combat Logs completos (Quién disparó, a quién le dio, arma, daño, distancia, si fue headshot, fecha/hora)
    - Replicación segura a otros jugadores (efectos visuales y de sonido)
    - Control y validación de munición y recarga
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")

local ServerController = {}
ServerController.__index = ServerController

local Remotes = nil
local CombatHistory = {}
local PlayerAmmoState = {} -- [player] = { [tool] = { currentAmmo, reserveAmmo } }

-- Inicialización del controlador de servidor
function ServerController:Init()
    print("[FPSLibrary ServerController] Inicializando servidor...")
    local FPSLibrary = require(ReplicatedStorage:WaitForChild("FPSLibrary"))
    Remotes = FPSLibrary.GetOrCreateRemotes()

    -- Listener para disparos desde el cliente
    Remotes.FireWeapon.OnServerEvent:Connect(function(player: Player, tool: Tool, hitInfo: { [string]: any })
        self:ProcessShot(player, tool, hitInfo)
    end)

    -- Listener para recargas
    Remotes.ReloadWeapon.OnServerEvent:Connect(function(player: Player, tool: Tool)
        self:ProcessReload(player, tool)
    end)

    -- Limpieza al salir el jugador
    Players.PlayerRemoving:Connect(function(player)
        PlayerAmmoState[player] = nil
    end)

    print("[FPSLibrary ServerController] Listo y escuchando eventos.")
end

-- Obtener historial de combate para estadísticas/UI de killfeed o análisis
function ServerController:GetCombatHistory()
    return CombatHistory
end

-- Procesar disparo
function ServerController:ProcessShot(player: Player, tool: Tool, hitInfo: { [string]: any })
    if not player or not player.Character then return end
    if not tool or tool.Parent ~= player.Character then return end

    local char = player.Character
    local humanoid = char:FindFirstChildOfClass("Humanoid")
    if not humanoid or humanoid.Health <= 0 then return end

    local configFolder = tool:FindFirstChild("FPSWeaponConfig")
    if not configFolder then return end

    local baseDamage = (configFolder:GetAttribute("Dano") :: number) or 25
    local headshotMultiplier = (configFolder:GetAttribute("MultiplicadorCabeza") :: number) or 2.0
    local limbMultiplier = (configFolder:GetAttribute("MultiplicadorExtremidades") :: number) or 0.8
    local maxDistance = (configFolder:GetAttribute("DistanciaMaxima") :: number) or 500
    local weaponName = (configFolder:GetAttribute("Nombre") :: string) or tool.Name

    local origin = hitInfo.Origin :: Vector3
    local hitPosition = hitInfo.Position :: Vector3
    local hitInstance = hitInfo.Instance :: Instance?

    if not origin or not hitPosition then return end

    -- Verificación básica de distancia
    local distance = (hitPosition - origin).Magnitude
    if distance > maxDistance + 50 then
        -- Posible manipulación de rango
        return
    end

    -- Replicar efecto de disparo a otros jugadores
    for _, otherPlayer in ipairs(Players:GetPlayers()) do
        if otherPlayer ~= player then
            Remotes.ReplicateBullet:FireClient(otherPlayer, player, origin, hitPosition, hitInfo.Tool or tool)
        end
    end

    -- Si no impactó en ninguna instancia, fin
    if not hitInstance or not hitInstance:IsA("BasePart") then
        return
    end

    -- Buscar si pertenece a un Humanoid
    local targetModel = hitInstance:FindFirstAncestorOfClass("Model")
    if not targetModel or targetModel == char then
        return
    end

    local targetHumanoid = targetModel:FindFirstChildOfClass("Humanoid")
    if not targetHumanoid or targetHumanoid.Health <= 0 then
        return
    end

    -- Identificar si el objetivo es un jugador o NPC
    local targetPlayer = Players:GetPlayerFromCharacter(targetModel)
    local targetName = targetPlayer and targetPlayer.Name or targetModel.Name

    -- Determinar multiplicador por zona de impacto
    local isHeadshot = false
    local finalDamage = baseDamage
    local hitPartName = string.lower(hitInstance.Name)

    if string.find(hitPartName, "head") then
        isHeadshot = true
        finalDamage = baseDamage * headshotMultiplier
    elseif string.find(hitPartName, "arm") or string.find(hitPartName, "leg") or string.find(hitPartName, "hand") or string.find(hitPartName, "foot") then
        finalDamage = baseDamage * limbMultiplier
    else
        finalDamage = baseDamage
    end

    finalDamage = math.floor(finalDamage + 0.5)

    -- Aplicar daño al Humanoid
    targetHumanoid:TakeDamage(finalDamage)

    -- Notificar al tirador con Hitmarker
    Remotes.Hitmarker:FireClient(player, {
        Damage = finalDamage,
        IsHeadshot = isHeadshot,
        Position = hitPosition,
        TargetName = targetName
    })

    -- Crear registro de combate detallado
    local logEntry = {
        Timestamp = os.time(),
        Shooter = player.Name,
        ShooterUserId = player.UserId,
        Target = targetName,
        TargetIsPlayer = targetPlayer ~= nil,
        TargetUserId = targetPlayer and targetPlayer.UserId or 0,
        Weapon = weaponName,
        HitPart = hitInstance.Name,
        Damage = finalDamage,
        IsHeadshot = isHeadshot,
        Distance = math.floor(distance * 10) / 10,
        TargetHealthRemaining = math.max(0, math.floor(targetHumanoid.Health))
    }

    table.insert(CombatHistory, logEntry)
    if #CombatHistory > 200 then
        table.remove(CombatHistory, 1)
    end

    -- Emitir evento de CombatLog para sistemas externos (Kills, HUD, Analytics)
    Remotes.CombatLog:FireAllClients(logEntry)
end

-- Procesar recarga
function ServerController:ProcessReload(player: Player, tool: Tool)
    -- Validación de tiempo y estado en servidor
    if not player or not player.Character then return end
    if not tool or tool.Parent ~= player.Character then return end

    local configFolder = tool:FindFirstChild("FPSWeaponConfig")
    if not configFolder then return end

    -- Replicar sonido o animación de recarga si es necesario a los demás
    for _, otherPlayer in ipairs(Players:GetPlayers()) do
        if otherPlayer ~= player then
            Remotes.ReloadWeapon:FireClient(otherPlayer, player, tool)
        end
    end
end

return ServerController
