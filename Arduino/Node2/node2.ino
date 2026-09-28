#include <SPI.h>
#include <LoRa.h>
#include <Wire.h>

// =======================
// LoRa Pins
// =======================
#define LORA_SS    10
#define LORA_RST   9
#define LORA_DIO0  2

// =======================
// POT Sensor
// =======================
#define POT_PIN A0

// =======================
// MPU6050
// =======================
#define MPU6050_ADDR 0x68

// =======================
// Node ID
// =======================
#define NODE_ID "NODE2"

void setup() {
  Serial.begin(9600);

  pinMode(POT_PIN, INPUT);

  Wire.begin();

  // Wake up MPU6050
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x6B);
  Wire.write(0);
  Wire.endTransmission(true);

  // LoRa
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

  Serial.println("Starting LoRa...");

  if (!LoRa.begin(433E6)) {
    Serial.println("LoRa FAILED!");
    while (1);
  }

  Serial.println("LoRa SUCCESS!");
}

void readMPU6050(int16_t &ax, int16_t &ay, int16_t &az) {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);

  Wire.requestFrom(MPU6050_ADDR, 6, true);

  ax = (Wire.read() << 8) | Wire.read();
  ay = (Wire.read() << 8) | Wire.read();
  az = (Wire.read() << 8) | Wire.read();
}

void loop() {
  int potValue = analogRead(POT_PIN);

  int16_t ax;
  int16_t ay;
  int16_t az;

  readMPU6050(ax, ay, az);

  String data =
    String(NODE_ID) +
    ",POT=" + String(potValue) +
    ",AX=" + String(ax) +
    ",AY=" + String(ay) +
    ",AZ=" + String(az);

  Serial.print("Sending: ");
  Serial.println(data);

  LoRa.beginPacket();
  LoRa.print(data);
  LoRa.endPacket();

  delay(3000);
}
