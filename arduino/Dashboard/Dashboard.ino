/*
 * Arduino Dashboard - Provides an interface via the serial port to the connnected sensors and leds
 *
 * Circuit: 
 *
 * - An HC-SR04 ultrasonic sensor connected to pin 13 (trigger) and pin 12 (echo) to measure the distance
 * - A potmeter connected to anlog port A0
 * - A temperature sensor connected to analog port A1
 * - A green led connected to pin 10
 * - A red led connected to pin 11
 * - A yellow led connected to pin 9
 */

#include <NewPing.h>
#include <Wire.h>
#include <math.h>
#include "rgb_lcd.h"

#define TRIGGER_PIN    13    // Arduino pin tied to trigger pin on the ultrasonic sensor.
#define ECHO_PIN       12    // Arduino pin tied to echo pin on the ultrasonic sensor.
#define MAX_DISTANCE   42    // Maximum distance we want to ping for (in centimeters). Maximum sensor distance is rated at 400-500cm.
#define RED_LED_PIN    11    // Arduino pin tied to the anode of the red led
#define GREEN_LED_PIN  10    // Arduino pin tied to the anode of the green led
#define YELLOW_LED_PIN 9     // Arduino pin tied to the anode of the yellow led
#define DISTANCE_TOKEN "D:"  // Token to prepend to the output when outputing the distance to the serial port
#define TEMPERATURE_TOKEN "T:"
#define ANGLE_TOKEN "A:"
#define LEDSTATUS_TOKEN "L:"

NewPing sonar(TRIGGER_PIN, ECHO_PIN);  
rgb_lcd lcd;

void setup() {
  lcd.begin(16, 2);  // Set up the LCD's number of columns and rows:

  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(YELLOW_LED_PIN, OUTPUT);
  
  lcd.clear();
  lcd.print("Dashboard");
  
  Serial.begin(115200);
  
  turnOffLeds();
}

void turnOffLeds() {
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, LOW);
  digitalWrite(YELLOW_LED_PIN, LOW);
}

void sendValue(String token, unsigned int value) {
  Serial.print(token);
  Serial.println(value);
}

unsigned int getDistance() {
  delay(50);  // Wait 50ms between pings (about 20 pings/sec). 29ms should be the shortest delay between pings.
  unsigned int distance = sonar.ping_cm(); // Send ping, get distance in centimeters.
  return distance;
}

void printMessage(const String& message) {
  lcd.setCursor(0, 1);
  lcd.print(message + String("                "));
}

byte commandBuffer[8];
int bufferPointer = 0;

void handleIncomingMessages() {
  if (Serial.available() > 0) {
    if(bufferPointer < sizeof(commandBuffer))
    {
      byte data = Serial.read();
      if(data == '@') {
        handleMessage();
        bufferPointer = 0;
      }
      else {
        if(data != '\r' && data != '\n') {
          commandBuffer[bufferPointer++] = data;
        }
      }
    }
  }
}

void handleMessage() {
  if(bufferPointer >= 2 && commandBuffer[1] == ':') {
    switch(commandBuffer[0]) {
      case 'L': 
        toggleLed(commandBuffer[2] - '0'); 
        break;
      case 'X':
        sendLatestValues();
        break;
    }
  }
}

void toggleLed(byte ledIndex) {
  int ledPin = YELLOW_LED_PIN + ledIndex;
  digitalWrite(ledPin, !digitalRead(ledPin));
  sendAllLedsStatus();
}

unsigned int latestTemperature = -1000;
unsigned int latestAngle = -1000;
unsigned int latestDistance = -1000;

unsigned int getTemperature() {
  int a = analogRead(1);
  float resistance = (float)(1023 - a) * 10000 / a; //get the resistance of the sensor
  int B = 3975; 
  float temperature = round(1 / (log(resistance/10000) / B + 1 / 298.15) - 273.15); //convert to temperature via datasheet
  return (unsigned int) temperature;
}

unsigned int getAngle() {
  return analogRead(0);
}

void sendLatestDistance() {
  sendValue(DISTANCE_TOKEN, latestDistance);
}

void sendLatestTemperature() {
  sendValue(TEMPERATURE_TOKEN, latestTemperature);
}

void sendLatestAngle() {
  sendValue(ANGLE_TOKEN, latestAngle);
}

void sendLedStatus(int ledIndex, int status) {
  Serial.print(LEDSTATUS_TOKEN);
  Serial.print(String(ledIndex));
  Serial.println(status ? "1" : "0");
}

void sendYellowLedStatus() {
  sendLedStatus(0, digitalRead(YELLOW_LED_PIN));
}

void sendGreenLedStatus() {
  sendLedStatus(1, digitalRead(GREEN_LED_PIN));
}

void sendRedLedStatus() {
  sendLedStatus(2, digitalRead(RED_LED_PIN));
}

void sendAllLedsStatus() {
  sendYellowLedStatus();
  sendGreenLedStatus();
  sendRedLedStatus();
}

void sendLatestValues() {
  sendLatestDistance();
  sendLatestTemperature();
  sendLatestAngle();
  sendAllLedsStatus();
}

void loop() {
  unsigned int distance = getDistance();
  unsigned int temperature = getTemperature();
  unsigned int angle = getAngle();
  
  if(distance != latestDistance) {
    latestDistance = distance;
    sendLatestDistance();
  }
  
  if(temperature != latestTemperature) {
    latestTemperature = temperature;
    sendLatestTemperature();
  }
  
  if(angle != latestAngle) {
    latestAngle = angle;
    sendLatestAngle();
  }
  
  handleIncomingMessages();
}
