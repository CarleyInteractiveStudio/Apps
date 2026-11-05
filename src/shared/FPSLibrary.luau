--!strict
--[[
    FPSLibrary - Shared Module / Auto-Installer / Configuration Parser
    Biblioteca de Armas FPS para Roblox de configuración declarativa ultra-simple.
]]

local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")
local StarterPlayer = game:GetService("StarterPlayer")
local StarterPlayerScripts = StarterPlayer:WaitForChild("StarterPlayerScripts", 5) or StarterPlayer:FindFirstChild("StarterPlayerScripts")

local FPSLibrary = {}
FPSLibrary.__index = FPSLibrary
FPSLibrary.Version = "2.0.0"

-- Tabla para almacenar armas registradas localmente o en el servidor
FPSLibrary.RegisteredWeapons = {}

-- Mapa amigable de teclas para que el usuario no necesite saber Enum.KeyCode
local KeyMap = {
    ["a"] = Enum.KeyCode.A, ["b"] = Enum.KeyCode.B, ["c"] = Enum.KeyCode.C,
    ["d"] = Enum.KeyCode.D, ["e"] = Enum.KeyCode.E, ["f"] = Enum.KeyCode.F,
    ["g"] = Enum.KeyCode.G, ["h"] = Enum.KeyCode.H, ["i"] = Enum.KeyCode.I,
    ["j"] = Enum.KeyCode.J, ["k"] = Enum.KeyCode.K, ["l"] = Enum.KeyCode.L,
    ["m"] = Enum.KeyCode.M, ["n"] = Enum.KeyCode.N, ["o"] = Enum.KeyCode.O,
    ["p"] = Enum.KeyCode.P, ["q"] = Enum.KeyCode.Q, ["r"] = Enum.KeyCode.R,
    ["s"] = Enum.KeyCode.S, ["t"] = Enum.KeyCode.T, ["u"] = Enum.KeyCode.U,
    ["v"] = Enum.KeyCode.V, ["w"] = Enum.KeyCode.W, ["x"] = Enum.KeyCode.X,
    ["y"] = Enum.KeyCode.Y, ["z"] = Enum.KeyCode.Z,
    ["1"] = Enum.KeyCode.One, ["2"] = Enum.KeyCode.Two, ["3"] = Enum.KeyCode.Three,
    ["4"] = Enum.KeyCode.Four, ["5"] = Enum.KeyCode.Five, ["6"] = Enum.KeyCode.Six,
    ["7"] = Enum.KeyCode.Seven, ["8"] = Enum.KeyCode.Eight, ["9"] = Enum.KeyCode.Nine,
    ["0"] = Enum.KeyCode.Zero,
    ["espacio"] = Enum.KeyCode.Space, ["space"] = Enum.KeyCode.Space,
    ["shift"] = Enum.KeyCode.LeftShift, ["shift_izq"] = Enum.KeyCode.LeftShift,
    ["shift_der"] = Enum.KeyCode.RightShift,
    ["ctrl"] = Enum.KeyCode.LeftControl, ["control"] = Enum.KeyCode.LeftControl,
    ["tab"] = Enum.KeyCode.Tab,
    ["f"] = Enum.KeyCode.F,
    ["e"] = Enum.KeyCode.E,
    ["q"] = Enum.KeyCode.Q,
    ["v"] = Enum.KeyCode.V
}

local MouseMap = {
    ["click_izquierdo"] = Enum.UserInputType.MouseButton1,
    ["click_izq"] = Enum.UserInputType.MouseButton1,
    ["mouse1"] = Enum.UserInputType.MouseButton1,
    ["click_derecho"] = Enum.UserInputType.MouseButton2,
    ["click_der"] = Enum.UserInputType.MouseButton2,
    ["mouse2"] = Enum.UserInputType.MouseButton2,
    ["click_medio"] = Enum.UserInputType.MouseButton3,
    ["mouse3"] = Enum.UserInputType.MouseButton3
}

-- Función para normalizar inputs desde strings o Enums
function FPSLibrary.ParseInput(inputVal: any, defaultKey: any)
    if typeof(inputVal) == "EnumItem" then
        return inputVal
    end
    if typeof(inputVal) == "string" then
        local lowerStr = string.lower(inputVal)
        if MouseMap[lowerStr] then
            return MouseMap[lowerStr]
        end
        if KeyMap[lowerStr] then
            return KeyMap[lowerStr]
        end
        -- Intento por Enum directo
        local success, keycode = pcall(function()
            return (Enum.KeyCode :: any)[inputVal]
        end)
        if success and keycode then
            return keycode
        end
    end
    return defaultKey
end

-- Normaliza la configuración amigable del usuario con valores por defecto inteligentes
function FPSLibrary.NormalizeConfig(userConfig: { [string]: any }?)
    local raw = userConfig or {}

    local config = {
        -- Identificación
        Nombre = raw.Nombre or raw.nombre or "Arma FPS",
        Id = raw.Id or raw.id or raw.Nombre or "Arma_" .. tostring(math.random(1000, 9999)),

        -- Munición y Recarga
        Bala = tonumber(raw.Bala or raw.bala or raw.balas or raw.Municion or 30) or 30,
        BalaMaxima = tonumber(raw.BalaMaxima or raw.bala_maxima or raw.Bala or raw.bala or 30) or 30,
        Recarga = raw.Recarga or raw.recarga or 90, -- puede ser número o "ilimited" / "infinito"
        TiempoRecarga = tonumber(raw.TiempoRecarga or raw.tiempo_recarga or 2.0) or 2.0,

        -- Daño y Balística
        Dano = tonumber(raw.Dano or raw.dano or raw.Daño or raw.daño or 25) or 25,
        MultiplicadorCabeza = tonumber(raw.MultiplicadorCabeza or raw.multiplicador_cabeza or raw.DanoCabeza or 2.0) or 2.0,
        MultiplicadorExtremidades = tonumber(raw.MultiplicadorExtremidades or raw.multiplicador_extremidades or 0.8) or 0.8,
        DistanciaMaxima = tonumber(raw.DistanciaMaxima or raw.distancia_maxima or 500) or 500,
        Dispersion = tonumber(raw.Dispersion or raw.dispersion or raw.Spread or 0.015) or 0.015,
        DispersionMovimiento = tonumber(raw.DispersionMovimiento or raw.dispersion_movimiento or 0.04) or 0.04,

        -- Modo de Disparo y Cadencia
        ModoDisparo = string.lower(tostring(raw.ModoDisparo or raw.modo_disparo or raw.Modo or raw.modo or "auto")),
        -- Modos soportados: "auto", "semi", "rafaga" (burst), "escopeta" (shotgun)
        Cadencia = tonumber(raw.Cadencia or raw.cadencia or raw.FireRate or 0.12) or 0.12,
        Perdigones = tonumber(raw.Perdigones or raw.perdigones or 8) or 8, -- solo si es escopeta
        BalasPorRafaga = tonumber(raw.BalasPorRafaga or raw.balas_por_rafaga or 3) or 3,

        -- Teclas y Controles
        TeclaDisparar = FPSLibrary.ParseInput(raw.TeclaDisparar or raw.tecla_disparar or raw.Disparar, Enum.UserInputType.MouseButton1),
        TeclaRecargar = FPSLibrary.ParseInput(raw.TeclaRecargar or raw.tecla_recargar or raw.Recargar or "r", Enum.KeyCode.R),
        TeclaApuntar = FPSLibrary.ParseInput(raw.TeclaApuntar or raw.tecla_apuntar or raw.Apuntar or "click_derecho", Enum.UserInputType.MouseButton2),

        -- Apuntado (ADS)
        SistemaMira = string.lower(tostring(raw.SistemaMira or raw.sistema_mira or raw.Mira or "zoom")), -- "zoom" o "posicion" / "cframe"
        ZoomFOV = tonumber(raw.ZoomFOV or raw.zoom_fov or raw.FOV or 50) or 50,
        SensibilidadApuntado = tonumber(raw.SensibilidadApuntado or raw.sensibilidad_apuntado or 0.6) or 0.6,
        ParteMira = raw.ParteMira or raw.parte_mira or "AimPart", -- Part dentro del Tool para alinear cámara si es modo posicion

        -- Retroceso (Recoil)
        RetrocesoCamara = tonumber(raw.RetrocesoCamara or raw.retroceso_camara or raw.Retroceso or 1.2) or 1.2,
        RecuperacionRetroceso = tonumber(raw.RecuperacionRetroceso or raw.recuperacion_retroceso or 5.0) or 5.0,

        -- Efectos y Sonidos
        SonidoDisparo = raw.SonidoDisparo or raw.sonido_disparo or nil,
        SonidoRecarga = raw.SonidoRecarga or raw.sonido_recarga or nil,
        SonidoVacio = raw.SonidoVacio or raw.sonido_vacio or nil,
        SonidoHitmarker = raw.SonidoHitmarker or raw.sonido_hitmarker or "rbxassetid://6023253508",

        EfectoImpacto = raw.EfectoImpacto ~= false and (raw.efecto_impacto ~= false),
        TrazadoraBala = raw.TrazadoraBala ~= false and (raw.trazadora_bala ~= false),
        ColorTrazadora = raw.ColorTrazadora or raw.color_trazadora or Color3.fromRGB(255, 230, 120),

        -- Animaciones
        AnimacionEquipar = raw.AnimacionEquipar or raw.animacion_equipar or nil,
        AnimacionDisparo = raw.AnimacionDisparo or raw.animacion_disparo or nil,
        AnimacionRecarga = raw.AnimacionRecarga or raw.animacion_recarga or nil,
        AnimacionApuntar = raw.AnimacionApuntar or raw.animacion_apuntar or nil,

        -- Interfaz de Usuario (HUD)
        MostrarHUD = raw.MostrarHUD ~= false and (raw.mostrar_hud ~= false),
        MostrarCrosshair = raw.MostrarCrosshair ~= false and (raw.mostrar_crosshair ~= false),
        MostrarHitmarker = raw.MostrarHitmarker ~= false and (raw.mostrar_hitmarker ~= false),
        ImagenArma = raw.ImagenArma or raw.imagen_arma or raw.Icono or raw.icono or "",
        ColorTema = raw.ColorTema or raw.color_tema or Color3.fromRGB(0, 180, 255)
    }

    -- Normalizar "ilimited" / infinito
    if type(config.Recarga) == "string" then
        local lower = string.lower(config.Recarga)
        if lower == "ilimited" or lower == "unlimited" or lower == "infinito" or lower == "infinite" then
            config.Recarga = math.huge
        else
            config.Recarga = tonumber(config.Recarga) or 90
        end
    end

    return config
end

-- Inicialización de RemoteEvents requeridos
function FPSLibrary.GetOrCreateRemotes()
    local folder = ReplicatedStorage:FindFirstChild("FPSLibrary_Remotes")
    if not folder then
        folder = Instance.new("Folder")
        folder.Name = "FPSLibrary_Remotes"
        folder.Parent = ReplicatedStorage
    end

    local function getOrCreateRemoteEvent(name: string): RemoteEvent
        local ev = folder:FindFirstChild(name) :: RemoteEvent
        if not ev then
            ev = Instance.new("RemoteEvent")
            ev.Name = name
            ev.Parent = folder
        end
        return ev
    end

    local function getOrCreateRemoteFunction(name: string): RemoteFunction
        local rf = folder:FindFirstChild(name) :: RemoteFunction
        if not rf then
            rf = Instance.new("RemoteFunction")
            rf.Name = name
            rf.Parent = folder
        end
        return rf
    end

    return {
        Folder = folder,
        FireWeapon = getOrCreateRemoteEvent("FireWeapon"),
        ReplicateBullet = getOrCreateRemoteEvent("ReplicateBullet"),
        ReloadWeapon = getOrCreateRemoteEvent("ReloadWeapon"),
        CombatLog = getOrCreateRemoteEvent("CombatLog"),
        Hitmarker = getOrCreateRemoteEvent("Hitmarker"),
        RegisterWeaponData = getOrCreateRemoteFunction("RegisterWeaponData")
    }
end

-- Auto-Instalación automática de scripts y controladores en los servicios correspondientes
function FPSLibrary:Install()
    if not RunService:IsServer() then
        warn("[FPSLibrary] La instalación automática sólo puede ser ejecutada desde el Servidor o Plugin.")
        return false
    end

    print("[FPSLibrary] Comprobando e instalando arquitectura de servicios...")

    -- 1. Crear o asegurar carpeta de remotes en ReplicatedStorage
    local remotes = self.GetOrCreateRemotes()

    -- 2. Asegurar que este módulo esté en ReplicatedStorage
    local sharedTarget = ReplicatedStorage:FindFirstChild("FPSLibrary")
    if not sharedTarget then
        local currentModule = script
        if currentModule:IsA("ModuleScript") and currentModule.Parent ~= ReplicatedStorage then
            local cloned = currentModule:Clone()
            cloned.Name = "FPSLibrary"
            cloned.Parent = ReplicatedStorage
            sharedTarget = cloned
        end
    end

    -- 3. Crear Server Controller en ServerScriptService si no existe
    local serverScript = ServerScriptService:FindFirstChild("FPSLibrary_ServerController")
    if not serverScript then
        local s = Instance.new("Script")
        s.Name = "FPSLibrary_ServerController"
        s.Source = [[-- Auto-generado por FPSLibrary
local ServerController = require(game:GetService("ReplicatedStorage"):WaitForChild("FPSLibrary_ServerController"))
ServerController:Init()
]]
        s.Parent = ServerScriptService
        print("[FPSLibrary] Creado ServerScriptService/FPSLibrary_ServerController.")
    end

    -- 4. Crear Client Controller en StarterPlayerScripts si no existe
    if StarterPlayerScripts then
        local clientScript = StarterPlayerScripts:FindFirstChild("FPSLibrary_ClientController")
        if not clientScript then
            local cs = Instance.new("LocalScript")
            cs.Name = "FPSLibrary_ClientController"
            cs.Source = [[-- Auto-generado por FPSLibrary
local ClientController = require(game:GetService("ReplicatedStorage"):WaitForChild("FPSLibrary_ClientController"))
ClientController:Init()
]]
            cs.Parent = StarterPlayerScripts
            print("[FPSLibrary] Creado StarterPlayerScripts/FPSLibrary_ClientController.")
        end
    end

    print("[FPSLibrary] ¡Instalación completa y lista para usar!")
    return true
end

-- Método para registrar un arma desde su propio Script (o Tool)
function FPSLibrary:RegisterWeapon(tool: Tool, userConfig: { [string]: any }?)
    assert(tool and tool:IsA("Tool"), "[FPSLibrary:RegisterWeapon] El primer argumento debe ser un Tool de Roblox.")
    local normalizedConfig = self.NormalizeConfig(userConfig)

    -- Guardar la configuración en Attributes dentro del Tool para que tanto Cliente como Servidor tengan acceso
    local configFolder = tool:FindFirstChild("FPSWeaponConfig")
    if not configFolder then
        configFolder = Instance.new("Configuration")
        configFolder.Name = "FPSWeaponConfig"
        configFolder.Parent = tool
    end

    for k, v in pairs(normalizedConfig) do
        pcall(function()
            if typeof(v) == "number" or typeof(v) == "string" or typeof(v) == "boolean" or typeof(v) == "Color3" then
                configFolder:SetAttribute(k, v)
            end
        end)
    end

    self.RegisteredWeapons[tool] = normalizedConfig

    -- Si se llama desde el cliente (LocalScript), vincular directamente
    if RunService:IsClient() then
        local clientController = require(ReplicatedStorage:WaitForChild("FPSLibrary_ClientController"))
        clientController:BindTool(tool, normalizedConfig)
    end

    return normalizedConfig
end

-- Reconstruir configuración a partir de atributos del Tool (utilizado por el cliente al equipar)
function FPSLibrary.GetConfigFromTool(tool: Tool): { [string]: any }?
    local configFolder = tool:FindFirstChild("FPSWeaponConfig")
    if not configFolder then
        return nil
    end

    local raw = {}
    for attrName, attrValue in pairs(configFolder:GetAttributes()) do
        raw[attrName] = attrValue
    end

    return FPSLibrary.NormalizeConfig(raw)
end

return FPSLibrary
