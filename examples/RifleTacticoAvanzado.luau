--[[
    Ejemplo 2: Rifle Táctico Avanzado M4
    Incluye mira zoom, retroceso de cámara, daño crítico en cabeza y reserva ilimitada.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local FPSLibrary = require(ReplicatedStorage:WaitForChild("FPSLibrary"))

FPSLibrary:RegisterWeapon(script.Parent, {
    nombre = "Rifle Tactico M4",
    bala = 30,
    recarga = "ilimited", -- Munición infinita de reserva
    dano = 34,
    multiplicador_cabeza = 2.2, -- Un tiro a la cabeza inflige 34 * 2.2 = 75 de daño
    modo_disparo = "auto",
    cadencia = 0.1, -- 600 disparos por minuto

    -- Controles amigables
    tecla_recargar = "r",
    tecla_apuntar = "click_derecho",

    -- Sistema de Apuntado (ADS)
    sistema_mira = "zoom",
    zoom_fov = 45,

    -- Retroceso procedural
    retroceso_camara = 1.4,
    recuperacion_retroceso = 5.5,

    -- Interfaz (HUD)
    mostrar_hud = true,
    mostrar_crosshair = true,
    imagen_arma = "rbxassetid://6031075931",

    -- Sonidos (reemplaza con tus IDs de Roblox si tienes)
    sonido_disparo = "",
    sonido_recarga = ""
})
