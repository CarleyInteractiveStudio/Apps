--[[
    Ejemplo 3: Escopeta de Combate
    Dispara múltiples perdigones por cada cartucho.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local FPSLibrary = require(ReplicatedStorage:WaitForChild("FPSLibrary"))

FPSLibrary:RegisterWeapon(script.Parent, {
    nombre = "Escopeta Pesada",
    bala = 8,
    recarga = 32,
    dano = 14, -- 14 de daño por perdigón
    perdigones = 8, -- 8 perdigones x 14 daño = 112 de daño potencial
    modo_disparo = "escopeta",
    cadencia = 0.65,
    tiempo_recarga = 3.0,

    tecla_recargar = "r",
    tecla_apuntar = "click_derecho",

    -- Retroceso más fuerte
    retroceso_camara = 2.8,
    dispersion = 0.05
})
