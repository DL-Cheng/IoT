/*
 * 靜電場強度量測系統 - ESP32 程式碼
 * 
 * 功能: 
 * - 讀取ADC0引腳的模擬電壓
 * - 透過WiFi連接到MQTT Broker
 * - 定期發送數據到MQTT主題
 * 
 * 硬件要求:
 * - ESP32開發板
 * - 靜電場傳感器 (連接到ADC0/GPIO34或GPIO35)
 * 
 * 庫依賴:
 * - WiFi (內置)
 * - PubSubClient (需要安裝)
 * 
 * 作者: IoT 靜電場測量團隊
 * 日期: 2024-04-28
 * 補助: 國科會科普實作計畫
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ==================== 配置區 ====================

// WiFi 設置
const char* WIFI_SSID = "YOUR_SSID";              // 更改為您的WiFi名稱
const char* WIFI_PASSWORD = "YOUR_PASSWORD";      // 更改為您的WiFi密碼

// MQTT 設置
const char* MQTT_SERVER = "broker.emqx.io";
const int MQTT_PORT = 8883;
const char* MQTT_CLIENT_ID = "esp32_field_meter";
const char* MQTT_TOPIC = "iot/electrostatic/field";
const char* MQTT_PUBLISH_INTERVAL = 1000;         // 發送間隔 (毫秒)

// ADC 設置 (A0 引腳)
const int ADC_PIN = 34;                           // GPIO34 (ADC0, 不能使用PWM)
const int ADC_ATTENUATION = 3;                    // 0=0-1.1V, 1=0-1.4V, 2=0-2V, 3=0-3.6V
const int ADC_WIDTH = 12;                         // 12位分辨率 (0-4095)
const int SAMPLE_COUNT = 10;                      // 每次發送前平均採樣數

// ==================== 全局變量 ====================

WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);
unsigned long lastSendTime = 0;
bool isWiFiConnected = false;
bool isMQTTConnected = false;

// ==================== 設置函數 ====================

void setup() {
    // 初始化串列通訊 (用於除錯)
    Serial.begin(115200);
    delay(2000);
    
    Serial.println("\n\n");
    Serial.println("╔═══════════════════════════════════════╗");
    Serial.println("║  靜電場強度量測系統 - ESP32           ║");
    Serial.println("║  國科會科普實作計畫補助                  ║");
    Serial.println("╚═══════════════════════════════════════╝");
    
    // 初始化ADC
    initADC();
    
    // 連接WiFi
    connectToWiFi();
    
    // 使用 TLS 連接 MQTT Broker
    espClient.setInsecure();
    mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
    mqttClient.setCallback(onMQTTMessage);
    
    Serial.println("✓ 初始化完成");
}

// ==================== 主循環 ====================

void loop() {
    // 檢查WiFi連接
    if (!WiFi.isConnected()) {
        if (isWiFiConnected) {
            Serial.println("⚠ WiFi連接已中斷");
            isWiFiConnected = false;
        }
        connectToWiFi();
    } else {
        if (!isWiFiConnected) {
            Serial.println("✓ WiFi已連接");
            isWiFiConnected = true;
        }
    }
    
    // 檢查MQTT連接
    if (!mqttClient.connected()) {
        if (isMQTTConnected) {
            Serial.println("⚠ MQTT連接已中斷");
            isMQTTConnected = false;
        }
        connectToMQTT();
    } else {
        if (!isMQTTConnected) {
            Serial.println("✓ MQTT已連接");
            isMQTTConnected = true;
        }
    }
    
    mqttClient.loop();
    
    // 定期發送數據
    unsigned long now = millis();
    if (now - lastSendTime >= MQTT_PUBLISH_INTERVAL) {
        lastSendTime = now;
        publishSensorData();
    }
    
    delay(10); // 防止看門狗超時
}

// ==================== ADC 初始化 ====================

void initADC() {
    Serial.println("初始化ADC...");
    
    // 設置ADC寬度
    analogReadResolution(ADC_WIDTH);
    
    // 設置衰減 (允許更高的輸入電壓)
    analogSetAttenuation((adc_attenuation_t)ADC_ATTENUATION);
    
    // 暖機 - 丟棄前幾次讀數
    for (int i = 0; i < 10; i++) {
        analogRead(ADC_PIN);
        delay(10);
    }
    
    Serial.println("✓ ADC初始化完成");
    Serial.println("  - 分辨率: 12位 (0-4095)");
    Serial.println("  - 衰減: 11dB (0-3.6V)");
}

// ==================== WiFi 連接 ====================

void connectToWiFi() {
    if (WiFi.isConnected()) {
        return;
    }
    
    Serial.print("正在連接WiFi: ");
    Serial.println(WIFI_SSID);
    
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    int attempts = 0;
    const int MAX_ATTEMPTS = 40;
    
    while (WiFi.status() != WL_CONNECTED && attempts < MAX_ATTEMPTS) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.isConnected()) {
        Serial.println();
        Serial.println("✓ WiFi已連接");
        Serial.print("  IP地址: ");
        Serial.println(WiFi.localIP());
        Serial.print("  信號強度: ");
        Serial.print(WiFi.RSSI());
        Serial.println(" dBm");
    } else {
        Serial.println();
        Serial.println("✗ WiFi連接失敗，將在5秒後重試");
        delay(5000);
    }
}

// ==================== MQTT 連接 ====================

void connectToMQTT() {
    Serial.print("正在連接MQTT: ");
    Serial.println(MQTT_SERVER);
    
    // 創建客戶端ID (加入隨機數)
    String clientId = String(MQTT_CLIENT_ID) + "_" + random(10000);
    
    if (mqttClient.connect(clientId.c_str())) {
        Serial.println("✓ MQTT已連接");
        Serial.print("  客戶端ID: ");
        Serial.println(clientId);
        Serial.print("  發布主題: ");
        Serial.println(MQTT_TOPIC);
        
        // 訂閱控制主題 (可選)
        const char* controlTopic = "iot/electrostatic/control";
        mqttClient.subscribe(controlTopic);
        Serial.print("  訂閱主題: ");
        Serial.println(controlTopic);
    } else {
        Serial.print("✗ MQTT連接失敗，錯誤代碼: ");
        Serial.println(mqttClient.state());
        Serial.println("  將在5秒後重試");
        delay(5000);
    }
}

// ==================== 發送傳感器數據 ====================

void publishSensorData() {
    // 讀取並平均化ADC值
    int adcSum = 0;
    for (int i = 0; i < SAMPLE_COUNT; i++) {
        adcSum += analogRead(ADC_PIN);
        delay(2);
    }
    int adcValue = adcSum / SAMPLE_COUNT;
    
    // 計算電壓 (3.3V參考, 12位分辨率)
    float voltage = (float)adcValue / 4095.0 * 3.3;
    
    // 創建JSON負載
    StaticJsonDocument<256> doc;
    doc["adc"] = adcValue;
    doc["voltage"] = serialized(String(voltage, 3));
    doc["timestamp"] = millis();
    doc["rssi"] = WiFi.RSSI();
    doc["mac"] = WiFi.macAddress();
    
    // 序列化JSON
    String payload;
    serializeJson(doc, payload);
    
    // 發送MQTT消息
    if (mqttClient.publish(MQTT_TOPIC, payload.c_str())) {
        // 發送成功
        static unsigned long lastPrintTime = 0;
        if (millis() - lastPrintTime >= 5000) {  // 每5秒打印一次
            lastPrintTime = millis();
            Serial.print("📤 數據已發送 | ADC=");
            Serial.print(adcValue);
            Serial.print(" Voltage=");
            Serial.print(voltage, 3);
            Serial.print("V WiFi=");
            Serial.print(WiFi.RSSI());
            Serial.println("dBm");
        }
    } else {
        Serial.println("✗ 發送失敗");
    }
}

// ==================== MQTT 回調函數 ====================

void onMQTTMessage(char* topic, byte* payload, unsigned int length) {
    Serial.print("📥 收到消息 | 主題: ");
    Serial.print(topic);
    Serial.print(" | 內容: ");
    
    String message;
    for (unsigned int i = 0; i < length; i++) {
        message += (char)payload[i];
        Serial.print((char)payload[i]);
    }
    Serial.println();
    
    // 處理控制命令
    if (String(topic) == "iot/electrostatic/control") {
        if (message == "reboot") {
            Serial.println("↻ 重新啟動中...");
            delay(1000);
            ESP.restart();
        }
    }
}

// ==================== 系統狀態信息 ====================

void printSystemInfo() {
    Serial.println("\n╔════════ 系統資訊 ════════╗");
    Serial.print("║ ESP32 晶片版本: ");
    Serial.println(ESP.getChipRevision());
    Serial.print("║ CPU頻率: ");
    Serial.print(ESP.getCpuFreqMHz());
    Serial.println(" MHz");
    Serial.print("║ 剩餘RAM: ");
    Serial.print(esp_get_free_heap_size() / 1024);
    Serial.println(" KB");
    Serial.print("║ Flash大小: ");
    Serial.print(ESP.getFlashChipSize() / 1024 / 1024);
    Serial.println(" MB");
    Serial.println("╚═══════════════════════════╝\n");
}
