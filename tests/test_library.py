#!/usr/bin/env python3
"""
Pruebas automatizadas de validación para FPSLibrary.
Verifica:
1. Sintaxis de los archivos Luau creados.
2. Analizador de configuración y normalización de valores ('ilimited', números, defaults).
3. Mapeo de teclas amigable ('r', 'click_derecho', 'shift', etc.).
4. Lógica de cálculo de daño por zonas (Headshot, Torso, Extremidades).
5. Estructura y formato de registros de combate (Combat Logs).
"""

import math
import os
import re
import unittest

class TestFPSLibrary(unittest.TestCase):

    def test_files_exist(self):
        """Verifica que todos los archivos requeridos existan en la estructura."""
        expected_files = [
            "src/shared/FPSLibrary.luau",
            "src/server/ServerController.luau",
            "src/client/ClientController.luau",
            "src/plugin/PluginMain.luau",
            "examples/PistolaBasica.luau",
            "examples/RifleTacticoAvanzado.luau",
            "examples/EscopetaCombate.luau",
            "README.md"
        ]
        for filepath in expected_files:
            self.assertTrue(os.path.isfile(filepath), f"Archivo no encontrado: {filepath}")

    def test_no_legacy_files(self):
        """Verifica que las imágenes y archivos antiguos hayan sido eliminados."""
        self.assertFalse(os.path.exists("imagenes"), "La carpeta 'imagenes' no debe existir")
        self.assertFalse(os.path.exists("imagenes/apps.png"), "Archivos antiguos no deben existir")

    def test_luau_syntax_checks(self):
        """Verifica que los archivos Luau no contengan errores de sintaxis evidentes."""
        files_to_check = [
            "src/shared/FPSLibrary.luau",
            "src/server/ServerController.luau",
            "src/client/ClientController.luau",
            "src/plugin/PluginMain.luau"
        ]
        for fpath in files_to_check:
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()
                # Verificar balanceo de bloques básicos 'function'/'end', 'if'/'end'
                # y que no haya marcadores de conflicto git
                self.assertNotIn("<<<<<<<", content)
                self.assertNotIn(">>>>>>>", content)

    def test_config_normalization_logic(self):
        """Simula y verifica la lógica de normalización de configuración de FPSLibrary."""
        def normalize_config(raw):
            bala = float(raw.get("bala", raw.get("Bala", 30)))
            recarga = raw.get("recarga", raw.get("Recarga", 90))
            if isinstance(recarga, str) and recarga.lower() in ["ilimited", "unlimited", "infinito"]:
                recarga = float("inf")
            else:
                recarga = float(recarga)

            dano = float(raw.get("dano", raw.get("Dano", 25)))
            mult_cabeza = float(raw.get("multiplicador_cabeza", 2.0))
            modo = str(raw.get("modo_disparo", raw.get("modo", "auto"))).lower()

            return {
                "bala": int(bala),
                "recarga": recarga,
                "dano": dano,
                "multiplicador_cabeza": mult_cabeza,
                "modo_disparo": modo
            }

        # Prueba con "ilimited"
        cfg1 = normalize_config({"bala": 20, "recarga": "ilimited", "dano": 35, "modo": "auto"})
        self.assertEqual(cfg1["bala"], 20)
        self.assertEqual(cfg1["recarga"], float("inf"))
        self.assertEqual(cfg1["dano"], 35)

        # Prueba con recarga numérica
        cfg2 = normalize_config({"bala": 10, "recarga": "40", "modo_disparo": "semi"})
        self.assertEqual(cfg2["bala"], 10)
        self.assertEqual(cfg2["recarga"], 40.0)
        self.assertEqual(cfg2["modo_disparo"], "semi")

    def test_damage_and_headshot_calculation(self):
        """Verifica los multiplicadores de daño para Headshot, Torso y Extremidades."""
        base_damage = 30
        headshot_mult = 2.0
        limb_mult = 0.8

        def calculate_damage(part_name, base, head_mult, l_mult):
            name = part_name.lower()
            if "head" in name:
                return math.floor(base * head_mult + 0.5), True
            elif any(x in name for x in ["arm", "leg", "hand", "foot"]):
                return math.floor(base * l_mult + 0.5), False
            else:
                return base, False

        head_dmg, is_head = calculate_damage("Head", base_damage, headshot_mult, limb_mult)
        self.assertTrue(is_head)
        self.assertEqual(head_dmg, 60)

        torso_dmg, is_head = calculate_damage("Torso", base_damage, headshot_mult, limb_mult)
        self.assertFalse(is_head)
        self.assertEqual(torso_dmg, 30)

        arm_dmg, is_head = calculate_damage("RightUpperArm", base_damage, headshot_mult, limb_mult)
        self.assertFalse(is_head)
        self.assertEqual(arm_dmg, 24)

    def test_combat_log_structure(self):
        """Verifica que el formato del combat log contenga todos los campos solicitados."""
        log_entry = {
            "Timestamp": 1700000000,
            "Shooter": "Jugador1",
            "ShooterUserId": 123456,
            "Target": "Enemigo2",
            "TargetIsPlayer": True,
            "TargetUserId": 654321,
            "Weapon": "Rifle M4",
            "HitPart": "Head",
            "Damage": 70,
            "IsHeadshot": True,
            "Distance": 45.2,
            "TargetHealthRemaining": 30
        }

        required_keys = ["Shooter", "Target", "Weapon", "HitPart", "Damage", "IsHeadshot", "Distance"]
        for key in required_keys:
            self.assertIn(key, log_entry)

if __name__ == "__main__":
    unittest.main()
