#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "Display_ST7789.h"
#include "LVGL_Driver.h"
#include <sys/time.h>
#include <time.h>
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <Adafruit_MLX90614.h>
#include <esp_mac.h>  // For ESP32-C6 MAC address functions

// WiFi & Firebase (DISABLED - Not needed for BLE Bridge mode)
// #include <WiFi.h>
// #include <HTTPClient.h>
// #include <ArduinoJson.h>

// Include EEZ Studio UI
#include "ui.h"

// ═══════════════════════════════════════════════════════════
// ║             WiFi & Firebase Configuration               ║
// ═══════════════════════════════════════════════════════════
// WiFi Credentials
const char* WIFI_SSID = "enumatechz";           // Nama WiFi
const char* WIFI_PASSWORD = "3numaTechn0l0gy";  // Password WiFi

// Firebase Realtime Database Configuration
const char* FIREBASE_HOST = "https://testing-5db96-default-rtdb.asia-southeast1.firebasedatabase.app";  // Firebase URL
const char* FIREBASE_AUTH = "";  // Kosongkan jika menggunakan test mode (no authentication)

// ═══════════════════════════════════════════════════════════
// ║   MODE: BLE BRIDGE (WiFi & Firebase DISABLED)          ║
// ║   ESP32 hanya kirim data via BLE ke HP                  ║
// ║   HP yang akan upload ke Firebase                       ║
// ═══════════════════════════════════════════════════════════
bool wifiEnabled = false;  // WiFi DISABLED untuk hemat daya
bool firebaseEnabled = false;  // Firebase DISABLED (via HP bridge)

// ═══════════════════════════════════════════════════════════
// ║                 BLE Configuration                        ║
// ═══════════════════════════════════════════════════════════
// BLE UART Service (Nordic UART Service - NUS)
#define SERVICE_UUID           "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_RX "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

// BLE Device Name
#define BLE_DEVICE_NAME "CareRing"

// Device ID Configuration
String deviceID = "";           // Unique Device ID (dari MAC Address)
String deviceName = "CareRing"; // Nama device yang bisa dikustom

// Button Configuration
#define CONTROL_BUTTON 18  // Push button eksternal: GND + GPIO 18 (pengganti BOOT yang rusak - ESP32-C6)
#define BUTTON_DEBOUNCE 50
#define LONG_PRESS_DURATION 1000  // 1 detik untuk long press

// State Machine
enum SystemState {
  STATE_IDLE,
  STATE_BLE_STARTING,
  STATE_BLE_ACTIVE,
  STATE_CLIENT_CONNECTED,
  STATE_MAIN
};

SystemState currentState = STATE_IDLE;

// Timing variables
unsigned long lastButtonPress = 0;
unsigned long lastDataUpdate = 0;
unsigned long lastSensorRead = 0;
unsigned long buttonPressTime = 0;
bool buttonPressed = false;
bool longPressTriggered = false;

// Button debouncing with noise filter
#define BUTTON_STABLE_TIME 50  // Button harus stabil selama 50ms
unsigned long lastButtonStateChange = 0;
int lastStableButtonState = HIGH;
int buttonReadCount = 0;
int buttonLowCount = 0;

// System flags
bool bleActive = false;
bool uiInitialized = false;
bool deviceConnected = false;
bool oldDeviceConnected = false;
bool sensorInitialized = false;
bool tempSensorInitialized = false;

// Screen control
bool screenOn = true;
lv_obj_t* screenBlanking = NULL;

// Screen Navigation
ScreensEnum currentScreen = SCREEN_ID_MAIN_1;  // Start dari Main_1

// BLE Objects
BLEServer *pServer = NULL;
BLECharacteristic *pTxCharacteristic = NULL;
BLECharacteristic *pRxCharacteristic = NULL;

// MAX30102 Sensor (I2C - Wire on GPIO 2,3)
MAX30105 particleSensor;

// MLX90614 Temperature Sensor (I2C - Wire1 on GPIO 4,5)
Adafruit_MLX90614 mlx = Adafruit_MLX90614();
TwoWire I2C_MLX = TwoWire(1);

// Sensor data
int heartRate = 0;
int spo2 = 0;
float bodyTemp = 36.5;
float ambientTemp = 28.0;

// Heart rate calculation variables
const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute;
int beatAvg;

// SpO2 calculation variables
#define MAX_BRIGHTNESS 255
uint32_t irBuffer[100];
uint32_t redBuffer[100];
int32_t bufferLength = 100;
int32_t spo2Value;
int8_t validSPO2;
int32_t heartRateValue;
int8_t validHeartRate;

// Time data
struct tm timeinfo;
char timeStr[10];  // Format: "HH:MM:SS"
char dateStr[20];  // Format: "Day, DD Mon YYYY"
unsigned long lastTimeUpdate = 0;

// Label pointers for clock (will be created dynamically)
lv_obj_t* label_clock = NULL;
lv_obj_t* label_date = NULL;

// Testing Mode Configuration
#define TESTING_MODE false  // Set ke true untuk testing mode
#define TESTING_DURATION 30000  // Testing selama 30 detik

// Button Diagnostic Mode
#define BUTTON_DEBUG_MODE true  // Set true untuk melihat state GPIO secara real-time

// ===== Forward Declarations =====
// BLE Functions
void sendBLEMessage(String message);
void sendBLEData();

// Sensor Functions
void initMAX30102();
void initMLX90614();
void readSensorData();
void readTemperatureData();
void simulateSensorData();

// UI Functions
void updateSensorData();
void updateConnectionUI(int state);
void createClockLabels();
void showClockLabels();
void hideClockLabels();
void forceClockToForeground();
void turnScreenOff();
void turnScreenOn();
void toggleScreen();
void nextScreen();
void updateSensorDataForScreen(ScreensEnum screenId);

// Device Functions
void initDeviceID();
void testMAX30102Sensor();

// ===== BLE Server Callbacks =====
class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println();
    Serial.println("╔══════════════════════════════════════════════════════╗");
    Serial.println("║  ✅ WEB APP CONNECTED!                              ║");
    Serial.println("╚══════════════════════════════════════════════════════╝");
    Serial.println("🌐 Web app is now connected to " + deviceName);
    Serial.println("📊 Sensor data will be sent every 500ms");
    Serial.println("🔥 Web app will auto-upload to Firebase (throttled 1x/sec)");
    Serial.println("════════════════════════════════════════════════════════");
    Serial.println();
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println();
    Serial.println("╔══════════════════════════════════════════════════════╗");
    Serial.println("║  ❌ WEB APP DISCONNECTED!                           ║");
    Serial.println("╚══════════════════════════════════════════════════════╝");
    Serial.println("⚠️  Connection lost with web app");
    Serial.println("🔄 Auto-restarting BLE advertising...");

    // Auto-restart advertising dengan retry mechanism
    delay(500); // Delay singkat untuk stabilisasi
    
    // Restart advertising (akan otomatis retry di main loop jika gagal)
    BLEDevice::startAdvertising();
    
    Serial.println("✅ Advertising restarted - Device discoverable again");
    Serial.println("⏳ Waiting for web app to reconnect...");
    Serial.println("💡 BLE will remain active and auto-restart advertising");
    Serial.println("   No need to press button - just reconnect from web app");
    Serial.println("════════════════════════════════════════════════════════");
    Serial.println();
  }
};

// ===== BLE RX Characteristic Callbacks =====
class MyCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String command = String(pCharacteristic->getValue().c_str());
    
    if (command.length() > 0) {
      command.trim();
      Serial.println("📩 Received: " + command);
      handleCommand(command);
    }
  }
  
  void handleCommand(String cmd) {
    cmd.toUpperCase();
    
    if (cmd == "GET" || cmd == "GET_DATA") {
      sendBLEData();
    } 
    else if (cmd == "REFRESH" || cmd == "UPDATE") {
      readSensorData();
      updateSensorDataForScreen(currentScreen);
      sendBLEData();
      sendBLEMessage("OK: Data refreshed");
    } 
    else if (cmd == "STATUS" || cmd == "PING") {
      String status = "OK: " + deviceName +
                     " | Mode=BLE-Bridge" +
                     " | HR=" + String(heartRate) +
                     " | SpO2=" + String(spo2) +
                     " | Temp=" + String(bodyTemp, 1) + "C";
      sendBLEMessage(status);
    }
    else if (cmd == "NEXT" || cmd == "SCREEN") {
      nextScreen();
      sendBLEMessage("OK: Next screen");
    }
    else if (cmd == "INFO" || cmd == "DEVICE") {
      String info = "Device: " + deviceName + " | ID: " + deviceID + " | Mode: BLE-Bridge";
      sendBLEMessage(info);
    }
    else if (cmd == "HELP") {
      String help = "Commands: GET, REFRESH, STATUS, INFO, NEXT, HELP";
      sendBLEMessage(help);
    }
    else {
      sendBLEMessage("ERROR: Unknown command. Send HELP for commands");
    }
  }
};

// ===== Time Functions =====
void initTime() {
  Serial.println("⏰ Initializing time...");
  
  // Set timezone untuk Indonesia (WIB = GMT+7)
  configTime(7 * 3600, 0, "pool.ntp.org", "time.nist.gov");
  
  // Set default time jika NTP gagal
  struct tm tm;
  tm.tm_year = 2025 - 1900;
  tm.tm_mon = 10;
  tm.tm_mday = 26;
  tm.tm_hour = 14;
  tm.tm_min = 30;
  tm.tm_sec = 0;
  
  time_t t = mktime(&tm);
  struct timeval now = { .tv_sec = t };
  settimeofday(&now, NULL);
  
  Serial.println("✅ Time initialized (default: 26 Nov 2025, 14:30:00)");
}

void updateTime() {
  time_t now;
  time(&now);
  localtime_r(&now, &timeinfo);
  
  strftime(timeStr, sizeof(timeStr), "%H:%M:%S", &timeinfo);
  strftime(dateStr, sizeof(dateStr), "%a, %d %b %Y", &timeinfo);
}

void createClockLabels() {
  Serial.println("\n╔══════════════════════════════════════╗");
  Serial.println("║  CREATING CLOCK LABELS               ║");
  Serial.println("╚══════════════════════════════════════╝");
  
  // Hapus label lama
  if (label_clock) {
    lv_obj_del(label_clock);
    label_clock = NULL;
  }
  if (label_date) {
    lv_obj_del(label_date);
    label_date = NULL;
  }
  
  // Get current screen
  lv_obj_t* current_screen = lv_scr_act();
  Serial.printf("📺 Current screen: %p\n", current_screen);
  
  // Update time first
  updateTime();
  
  // ========== CREATE CLOCK LABEL ==========
  label_clock = lv_label_create(current_screen);
  lv_obj_set_pos(label_clock, 45, 110);
  lv_obj_set_size(label_clock, 100, 30);
  lv_label_set_text(label_clock, timeStr);
  
  // WARNA MERAH UNTUK VISIBILITY
  lv_obj_set_style_text_color(label_clock, lv_color_hex(0xFF0000), 0);
  lv_obj_set_style_text_font(label_clock, &lv_font_montserrat_20, 0);
  lv_obj_set_style_text_align(label_clock, LV_TEXT_ALIGN_CENTER, 0);
  
  lv_obj_clear_flag(label_clock, LV_OBJ_FLAG_HIDDEN);
  lv_obj_move_foreground(label_clock);
  
  Serial.printf("✅ Clock created: '%s' at (45, 110) - RED\n", timeStr);
  
  // ========== CREATE DATE LABEL ==========
  label_date = lv_label_create(current_screen);
  lv_obj_set_pos(label_date, 20, 140);
  lv_obj_set_size(label_date, 150, 20);
  lv_label_set_text(label_date, dateStr);
  
  // WARNA KUNING UNTUK VISIBILITY
  lv_obj_set_style_text_color(label_date, lv_color_hex(0xFFFF00), 0);
  lv_obj_set_style_text_font(label_date, &lv_font_montserrat_12, 0);
  lv_obj_set_style_text_align(label_date, LV_TEXT_ALIGN_CENTER, 0);
  
  lv_obj_clear_flag(label_date, LV_OBJ_FLAG_HIDDEN);
  lv_obj_move_foreground(label_date);
  
  Serial.printf("✅ Date created: '%s' at (20, 140) - YELLOW\n", dateStr);
  Serial.println("╚══════════════════════════════════════╝\n");
}

void forceClockToForeground() {
  if (label_clock) {
    lv_obj_clear_flag(label_clock, LV_OBJ_FLAG_HIDDEN);
    lv_obj_move_foreground(label_clock);
  }
  if (label_date) {
    lv_obj_clear_flag(label_date, LV_OBJ_FLAG_HIDDEN);
    lv_obj_move_foreground(label_date);
  }
  Serial.println("⬆️ Clock forced to foreground!");
}

void updateClockDisplay() {
  if (millis() - lastTimeUpdate >= 1000) {
    lastTimeUpdate = millis();
    updateTime();
    
    if (label_clock && label_date) {
      lv_label_set_text(label_clock, timeStr);
      lv_label_set_text(label_date, dateStr);
      
      // PENTING: Paksa ke foreground setiap update!
      lv_obj_move_foreground(label_clock);
      lv_obj_move_foreground(label_date);
      
      // Print update (every 5 seconds)
      static int updateCount = 0;
      updateCount++;
      if (updateCount % 5 == 0) {
        Serial.printf("🕐 Clock update #%d: %s\n", updateCount, timeStr);
      }
    }
  }
}

void hideClockLabels() {
  Serial.println("🙈 Hiding clock labels");
  if (label_clock) {
    lv_obj_add_flag(label_clock, LV_OBJ_FLAG_HIDDEN);
  }
  if (label_date) {
    lv_obj_add_flag(label_date, LV_OBJ_FLAG_HIDDEN);
  }
}

void showClockLabels() {
  Serial.println("👁️ Showing clock labels");
  if (label_clock) {
    lv_obj_clear_flag(label_clock, LV_OBJ_FLAG_HIDDEN);
    lv_obj_move_foreground(label_clock);
  }
  if (label_date) {
    lv_obj_clear_flag(label_date, LV_OBJ_FLAG_HIDDEN);
    lv_obj_move_foreground(label_date);
  }
}

// ===== Screen Control Functions =====
void turnScreenOff() {
  Serial.println("\n🌑 TURNING SCREEN OFF...");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Delete old blanking object if exists
  if (screenBlanking) {
    lv_obj_del(screenBlanking);
    screenBlanking = NULL;
  }
  
  // Create full-screen black overlay
  screenBlanking = lv_obj_create(lv_scr_act());
  lv_obj_set_size(screenBlanking, LV_HOR_RES, LV_VER_RES);
  lv_obj_set_pos(screenBlanking, 0, 0);
  lv_obj_set_style_bg_color(screenBlanking, lv_color_hex(0x000000), 0);
  lv_obj_set_style_bg_opa(screenBlanking, 255, 0);
  lv_obj_set_style_border_width(screenBlanking, 0, 0);
  lv_obj_clear_flag(screenBlanking, LV_OBJ_FLAG_CLICKABLE);
  lv_obj_clear_flag(screenBlanking, LV_OBJ_FLAG_SCROLLABLE);
  lv_obj_move_foreground(screenBlanking);
  
  screenOn = false;
  
  Serial.println("✅ Screen is OFF (blanked)");
  Serial.println("⏱️ HOLD button 1 sec to turn ON");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

void turnScreenOn() {
  Serial.println("\n🌞 TURNING SCREEN ON...");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Delete blanking overlay
  if (screenBlanking) {
    lv_obj_del(screenBlanking);
    screenBlanking = NULL;
  }
  
  // Restore UI based on current state
  if (currentState == STATE_IDLE) {
    Serial.println("📺 Restoring IDLE screen...");
    loadScreen(SCREEN_ID_MAIN);
    delay(100);
    updateConnectionUI(0);
    delay(50);
    createClockLabels();
    showClockLabels();
    delay(50);
    forceClockToForeground();
  } else if (currentState == STATE_BLE_ACTIVE) {
    Serial.println("📺 Restoring BLE_ACTIVE screen...");
    loadScreen(SCREEN_ID_MAIN);
    delay(100);
    updateConnectionUI(1);
  } else if (currentState == STATE_MAIN) {
    Serial.println("📺 Restoring MAIN dashboard...");
    loadScreen(currentScreen);
    delay(100);
    updateSensorDataForScreen(currentScreen);
  }
  
  screenOn = true;
  
  Serial.println("✅ Screen is ON");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

void toggleScreen() {
  if (screenOn) {
    turnScreenOff();
  } else {
    turnScreenOn();
  }
}

// ===== Update Connection UI =====
void updateConnectionUI(int state) {
  Serial.printf("🎨 UPDATE CONNECTION UI - State: %d\n", state);
  
  lv_obj_t* label_status = objects.label_status_text;
  lv_obj_t* spinner = objects.spinner_loading;
  lv_obj_t* label_device = objects.label_device_name;
  
  switch(state) {
    case 0: // Idle
      Serial.println("🔵 UI State: IDLE");
      if (label_status) {
        lv_label_set_text(label_status, "Hold the button\nto connect");
        lv_obj_clear_flag(label_status, LV_OBJ_FLAG_HIDDEN);
        lv_obj_set_style_text_color(label_status, lv_color_hex(0xFFFFFF), 0);
        lv_obj_set_style_text_align(label_status, LV_TEXT_ALIGN_CENTER, 0);
      }
      if (spinner) {
        lv_obj_add_flag(spinner, LV_OBJ_FLAG_HIDDEN);
      }
      if (label_device) {
        lv_obj_add_flag(label_device, LV_OBJ_FLAG_HIDDEN);
      }
      
      delay(50);
      forceClockToForeground();
      break;
      
    case 1: // Connecting
      Serial.println("🔵 UI State: CONNECTING");
      if (label_status) {
        lv_label_set_text(label_status, "Connecting...");
        lv_obj_clear_flag(label_status, LV_OBJ_FLAG_HIDDEN);
      }
      if (spinner) {
        lv_obj_clear_flag(spinner, LV_OBJ_FLAG_HIDDEN);
      }
      if (label_device) {
        lv_obj_clear_flag(label_device, LV_OBJ_FLAG_HIDDEN);
        lv_label_set_text(label_device, "Device: CareRing");
        lv_obj_set_style_text_color(label_device, lv_color_hex(0xFFFFFF), 0);
        lv_obj_set_style_text_font(label_device, &lv_font_montserrat_12, 0);
        lv_obj_set_style_text_align(label_device, LV_TEXT_ALIGN_CENTER, 0);
      }
      
      hideClockLabels();
      break;
      
    case 2: // Connected
      Serial.println("🔵 UI State: CONNECTED");
      if (label_status) {
        lv_obj_add_flag(label_status, LV_OBJ_FLAG_HIDDEN);
      }
      if (spinner) {
        lv_obj_add_flag(spinner, LV_OBJ_FLAG_HIDDEN);
      }
      if (label_device) {
        lv_obj_clear_flag(label_device, LV_OBJ_FLAG_HIDDEN);
        lv_label_set_text(label_device, "CareRing");
        lv_obj_set_style_text_color(label_device, lv_color_hex(0xFFFFFF), 0);
        lv_obj_set_style_text_font(label_device, &lv_font_montserrat_20, 0);
        lv_obj_set_style_text_align(label_device, LV_TEXT_ALIGN_CENTER, 0);
      }
      
      hideClockLabels();
      break;
  }
}

// ===== BLE Functions =====
void startBLE() {
  Serial.println("\n📡 Starting BLE UART Service...");
  
  BLEDevice::init(BLE_DEVICE_NAME);
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  pTxCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID_TX,
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pTxCharacteristic->addDescriptor(new BLE2902());
  
  pRxCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID_RX,
    BLECharacteristic::PROPERTY_WRITE
  );
  pRxCharacteristic->setCallbacks(new MyCallbacks());
  
  pService->start();
  
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  
  bleActive = true;

  Serial.println("✅ BLE Started Successfully!");
  Serial.println();
  Serial.println("╔══════════════════════════════════════════════════════╗");
  Serial.println("║  📡 BLE ADVERTISING ACTIVE                          ║");
  Serial.println("╚══════════════════════════════════════════════════════╝");
  Serial.println("🔍 Device is now discoverable as: " + deviceName);
  Serial.println("📱 TO CONNECT FROM WEB APP:");
  Serial.println("   1. Open: http://localhost:8080/perangkat.html");
  Serial.println("   2. Click: 'Tambah Perangkat Baru'");
  Serial.println("   3. Click: 'Scan & Hubungkan Perangkat'");
  Serial.println("   4. Select: '" + deviceName + "'");
  Serial.println("   5. Wait for connection...");
  Serial.println();
  Serial.println("⏳ Waiting for web app connection...");
  Serial.println("════════════════════════════════════════════════════════");
  Serial.println();
}

void stopBLE() {
  Serial.println("⏹️ Stopping BLE...");
  if (bleActive) {
    BLEDevice::deinit(true);
    bleActive = false;
    deviceConnected = false;
  }
}

void sendBLEMessage(String message) {
  if (deviceConnected && bleActive) {
    pTxCharacteristic->setValue(message.c_str());
    pTxCharacteristic->notify();
    Serial.println("📤 Sent: " + message);
  }
}

// ===== Device ID Functions =====
void initDeviceID() {
  // Generate unique Device ID dari MAC Address ESP32-C6
  uint8_t mac[6];

  // ESP32-C6 compatible MAC address read
  esp_err_t ret = esp_efuse_mac_get_default(mac);

  if (ret != ESP_OK) {
    // Fallback: gunakan MAC dari BLE
    Serial.println("⚠️ Using BLE MAC as fallback");
    esp_base_mac_addr_get(mac);
  }

  char macStr[18];
  sprintf(macStr, "%02X:%02X:%02X:%02X:%02X:%02X",
          mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

  deviceID = String(macStr);

  // Buat device name unik dengan suffix MAC terakhir 4 digit
  deviceName = "CareRing-" + String(mac[4], HEX) + String(mac[5], HEX);
  deviceName.toUpperCase();

  Serial.println("\n╔════════════════════════════════════╗");
  Serial.println("║      DEVICE IDENTIFICATION        ║");
  Serial.println("╚════════════════════════════════════╝");
  Serial.println("🆔 Device ID:   " + deviceID);
  Serial.println("📱 Device Name: " + deviceName);
  Serial.println("════════════════════════════════════\n");
}

// ═══════════════════════════════════════════════════════════
// ║    WiFi & Firebase Functions (DISABLED - BLE Mode)      ║
// ═══════════════════════════════════════════════════════════
// WiFi dan Firebase functions sudah di-disable karena menggunakan BLE Bridge mode
// Data akan dikirim via BLE ke HP, lalu HP yang upload ke Firebase

// ═══════════════════════════════════════════════════════════
// ║                  BLE Functions                           ║
// ═══════════════════════════════════════════════════════════

void sendBLEData() {
  if (deviceConnected && bleActive) {
    // Build JSON data untuk dikirim ke WEB APP via BLE
    // Format EXACT sesuai spesifikasi web app:
    // {
    //   "deviceID": "A1:B2:C3:D4:E5:F6",
    //   "deviceName": "CareRing-XXXX",
    //   "heartRate": 72,
    //   "spo2": 98,
    //   "temperature": 36.5,
    //   "ambient": 28.0,
    //   "screen": 1
    // }

    String data = "{";
    data += "\"deviceID\":\"" + deviceID + "\",";
    data += "\"deviceName\":\"" + deviceName + "\",";
    data += "\"heartRate\":" + String(heartRate) + ",";
    data += "\"spo2\":" + String(spo2) + ",";
    data += "\"temperature\":" + String(bodyTemp, 1) + ",";
    data += "\"ambient\":" + String(ambientTemp, 1) + ",";
    data += "\"screen\":" + String((int)currentScreen - SCREEN_ID_MAIN + 1);
    data += "}";

    // Send via BLE notification
    pTxCharacteristic->setValue(data.c_str());
    pTxCharacteristic->notify();

    // Print setiap 5 detik (untuk debug)
    static int bleCount = 0;
    static unsigned long lastBLELog = 0;
    bleCount++;

    if (millis() - lastBLELog >= 5000) {  // Every 5 seconds
      lastBLELog = millis();
      Serial.println("\n╔════════════════════════════════════════╗");
      Serial.println("║   BLE DATA SENT TO WEB APP            ║");
      Serial.println("╚════════════════════════════════════════╝");
      Serial.println("📤 JSON: " + data);
      Serial.println("📊 Stats:");
      Serial.printf("   • Packets sent: %d\n", bleCount);
      Serial.printf("   • Rate: 2 packets/sec (500ms interval)\n");
      Serial.printf("   • Connection: %s\n", deviceConnected ? "ACTIVE ✓" : "LOST ✗");
      Serial.println("════════════════════════════════════════\n");
    }
  } else if (!deviceConnected && bleActive) {
    // Warning if BLE active but no client connected
    static unsigned long lastWarning = 0;
    if (millis() - lastWarning >= 10000) {  // Every 10 seconds
      lastWarning = millis();
      Serial.println("⚠️  BLE active but no client connected");
      Serial.println("   Waiting for web app connection...");
    }
  }
}

// ===== EEZ Studio UI Functions =====
void initEEZUI() {
  if (!uiInitialized) {
    Serial.println("🎨 Initializing EEZ UI...");
    ui_init();
    uiInitialized = true;
    Serial.println("✅ EEZ UI Initialized");
  }
}

void showIdleScreen() {
  Serial.println("\n📺 SHOWING IDLE SCREEN");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  initEEZUI();
  loadScreen(SCREEN_ID_MAIN);
  Serial.println("1️⃣ Screen loaded");
  
  delay(100);
  
  updateConnectionUI(0);
  Serial.println("2️⃣ Connection UI updated");
  
  delay(50);
  
  createClockLabels();
  Serial.println("3️⃣ Clock labels created");
  
  showClockLabels();
  Serial.println("4️⃣ Clock labels shown");
  
  delay(50);
  forceClockToForeground();
  Serial.println("5️⃣ Clock forced to foreground");
  
  Serial.println("✅ Idle screen setup COMPLETE");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

void showMainScreen() {
  Serial.println("\n📺 SHOWING MAIN SCREEN");
  initEEZUI();
  loadScreen(SCREEN_ID_MAIN_1);
  currentScreen = SCREEN_ID_MAIN_1;
  Serial.println("✅ Main dashboard loaded (Main_1)\n");
}

// ===== Screen Navigation =====
void nextScreen() {
  Serial.println("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("➡️  NAVIGATING TO NEXT SCREEN");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  int nextScreenId = (int)currentScreen + 1;
  
  if (nextScreenId > SCREEN_ID_MAIN_5) {
    nextScreenId = SCREEN_ID_MAIN_1;
  }
  
  Serial.printf("📺 Current: MAIN_%d\n", (int)currentScreen - SCREEN_ID_MAIN + 1);
  Serial.printf("📺 Next: MAIN_%d\n", nextScreenId - SCREEN_ID_MAIN + 1);
  
  currentScreen = (ScreensEnum)nextScreenId;
  
  Serial.println("🔄 Loading screen...");
  loadScreen(currentScreen);
  
  Serial.println("✅ Screen loaded!");
  
  // CRITICAL: Process LVGL sebelum update widget
  lv_timer_handler();
  delay(100);
  lv_timer_handler();
  
  Serial.println("📊 Updating sensor data...");
  updateSensorDataForScreen(currentScreen);
  
  Serial.printf("✅ Navigation COMPLETE: MAIN_%d\n", (int)currentScreen - SCREEN_ID_MAIN + 1);
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

void updateSensorDataForScreen(ScreensEnum screenId) {
  Serial.println("\n╔════════════════════════════════════╗");
  Serial.printf("║  UPDATING SCREEN: MAIN_%d           ║\n", (int)screenId - SCREEN_ID_MAIN + 1);
  Serial.println("╚════════════════════════════════════╝");
  
  switch(screenId) {
    case SCREEN_ID_MAIN_1:
      Serial.println("📊 Main_1: All Sensors");
      
      if (objects.label_bpm_value_1) {
        char str[10];
        sprintf(str, "%d bpm", heartRate);
        lv_label_set_text(objects.label_bpm_value_1, str);
        Serial.printf("  ✅ HR: %s\n", str);
      }
      
      if (objects.label_spo2_value_1) {
        char str[10];
        sprintf(str, "%d%%", spo2);
        lv_label_set_text(objects.label_spo2_value_1, str);
        Serial.printf("  ✅ SpO2: %s\n", str);
      }
      
      if (objects.label_suhu_value_1) {
        char str[10];
        sprintf(str, "%.1f C", bodyTemp);
        lv_label_set_text(objects.label_suhu_value_1, str);
        Serial.printf("  ✅ Body Temp: %s\n", str);
      }
      
      if (objects.label_suhu_udara_1) {
        char str[10];
        sprintf(str, "%.1f C", ambientTemp);
        lv_label_set_text(objects.label_suhu_udara_1, str);
        Serial.printf("  ✅ Ambient: %s\n", str);
      }
      
      if (objects.bar_spo2_1) {
        lv_bar_set_value(objects.bar_spo2_1, spo2, LV_ANIM_OFF);
      }
      
      if (objects.bar_suhu_badan_1) {
        int temp_percent = (int)((bodyTemp - 30.0) / 10.0 * 100.0);
        temp_percent = constrain(temp_percent, 0, 100);
        lv_bar_set_value(objects.bar_suhu_badan_1, temp_percent, LV_ANIM_OFF);
      }
      break;
      
      
    case SCREEN_ID_MAIN_2:
      Serial.println("📊 Main_2: Heart Rate Only");
      
      if (objects.label_bpm_value_2) {
        char str[10];
        sprintf(str, "%d bpm", heartRate);
        lv_label_set_text(objects.label_bpm_value_2, str);
        Serial.printf("  ✅ HR: %s\n", str);
      }
      break;
      
    case SCREEN_ID_MAIN_3:
      Serial.println("📊 Main_3: SpO2 Only");
      
      if (objects.label_spo2_value_2) {
        char str[10];
        sprintf(str, "%d%%", spo2);
        lv_label_set_text(objects.label_spo2_value_2, str);
        Serial.printf("  ✅ SpO2: %s\n", str);
      }
      
      if (objects.bar_spo2_2) {
        lv_bar_set_value(objects.bar_spo2_2, spo2, LV_ANIM_OFF);
      }
      break;
      
    case SCREEN_ID_MAIN_4:
      Serial.println("📊 Main_4: Body Temperature Only");
      
      if (objects.label_suhu_value_2) {
        char str[10];
        sprintf(str, "%.1f C", bodyTemp);
        lv_label_set_text(objects.label_suhu_value_2, str);
        Serial.printf("  ✅ Body Temp: %s\n", str);
      }
      
      if (objects.bar_suhu_badan_2) {
        int temp_percent = (int)((bodyTemp - 30.0) / 10.0 * 100.0);
        temp_percent = constrain(temp_percent, 0, 100);
        lv_bar_set_value(objects.bar_suhu_badan_2, temp_percent, LV_ANIM_OFF);
      }
      break;
      
    case SCREEN_ID_MAIN_5:
      Serial.println("📊 Main_5: Ambient Temperature Only");
      
      if (objects.label_suhu_udara_2) {
        char str[10];
        sprintf(str, "%.1f C", ambientTemp);
        lv_label_set_text(objects.label_suhu_udara_2, str);
        Serial.printf("  ✅ Ambient: %s\n", str);
      }
      break;
      
    default:
      Serial.println("⚠️ Unknown screen ID!");
      break;
  }
  
  Serial.println("✅ Update COMPLETE\n");
}

// Legacy function for backward compatibility
void updateSensorData() {
  updateSensorDataForScreen(currentScreen);
}

// ===== MAX30102 Sensor Functions =====
void initMAX30102() {
  Serial.println("\n╔═══════════════════════════════════════╗");
  Serial.println("║   INITIALIZING MAX30102 SENSOR       ║");
  Serial.println("╚═══════════════════════════════════════╝");

  Serial.println("🔌 Starting I2C on pins SDA=2, SCL=3...");
  Wire.begin(2, 3);  // SDA=2, SCL=3
  delay(100);

  // Scan I2C bus for devices
  Serial.println("\n🔍 Scanning I2C bus for MAX30102...");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  byte error, address;
  int nDevices = 0;
  bool max30102Found = false;

  for(address = 1; address < 127; address++ ) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();

    if (error == 0) {
      Serial.printf("   ✅ I2C device found at 0x%02X", address);
      if (address == 0x57) {
        Serial.println(" <- MAX30102!");
        max30102Found = true;
      } else {
        Serial.println();
      }
      nDevices++;
    }
  }
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (nDevices == 0) {
    Serial.println("\n❌ NO I2C DEVICES FOUND!");
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Serial.println("⚠️  CHECK YOUR WIRING:");
    Serial.println("   MAX30102 VIN → ESP32 3.3V (NOT 5V!)");
    Serial.println("   MAX30102 SDA → ESP32 GPIO 2");
    Serial.println("   MAX30102 SCL → ESP32 GPIO 3");
    Serial.println("   MAX30102 GND → ESP32 GND");
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Serial.println("\n⚠️  Using SIMULATED heart rate data\n");
    sensorInitialized = false;
    return;
  } else if (!max30102Found) {
    Serial.printf("\n⚠️  Found %d device(s) but NO MAX30102 at 0x57!\n", nDevices);
    Serial.println("   Possible issues:");
    Serial.println("   - Wrong sensor module (not MAX30102)");
    Serial.println("   - Faulty/fake sensor");
    Serial.println("   - Wrong I2C pins connected");
    Serial.println("\n⚠️  Using SIMULATED heart rate data\n");
    sensorInitialized = false;
    return;
  } else {
    Serial.printf("\n✅ Found %d I2C device(s) - MAX30102 detected!\n\n", nDevices);
  }

  Serial.println("🔌 Attempting to initialize MAX30102...");
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("❌ MAX30102 initialization FAILED!");
    Serial.println("   Possible causes:");
    Serial.println("   - Wrong I2C address (should be 0x57)");
    Serial.println("   - Faulty sensor");
    Serial.println("   - Incompatible module");
    Serial.println("\n⚠️ Using SIMULATED data instead\n");
    sensorInitialized = false;
    return;
  }

  Serial.println("✅ MAX30102 sensor found at 0x57!");

  // Configure sensor with MAXIMUM BRIGHTNESS and optimal settings
  Serial.println("⚙️ Configuring sensor with MAXIMUM power...");
  byte ledBrightness = 255;     // MAXIMUM brightness!
  byte sampleAverage = 1;       // No averaging for faster response
  byte ledMode = 2;             // Red + IR LEDs
  byte sampleRate = 200;        // 200 samples per second (faster!)
  int pulseWidth = 411;         // 411μs pulse width
  int adcRange = 16384;         // Maximum ADC range!

  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
  particleSensor.setPulseAmplitudeRed(0xFF);    // Red LED MAXIMUM!
  particleSensor.setPulseAmplitudeIR(0xFF);     // IR LED MAXIMUM!
  particleSensor.setPulseAmplitudeGreen(0);     // Green LED off

  sensorInitialized = true;

  Serial.println("✅ MAX30102 configured successfully!");
  Serial.println("\n╔═══════════════════════════════════════╗");
  Serial.println("║   SENSOR READY - Place your finger   ║");
  Serial.println("╚═══════════════════════════════════════╝\n");
}

// ===== MLX90614 Temperature Sensor Functions =====
void initMLX90614() {
  Serial.println("\n╔═══════════════════════════════════════╗");
  Serial.println("║   INITIALIZING MLX90614 SENSOR       ║");
  Serial.println("╚═══════════════════════════════════════╝");

  Serial.println("🌡️ Starting I2C on pins SDA=4, SCL=5...");
  I2C_MLX.begin(4, 5, 100000);  // SDA=4, SCL=5, 100kHz
  delay(100);

  // Scan I2C bus for MLX90614
  Serial.println("\n🔍 Scanning I2C bus (Wire1)...");
  byte error, address;
  int nDevices = 0;

  for(address = 1; address < 127; address++ ) {
    I2C_MLX.beginTransmission(address);
    error = I2C_MLX.endTransmission();

    if (error == 0) {
      Serial.printf("   ✅ I2C device found at 0x%02X\n", address);
      nDevices++;
    }
  }

  if (nDevices == 0) {
    Serial.println("   ❌ No I2C devices found!");
    Serial.println("   ⚠️ Check your wiring:");
    Serial.println("      VCC → 3.3V");
    Serial.println("      SDA → GPIO 4");
    Serial.println("      SCL → GPIO 5");
    Serial.println("      GND → GND");
    Serial.println("\n⚠️ Using SIMULATED temperature data instead\n");
    tempSensorInitialized = false;
    return;
  } else {
    Serial.printf("   ✅ Found %d I2C device(s)\n\n", nDevices);
  }

  Serial.println("🌡️ Attempting to initialize MLX90614...");
  if (!mlx.begin(MLX90614_I2CADDR, &I2C_MLX)) {
    Serial.println("❌ MLX90614 initialization FAILED!");
    Serial.println("   Possible causes:");
    Serial.println("   - Wrong I2C address (should be 0x5A)");
    Serial.println("   - Faulty sensor");
    Serial.println("   - Incompatible module");
    Serial.println("\n⚠️ Using SIMULATED temperature data instead\n");
    tempSensorInitialized = false;
    return;
  }

  Serial.println("✅ MLX90614 sensor found at 0x5A!");
  tempSensorInitialized = true;

  Serial.println("✅ MLX90614 configured successfully!");
  Serial.println("\n╔═══════════════════════════════════════╗");
  Serial.println("║   TEMP SENSOR READY                  ║");
  Serial.println("╚═══════════════════════════════════════╝\n");
}

void readTemperatureData() {
  static unsigned long lastTempRead = 0;

  // Read temperature every 1 second
  if (millis() - lastTempRead < 1000) {
    return;
  }
  lastTempRead = millis();

  // If sensor not initialized, use simulated data
  if (!tempSensorInitialized) {
    static unsigned long lastSimTempUpdate = 0;
    if (millis() - lastSimTempUpdate >= 3000) {
      lastSimTempUpdate = millis();
      // Simulate temperature
      bodyTemp = 36.5 + (random(-5, 6) / 10.0);
      ambientTemp = 28.0 + (random(-3, 4) / 10.0);
      bodyTemp = constrain(bodyTemp, 35.0, 38.0);
      ambientTemp = constrain(ambientTemp, 20.0, 35.0);

      Serial.printf("🤖 SIMULATED TEMP => 🌡️ Body: %.1f°C | 🌤️ Ambient: %.1f°C\n", bodyTemp, ambientTemp);
    }
    return;
  }

  // Read real temperature from MLX90614
  ambientTemp = mlx.readAmbientTempC();
  bodyTemp = mlx.readObjectTempC();

  // Validate readings
  if (isnan(ambientTemp) || isnan(bodyTemp)) {
    Serial.println("⚠️ Failed to read from MLX90614 sensor!");
    return;
  }

  // Constrain to reasonable values
  bodyTemp = constrain(bodyTemp, 20.0, 45.0);
  ambientTemp = constrain(ambientTemp, 15.0, 40.0);

  // Debug output
  static int tempReadCount = 0;
  tempReadCount++;
  if (tempReadCount % 5 == 0) {  // Print every 5 seconds
    Serial.printf("🌡️ REAL TEMP => Body: %.1f°C | Ambient: %.1f°C\n", bodyTemp, ambientTemp);
  }
}

void readSensorData() {
  // If sensor not initialized, use simulated data
  if (!sensorInitialized) {
    static unsigned long lastSimUpdate = 0;
    if (millis() - lastSimUpdate >= 2000) {
      lastSimUpdate = millis();
      simulateSensorData();
    }
    return;
  }

  // ===== ULTRA-SIMPLE BEAT DETECTION WITH DEBUG =====
  static long irBuffer[50];  // Larger buffer
  static int bufferIndex = 0;
  static bool bufferFilled = false;
  static long lastIR = 0;
  static bool wasAboveAvg = false;
  static unsigned long lastBeatTime = 0;
  static uint32_t redSum = 0;
  static uint32_t irSum = 0;
  static int sampleCount = 0;
  static unsigned long lastSpO2Calc = 0;
  static unsigned long lastDebug = 0;

  // Read raw values
  long irValue = particleSensor.getIR();
  long redValue = particleSensor.getRed();

  // Return early if no finger detected (VERY LOW threshold)
  if (irValue < 10000) {
    heartRate = 0;
    spo2 = 0;
    return;
  }

  // Store in buffer
  irBuffer[bufferIndex] = irValue;
  bufferIndex++;
  if (bufferIndex >= 50) {
    bufferIndex = 0;
    bufferFilled = true;
  }

  // Only start detection after buffer is filled
  if (!bufferFilled) {
    lastIR = irValue;
    return;
  }

  // Calculate average and range
  long irSum_local = 0;
  long irMin = 999999;
  long irMax = 0;
  for(int i = 0; i < 50; i++) {
    irSum_local += irBuffer[i];
    if (irBuffer[i] > irMax) irMax = irBuffer[i];
    if (irBuffer[i] < irMin) irMin = irBuffer[i];
  }
  long irAvg = irSum_local / 50;
  long irRange = irMax - irMin;

  // Debug every 200ms in testing mode only
  if (TESTING_MODE && millis() - lastDebug > 200) {
    lastDebug = millis();
    Serial.printf("  [DEBUG] IR:%ld Avg:%ld Range:%ld ", irValue, irAvg, irRange);
    if (irValue > irAvg) {
      Serial.println("▲ ABOVE");
    } else {
      Serial.println("▼ BELOW");
    }
  }

  // ULTRA-SIMPLE: Detect zero-crossing of average line
  bool isAboveAvg = (irValue > irAvg);

  // Beat detected when crossing from below to above average
  // AND signal has enough variation (range > 500)
  if (isAboveAvg && !wasAboveAvg && irRange > 500) {
    unsigned long now = millis();

    if (lastBeatTime > 0) {
      long interval = now - lastBeatTime;

      // Accept beats between 400ms (150bpm) and 2000ms (30bpm)
      if (interval >= 400 && interval <= 2000) {
        float bpm = 60000.0 / interval;

        // Only print in testing mode
        if (TESTING_MODE) {
          Serial.printf("  ★★★ BEAT! Interval:%ldms BPM:%.0f ★★★\n", interval, bpm);
        }

        // Store in rate array for averaging
        rates[rateSpot++] = (byte)bpm;
        rateSpot %= RATE_SIZE;

        // Calculate average BPM
        int sum = 0;
        int count = 0;
        for (byte i = 0; i < RATE_SIZE; i++) {
          if (rates[i] > 0) {
            sum += rates[i];
            count++;
          }
        }

        if (count > 0) {
          heartRate = sum / count;
        }
      }
    }

    lastBeatTime = now;
  }

  wasAboveAvg = isAboveAvg;
  lastIR = irValue;

  // Accumulate samples for SpO2
  redSum += redValue;
  irSum += irValue;
  sampleCount++;

  // Calculate SpO2 every 3 seconds
  if (millis() - lastSpO2Calc > 3000 && sampleCount > 20) {
    lastSpO2Calc = millis();

    float redAvg = (float)redSum / sampleCount;
    float irAvgCalc = (float)irSum / sampleCount;

    // Reset accumulators
    redSum = 0;
    irSum = 0;
    sampleCount = 0;

    // Calculate SpO2
    if (irAvgCalc > 0) {
      float ratio = redAvg / irAvgCalc;
      spo2 = (int)(110 - 25 * ratio);
      spo2 = constrain(spo2, 85, 100);
    }
  }
}

// ===== Simulate Sensor Data (Fallback) =====
void simulateSensorData() {
  heartRate = 70 + random(-5, 6);
  spo2 = 97 + random(-2, 3);
  bodyTemp = 36.5 + (random(-5, 6) / 10.0);
  ambientTemp = 28.0 + (random(-3, 4) / 10.0);

  heartRate = constrain(heartRate, 60, 100);
  spo2 = constrain(spo2, 90, 100);
  bodyTemp = constrain(bodyTemp, 35.0, 38.0);
  ambientTemp = constrain(ambientTemp, 20.0, 35.0);
}

// ===== COMPACT MAX30102 TESTING (AUTO-SCROLL FRIENDLY) =====
void testMAX30102Sensor() {
  Serial.println("\n========================================");
  Serial.println("   MAX30102 DIAGNOSTIC TEST");
  Serial.println("========================================\n");

  Serial.println("INSTRUCTIONS:");
  Serial.println("1. Place finger FIRMLY on sensor");
  Serial.println("2. Cover RED and IR LEDs completely");
  Serial.println("3. Keep finger STILL for 30 seconds\n");

  Serial.printf("Test Duration: %d seconds\n", TESTING_DURATION / 1000);
  Serial.println("----------------------------------------\n");

  // Check if sensor initialized
  if (!sensorInitialized) {
    Serial.println("ERROR: Sensor NOT initialized!");
    Serial.println("\nCheck wiring:");
    Serial.println("  VIN -> 3.3V");
    Serial.println("  SDA -> GPIO 2");
    Serial.println("  SCL -> GPIO 3");
    Serial.println("  GND -> GND\n");
    while(true) delay(1000);
  }

  Serial.println("Sensor OK! Starting test...\n");
  Serial.println("Time | IR Value | Status    | Heart Rate | SpO2");
  Serial.println("-----|----------|-----------|------------|-----");
  delay(2000);

  unsigned long startTime = millis();
  unsigned long lastPrint = 0;
  int testCount = 0;
  int goodReadings = 0;
  int beatDetections = 0;
  int lastHeartRate = 0;

  while (millis() - startTime < TESTING_DURATION) {
    // Read sensor values
    long irValue = particleSensor.getIR();
    long redValue = particleSensor.getRed();

    // Update sensor data (new simplified algorithm)
    readSensorData();

    // Detect if heart rate changed (beat was detected)
    if (heartRate > 0 && heartRate != lastHeartRate) {
      beatDetections++;
      Serial.printf("  💓 Beat detected! HR now: %d bpm\n", heartRate);
      lastHeartRate = heartRate;
    }

    // Print every 1 second in compact format
    if (millis() - lastPrint >= 1000) {
      lastPrint = millis();
      testCount++;

      int elapsed = (millis() - startTime) / 1000;

      // Compact output
      Serial.printf("%3ds | %7ld | ", elapsed, irValue);

      // Status
      if (irValue >= 50000) {
        Serial.print("EXCELLENT ");
        goodReadings++;
      } else if (irValue >= 30000) {
        Serial.print("GOOD      ");
        goodReadings++;
      } else if (irValue >= 20000) {
        Serial.print("OK        ");
        goodReadings++;
      } else if (irValue >= 10000) {
        Serial.print("WEAK      ");
      } else {
        Serial.print("NO_FINGER ");
      }

      // HR, SpO2
      Serial.printf("| %3d bpm | %3d%%\n", heartRate, spo2);
    }

    delay(20);
  }

  // Test complete - show results
  Serial.println("\n\n========================================");
  Serial.println("        TEST COMPLETE!");
  Serial.println("========================================\n");

  Serial.println("RESULTS:");
  Serial.println("----------------------------------------");
  Serial.printf("Good Readings:   %d/%d (%.0f%%)\n", goodReadings, testCount, (float)goodReadings/testCount*100);
  Serial.printf("Final Heart Rate: %d bpm ", heartRate);
  if (heartRate >= 60 && heartRate <= 100) {
    Serial.println("✓ NORMAL");
  } else if (heartRate > 0) {
    Serial.println("△ CHECK");
  } else {
    Serial.println("✗ FAILED");
  }

  Serial.printf("Final SpO2:       %d%% ", spo2);
  if (spo2 >= 95) {
    Serial.println("✓ NORMAL");
  } else if (spo2 >= 90) {
    Serial.println("△ LOW");
  } else {
    Serial.println("✗ FAILED");
  }

  Serial.println("----------------------------------------");

  // Overall verdict
  if (heartRate >= 50 && heartRate <= 120 && spo2 >= 90) {
    Serial.println("\n✓✓✓ SENSOR WORKING PROPERLY ✓✓✓");
    Serial.println("Both Heart Rate and SpO2 detected!\n");
  } else if (heartRate > 0 && spo2 > 0) {
    Serial.println("\n△△△ SENSOR PARTIALLY WORKING △△△");
    Serial.println("Values detected but may be inaccurate");
    Serial.println("Try: Press finger harder, keep still\n");
  } else if (spo2 > 0) {
    Serial.println("\n⚠️  SpO2 OK but Heart Rate FAILED");
    Serial.println("Tips:");
    Serial.println("- Keep finger COMPLETELY STILL");
    Serial.println("- Press FIRMLY but not too hard");
    Serial.println("- Wait at least 10 seconds");
    Serial.println("- Try different finger position\n");
  } else {
    Serial.println("\n✗✗✗ SENSOR NOT WORKING ✗✗✗");
    Serial.println("Check: Wiring, connections, sensor model\n");
  }

  Serial.println("========================================");
  Serial.println("Press RESET to test again");
  Serial.println("Set TESTING_MODE=false for normal mode");
  Serial.println("========================================\n");

  while(true) delay(1000);
}

// ===== Button Handler dengan LONG PRESS dan NOISE FILTER =====
void handleButtonPress() {
  int rawButtonState = digitalRead(CONTROL_BUTTON);

  // ===== NOISE FILTER: Baca 5 kali untuk memastikan state stabil =====
  buttonReadCount++;
  if (rawButtonState == LOW) {
    buttonLowCount++;
  }

  // Setiap 5 pembacaan, tentukan state yang stabil
  if (buttonReadCount >= 5) {
    int filteredState;

    // Jika >= 4 dari 5 pembacaan LOW, maka dianggap LOW
    if (buttonLowCount >= 4) {
      filteredState = LOW;
    } else {
      filteredState = HIGH;
    }

    // Reset counter
    buttonReadCount = 0;
    buttonLowCount = 0;

    // ===== DEBOUNCING: State harus stabil selama BUTTON_STABLE_TIME =====
    if (filteredState != lastStableButtonState) {
      lastButtonStateChange = millis();
      lastStableButtonState = filteredState;
      return;  // Tunggu state stabil dulu
    }

    // Pastikan state sudah stabil minimal 50ms
    if (millis() - lastButtonStateChange < BUTTON_STABLE_TIME) {
      return;
    }

    int buttonState = filteredState;

    // Button PRESSED (LOW)
    if (buttonState == LOW && !buttonPressed) {
      buttonPressed = true;
      buttonPressTime = millis();
      longPressTriggered = false;
      Serial.println("🔘 Button pressed...");
    }

    // Button HELD (still pressed)
    if (buttonState == LOW && buttonPressed && !longPressTriggered) {
      unsigned long pressDuration = millis() - buttonPressTime;

      // LONG PRESS detected (1 second)
      if (pressDuration >= LONG_PRESS_DURATION) {
        longPressTriggered = true;
        Serial.println("\n⏱️ LONG PRESS DETECTED!");
        toggleScreen();
      }
    }

    // Button RELEASED
    if (buttonState == HIGH && buttonPressed) {
      unsigned long pressDuration = millis() - buttonPressTime;
      buttonPressed = false;

      // SHORT PRESS (single click) - hanya jika belum trigger long press
      if (!longPressTriggered && pressDuration < LONG_PRESS_DURATION) {
        if (millis() - lastButtonPress >= BUTTON_DEBOUNCE) {
          lastButtonPress = millis();

          // Jangan process jika screen OFF
          if (!screenOn) {
            Serial.println("ℹ️ Screen is OFF - HOLD button 1 sec to turn ON");
            return;
          }

          Serial.println("\n🔘 SHORT PRESS (Click)!");

          switch(currentState) {
            case STATE_IDLE:
              Serial.println("▶️ Starting BLE...");
              currentState = STATE_BLE_STARTING;
              break;

            case STATE_BLE_ACTIVE:
              Serial.println("ℹ️ BLE already active");
              break;

            case STATE_MAIN:
              nextScreen();
              break;
          }
        }
      }
    }
  }
}

// ===== Setup =====
void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n\n\n");
  Serial.println("════════════════════════════════════════════════════════");
  Serial.println("  🚀 CARERING SYSTEM STARTING... 🚀");
  Serial.println("════════════════════════════════════════════════════════");
  Serial.println();
  Serial.println("╔══════════════════════════════════════════════════════╗");
  Serial.println("║  CareRing BLE Bridge v5.1 - WEB APP READY          ║");
  Serial.println("║  Health Monitoring Device                           ║");
  Serial.println("║  ───────────────────────────────────────────────    ║");
  Serial.println("║  ✓ BLE → Web App → Firebase (Auto Upload)          ║");
  Serial.println("║  ✓ LOW POWER MODE (WiFi Disabled)                  ║");
  Serial.println("║  ✓ Device ID & Name Generation                     ║");
  Serial.println("║  ✓ JSON Data Format (500ms interval)               ║");
  Serial.println("║  ───────────────────────────────────────────────    ║");
  Serial.println("║  📱 WEB APP COMPATIBILITY:                          ║");
  Serial.println("║     • Service UUID: 6E400001-B5A3-...              ║");
  Serial.println("║     • TX Char UUID: 6E400003-B5A3-...              ║");
  Serial.println("║     • Device Name: CareRing-XXXX                   ║");
  Serial.println("║     • Data Rate: 2 packets/sec                     ║");
  Serial.println("╚══════════════════════════════════════════════════════╝");
  Serial.println();

  // Initialize Device ID dari MAC Address
  initDeviceID();

  // WiFi DISABLED - Using BLE Bridge mode
  Serial.println("⚡ LOW POWER MODE: WiFi disabled");
  Serial.println("📱 Connect HP via BLE to bridge data to Firebase\n");

  pinMode(CONTROL_BUTTON, INPUT_PULLUP);
  delay(100);  // Stabilisasi pull-up

  // Baca state awal dan set sebagai stable state
  lastStableButtonState = digitalRead(CONTROL_BUTTON);
  lastButtonStateChange = millis();

  Serial.println("✅ Button initialized (GPIO18 - External Push Button - ESP32-C6)");
  Serial.printf("   Initial state: %s\n", lastStableButtonState == HIGH ? "HIGH (Released)" : "LOW (Pressed)");

  initTime();

  initMAX30102();

  initMLX90614();

  // Jika TESTING_MODE aktif, langsung jalankan test sensor
  if (TESTING_MODE) {
    Serial.println("\n⚠️  TESTING_MODE is ENABLED");
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Serial.println("📋 Starting MAX30102 sensor test...");
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    delay(2000);
    testMAX30102Sensor();
    // Program akan berhenti di dalam testMAX30102Sensor()
  }

  Serial.print("🖥️ Initializing display... ");
  LCD_Init();
  Serial.println("OK");

  Serial.print("🎨 Initializing LVGL... ");
  Lvgl_Init();
  Serial.println("OK");

  showIdleScreen();
  
  Serial.println();
  Serial.println("════════════════════════════════════════");
  Serial.println("✅ SYSTEM READY!");
  Serial.println("════════════════════════════════════════");
  Serial.println("🔘 SHORT PRESS (Click):");
  Serial.println("   - IDLE: Start BLE");
  Serial.println("   - MAIN: Next Screen");
  Serial.println("⏱️ LONG PRESS (Hold 1 sec): Screen ON/OFF");
  Serial.println("════════════════════════════════════════");
  Serial.println();
}

// ===== Main Loop =====
void loop() {
  // Button GPIO Diagnostic (print setiap 2 detik)
  #if BUTTON_DEBUG_MODE
  static unsigned long lastDiagnostic = 0;
  if (millis() - lastDiagnostic >= 2000) {
    lastDiagnostic = millis();
    int rawState = digitalRead(CONTROL_BUTTON);
    Serial.printf("🔧 [GPIO18 DEBUG] Raw State: %s | Button Pressed: %s\n",
                  rawState == HIGH ? "HIGH ✓" : "LOW ✗",
                  buttonPressed ? "YES" : "NO");
  }
  #endif

  lv_timer_handler();

  if (uiInitialized) {
    ui_tick();
  }

  handleButtonPress();  // Check button terus-menerus

  delay(5);

  switch(currentState) {
    case STATE_IDLE:
      if (screenOn) {
        updateClockDisplay();
      }
      break;
      
    case STATE_BLE_STARTING:
      updateConnectionUI(1);
      startBLE();
      currentState = STATE_BLE_ACTIVE;
      Serial.println("🟢 State: BLE_ACTIVE");
      break;
      
    case STATE_BLE_ACTIVE:
      if (deviceConnected && !oldDeviceConnected) {
        oldDeviceConnected = true;
        Serial.println("🎉 Client connected!");
        delay(2000);
        updateConnectionUI(2);
        delay(1000);
        currentState = STATE_CLIENT_CONNECTED;
      }
      
      if (!deviceConnected && oldDeviceConnected) {
        oldDeviceConnected = false;
        Serial.println("⚠️ Client disconnected");
        updateConnectionUI(1);
        
        // Auto-restart advertising jika terputus
        if (bleActive) {
          static unsigned long lastAdvertisingRestart = 0;
          if (millis() - lastAdvertisingRestart >= 2000) { // Throttle: max 1x per 2 detik
            lastAdvertisingRestart = millis();
            Serial.println("🔄 Auto-restarting BLE advertising...");
            BLEDevice::startAdvertising();
            Serial.println("✅ Advertising restarted - waiting for reconnection...");
          }
        }
      }
      
      // Pastikan BLE tetap aktif dan advertising
      if (bleActive && !BLEDevice::getAdvertising()->isAdvertising()) {
        static unsigned long lastCheck = 0;
        if (millis() - lastCheck >= 5000) { // Check setiap 5 detik
          lastCheck = millis();
          Serial.println("⚠️  Advertising stopped, restarting...");
          BLEDevice::startAdvertising();
          Serial.println("✅ Advertising restarted");
        }
      }
      break;
      
    case STATE_CLIENT_CONNECTED:
      showMainScreen();
      readSensorData();
      updateSensorDataForScreen(currentScreen);
      sendBLEData();
      sendBLEMessage("Welcome to CareRing! Send HELP for commands");
      currentState = STATE_MAIN;
      lastDataUpdate = millis();
      Serial.println("🟢 State: MAIN");
      break;

    case STATE_MAIN:
      // Read sensor frequently (every 50ms for responsive heart rate detection)
      if (millis() - lastSensorRead >= 50) {
        lastSensorRead = millis();
        readSensorData();
      }

      // Read temperature data (handled internally with its own timing)
      readTemperatureData();

      // Update UI and send BLE data (every 500ms)
      if (millis() - lastDataUpdate >= 500) {
        lastDataUpdate = millis();
        updateSensorDataForScreen(currentScreen);
        sendBLEData();  // Kirim ke HP via BLE → HP upload ke Firebase
      }
      
      if (!deviceConnected && oldDeviceConnected) {
        oldDeviceConnected = false;
        Serial.println("📡 Client disconnected. Auto-restarting BLE advertising...");
        
        // Auto-restart advertising
        if (bleActive) {
          delay(500);
          BLEDevice::startAdvertising();
          Serial.println("✅ BLE advertising restarted - Device discoverable again");
          Serial.println("⏳ Waiting for reconnection...");
        } else {
          Serial.println("⚠️  BLE inactive, will restart in BLE_ACTIVE state");
        }
        
        // Kembali ke BLE_ACTIVE state (bukan IDLE) agar BLE tetap aktif
        currentState = STATE_BLE_ACTIVE;
        updateConnectionUI(1); // Show "Connecting..." UI
        
        Serial.println("💡 BLE will remain active and auto-restart advertising");
        Serial.println("   No need to press button - just reconnect from web app");
      }
      
      if (deviceConnected && !oldDeviceConnected) {
        oldDeviceConnected = true;
        Serial.println("🔄 Client reconnected!");
      }
      break;
  }
}
