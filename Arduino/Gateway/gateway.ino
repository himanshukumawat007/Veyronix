#include <SPI.h>
#include <LoRa.h>
#include <math.h>

// =======================
// LoRa Pins - Arduino Mega
// =======================
#define LORA_SS    53
#define LORA_RST   9
#define LORA_DIO0  2

// =======================
// Local Alert Pins
// =======================
#define GREEN_LED  22
#define YELLOW_LED 23
#define RED_LED    24
#define BUZZER     25

// =======================
// Thresholds
// =======================
#define POT_WARNING   500
#define POT_CRITICAL  700

#define TILT_WARNING   3.0
#define TILT_CRITICAL 5.0

void setup() {
  Serial.begin(9600);

  pinMode(GREEN_LED, OUTPUT);
  pinMode(YELLOW_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  digitalWrite(GREEN_LED, LOW);
  digitalWrite(YELLOW_LED, LOW);
  digitalWrite(RED_LED, LOW);
  digitalWrite(BUZZER, LOW);

  pinMode(LORA_SS, OUTPUT);
  digitalWrite(LORA_SS, HIGH);

  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

  Serial.println();
  Serial.println("================================");
  Serial.println(" MINE SUBSIDENCE GATEWAY");
  Serial.println("================================");

  Serial.println("Starting LoRa...");

  if (!LoRa.begin(433E6)) {
    Serial.println("LoRa FAILED!");
    Serial.println("Gateway Communication Error");

    digitalWrite(RED_LED, HIGH);
    digitalWrite(BUZZER, HIGH);

    while (1);
  }

  Serial.println("LoRa SUCCESS!");
  Serial.println("Gateway Ready");
  Serial.println("Waiting for sensor nodes...");
  Serial.println();

  digitalWrite(GREEN_LED, HIGH);
}

String setAlert(int pot, float tilt) {
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(YELLOW_LED, LOW);
  digitalWrite(RED_LED, LOW);
  digitalWrite(BUZZER, LOW);

  if (pot >= POT_CRITICAL || tilt >= TILT_CRITICAL) {
    digitalWrite(RED_LED, HIGH);
    digitalWrite(BUZZER, HIGH);
    return "CRITICAL";
  }

  if (pot >= POT_WARNING || tilt >= TILT_WARNING) {
    digitalWrite(YELLOW_LED, HIGH);
    return "WARNING";
  }

  digitalWrite(GREEN_LED, HIGH);
  return "NORMAL";
}

bool getValue(String data, String key, int &value) {
  int index = data.indexOf(key);

  if (index < 0) {
    return false;
  }

  index += key.length();

  int commaIndex = data.indexOf(",", index);

  String valueString;

  if (commaIndex >= 0) {
    valueString = data.substring(index, commaIndex);
  } else {
    valueString = data.substring(index);
  }

  value = valueString.toInt();
  return true;
}

void loop() {
  int packetSize = LoRa.parsePacket();

  if (packetSize) {
    String receivedData = "";

    while (LoRa.available()) {
      receivedData += (char)LoRa.read();
    }

    receivedData.trim();

    int rssi = LoRa.packetRssi();

    bool validNode =
      receivedData.startsWith("NODE1") ||
      receivedData.startsWith("NODE2");

    if (!validNode) {
      return;
    }

    int pot = 0;
    int ax = 0;
    int ay = 0;
    int az = 0;

    bool potOK = getValue(receivedData, "POT=", pot);
    bool axOK  = getValue(receivedData, "AX=", ax);
    bool ayOK  = getValue(receivedData, "AY=", ay);
    bool azOK  = getValue(receivedData, "AZ=", az);

    if (!potOK || !axOK || !ayOK || !azOK) {
      Serial.println("Invalid / Incomplete LoRa Packet");
      Serial.println(receivedData);
      return;
    }

    float tiltX =
      atan2(
        (float)ax,
        sqrt((float)ay * ay + (float)az * az)
      ) * 180.0 / PI;

    float tiltY =
      atan2(
        (float)ay,
        sqrt((float)ax * ax + (float)az * az)
      ) * 180.0 / PI;

    float maxTilt = max(abs(tiltX), abs(tiltY));

    String status = setAlert(pot, maxTilt);

    Serial.println();
    Serial.println("================================");
    Serial.println("       SENSOR DATA RECEIVED");
    Serial.println("================================");

    Serial.print("NODE      : ");
    Serial.println(
      receivedData.startsWith("NODE1") ? "NODE1" : "NODE2"
    );

    Serial.print("POT       : ");
    Serial.println(pot);

    Serial.print("AX        : ");
    Serial.println(ax);

    Serial.print("AY        : ");
    Serial.println(ay);

    Serial.print("AZ        : ");
    Serial.println(az);

    Serial.print("TILT X    : ");
    Serial.print(tiltX, 2);
    Serial.println(" deg");

    Serial.print("TILT Y    : ");
    Serial.print(tiltY, 2);
    Serial.println(" deg");

    Serial.print("MAX TILT  : ");
    Serial.print(maxTilt, 2);
    Serial.println(" deg");

    Serial.print("RSSI      : ");
    Serial.print(rssi);
    Serial.println(" dBm");

    Serial.println("--------------------------------");
    Serial.print("STATUS    : ");
    Serial.println(status);

    if (status == "NORMAL") {
      Serial.println("GREEN LED : ON");
      Serial.println("BUZZER    : OFF");
    } else if (status == "WARNING") {
      Serial.println("YELLOW LED: ON");
      Serial.println("BUZZER    : OFF");
    } else {
      Serial.println("RED LED   : ON");
      Serial.println("BUZZER    : ON");
      Serial.println("!!! CRITICAL CONDITION !!!");
    }

    Serial.println("================================");

    // One-line packet for Raspberry Pi.
    Serial.print(receivedData);
    Serial.print(",TILT=");
    Serial.print(maxTilt, 2);
    Serial.print(",RSSI=");
    Serial.print(rssi);
    Serial.print(",STATUS=");
    Serial.println(status);
  }
}
