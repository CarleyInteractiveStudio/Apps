--[[
    Ejemplo 1: Pistola Básica
    Para usar: Coloca este Script dentro de cualquier Tool que tenga una parte llamada 'Handle'.
    ¡No necesitas programar nada más! Solo cambia los valores que quieras.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local FPSLibrary = require(ReplicatedStorage:WaitForChild("FPSLibrary"))

FPSLibrary:RegisterWeapon(script.Parent, {
    nombre = "Pistola Compacta",
    bala = 15,
    recarga = 60, -- 60 balas de reserva
    dano = 28,
    modo_disparo = "semi",
    tecla_recargar = "r",
    tecla_apuntar = "click_derecho"
})
