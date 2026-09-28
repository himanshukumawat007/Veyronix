#!/usr/bin/env python3
"""
BHU-DRISHTI — Raspberry Pi 3B Physical Offline Alarm System
------------------------------------------------------------
GPIO Map (BCM):
  Pin 17: GREEN LED  (Normal Operation)
  Pin 27: YELLOW LED (Warning State)
  Pin 22: RED LED    (Critical State)
  Pin 23: Active Buzzer (Engages ONLY during RED / CRITICAL)

Handles both real Raspberry Pi hardware and non-Pi development machines
via safe software fallback.
"""

import time
import os

try:
    import RPi.GPIO as GPIO
    HAS_RPI_GPIO = True
except (ImportError, RuntimeError):
    HAS_RPI_GPIO = False

PIN_GREEN = int(os.environ.get("PIN_LED_GREEN", "17"))
PIN_YELLOW = int(os.environ.get("PIN_LED_YELLOW", "27"))
PIN_RED = int(os.environ.get("PIN_LED_RED", "22"))
PIN_BUZZER = int(os.environ.get("PIN_BUZZER", "23"))

class LocalAlarmController:
    def __init__(self):
        self.state = "NORMAL"
        self.buzzer_active = False

        if HAS_RPI_GPIO:
            GPIO.setwarnings(False)
            GPIO.setmode(GPIO.BCM)
            for pin in (PIN_GREEN, PIN_YELLOW, PIN_RED, PIN_BUZZER):
                GPIO.setup(pin, GPIO.OUT)
                GPIO.output(pin, GPIO.LOW)
            # Default to GREEN on boot
            GPIO.output(PIN_GREEN, GPIO.HIGH)
        else:
            print("[ALARM MOCK] Running without RPi.GPIO (simulated hardware LEDs & Buzzer)")

    def self_test(self):
        """Runs a 1-second cycling test through GREEN -> YELLOW -> RED + Buzzer -> GREEN"""
        print("[ALARM] Performing initial hardware self-test...")
        self.set_state("NORMAL")
        time.sleep(0.3)
        self.set_state("WARNING")
        time.sleep(0.3)
        self.set_state("CRITICAL")
        time.sleep(0.3)
        self.set_state("NORMAL")
        print("[ALARM] Hardware self-test complete.")

    def set_state(self, status):
        """
        GREEN  -> NORMAL
        YELLOW -> WARNING
        RED    -> CRITICAL (Buzzer starts!)
        """
        self.state = status

        if status == "CRITICAL":
            self.buzzer_active = True
            if HAS_RPI_GPIO:
                GPIO.output(PIN_GREEN, GPIO.LOW)
                GPIO.output(PIN_YELLOW, GPIO.LOW)
                GPIO.output(PIN_RED, GPIO.HIGH)
                GPIO.output(PIN_BUZZER, GPIO.HIGH) # Buzzer engages
            else:
                print("🚨 [ALARM: RED / CRITICAL] Buzzer: ACTIVE! Red LED: ON!")

        elif status == "WARNING":
            self.buzzer_active = False
            if HAS_RPI_GPIO:
                GPIO.output(PIN_GREEN, GPIO.LOW)
                GPIO.output(PIN_YELLOW, GPIO.HIGH)
                GPIO.output(PIN_RED, GPIO.LOW)
                GPIO.output(PIN_BUZZER, GPIO.LOW) # Buzzer OFF
            else:
                print("⚠️ [ALARM: YELLOW / WARNING] Yellow LED: ON, Buzzer: SILENT")

        else: # NORMAL
            self.buzzer_active = False
            if HAS_RPI_GPIO:
                GPIO.output(PIN_GREEN, GPIO.HIGH)
                GPIO.output(PIN_YELLOW, GPIO.LOW)
                GPIO.output(PIN_RED, GPIO.LOW)
                GPIO.output(PIN_BUZZER, GPIO.LOW) # Buzzer OFF
            else:
                pass # Silent normal state

    @property
    def active_led(self):
        if self.state == "CRITICAL":
            return "RED"
        elif self.state == "WARNING":
            return "YELLOW"
        return "GREEN"

    def is_buzzer_active(self):
        return self.buzzer_active

    def silence_buzzer(self):
        self.buzzer_active = False
        if HAS_RPI_GPIO:
            GPIO.output(PIN_BUZZER, GPIO.LOW)
        print("[ALARM] Buzzer manually silenced.")

    def cleanup(self):
        if HAS_RPI_GPIO:
            for pin in (PIN_GREEN, PIN_YELLOW, PIN_RED, PIN_BUZZER):
                GPIO.output(pin, GPIO.LOW)
            GPIO.cleanup()
