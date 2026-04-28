# 靜電場強度量測系統

一個實時監測靜電場強度的網頁面板系統，通過ESP32讀取模擬電壓，經過MQTT協定傳輸到網頁進行可視化展示。

## 功能特性

- ⚡ **實時數據展示** - 即時顯示靜電場強度數據
- 📊 **數據圖表** - 時間序列圖表展示測量趨勢
- 📈 **統計分析** - 最小值、最大值、平均值、標準差等統計信息
- 🔌 **MQTT 連接** - 通過MQTT協定與ESP32通信
- 💾 **數據導出** - 支持導出CSV格式數據
- 🎨 **科技設計** - 現代化物理感十足的UI設計
- 📱 **響應式設計** - 支持桌面和移動設備

## 系統架構

```
ESP32 (模擬傳感器) 
    ↓
MQTT Broker (broker.emqx.io)
    ↓
網頁面板 (實時展示)
```

## 硬件要求

- ESP32 開發板
- 靜電場傳感器模塊
- USB供電線

## 軟件要求

- 任何現代瀏覽器 (Chrome, Firefox, Safari, Edge)
- MQTT Broker (推薦使用 broker.emqx.io)

## 快速開始

### 1. 網頁部署

直接在瀏覽器中打開 `index.html` 文件，或將文件部署到web服務器。

### 2. ESP32 Arduino 代碼

使用以下代碼配置ESP32：

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

// WiFi設置
const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

// MQTT設置
const char* mqtt_server = "broker.emqx.io";
const int mqtt_port = 8883;
const char* mqtt_topic = "iot/electrostatic/field";
const char* client_id = "esp32_field_meter";

// ADC引腳
const int ADC_PIN = 34; // GPIO34 (A0)

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
    Serial.begin(115200);
    
    // ADC設置
    analogReadResolution(12); // 12位分辨率 (0-4095)
    
    // WiFi連接
    connectToWiFi();
    
    // MQTT設置
    client.setServer(mqtt_server, mqtt_port);
}

void loop() {
    // 確保WiFi連接
    if (!WiFi.isConnected()) {
        connectToWiFi();
    }
    
    // 確保MQTT連接
    if (!client.connected()) {
        reconnect();
    }
    client.loop();
    
    // 讀取ADC值並發送
    int adcValue = analogRead(ADC_PIN);
    
    // 創建JSON消息
    char payload[50];
    snprintf(payload, sizeof(payload), "{\"adc\":%d}", adcValue);
    
    // 發送MQTT消息
    client.publish(mqtt_topic, payload);
    
    Serial.printf("ADC Value: %d\n", adcValue);
    
    delay(1000); // 每秒采一次樣
}

void connectToWiFi() {
    Serial.print("連接WiFi: ");
    Serial.println(ssid);
    
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 40) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.isConnected()) {
        Serial.println("\nWiFi已連接");
        Serial.print("IP地址: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\nWiFi連接失敗");
    }
}

void reconnect() {
    Serial.print("嘗試MQTT連接...");
    
    if (client.connect(client_id)) {
        Serial.println("MQTT已連接");
    } else {
        Serial.println("MQTT連接失敗，稍後重試...");
    }
}
```

### 3. 傳感器校準

編輯 `script.js` 中的 `CALIBRATION` 對象來調整轉換係數：

```javascript
const CALIBRATION = {
    adcResolution: 4095,        // ESP32 12位ADC分辨率
    vrefVoltage: 3.3,          // 參考電壓 (3.3V)
    adcPin: 0,                 // ADC衰減設置 (0 = 11dB)
    conversionFactor: 30.3,    // 轉換係數 (V/m per volt)
};
```

> **注意**: `conversionFactor` 需要根據您的傳感器規格調整

## 使用說明

### 連接到MQTT Broker

1. 在"Broker地址"欄輸入MQTT Broker的地址 (預設: broker.emqx.io)
2. 在"MQTT Topic"欄輸入主題 (預設: iot/electrostatic/field)
3. 點擊"連接"按鈕

### 查看實時數據

- **主資訊區**: 顯示當前靜電場強度和原始電壓
- **側邊框**: 顯示最小值、最大值、平均值
- **圖表區**: 實時展示時間序列數據
- **表格區**: 詳細的統計信息

### 數據管理

- **清除數據**: 刪除所有已收集的數據並重置統計信息
- **導出數據**: 導出為CSV文件用於進一步分析

## MQTT 消息格式

系統支持兩種消息格式：

**JSON格式** (推薦):
```json
{"adc": 2048}
```

**純數字格式**:
```
2048
```

## 校準說明

靜電場傳感器的校準係數取決於您使用的硬件：

- **標準靜電場傳感器**: 轉換係數通常為 20-50 V/m per volt
- 請根據傳感器的技術規格書調整 `conversionFactor` 值

### 校準步驟：

1. 在已知電場強度的環境中進行測試 (或使用校準標準)
2. 記錄ADC讀數和對應的實際電場強度
3. 計算轉換係數: `factor = actual_field_strength / (adc_voltage)`
4. 在代碼中更新 `conversionFactor` 值

## LED指示燈

- 🟢 **綠色閃爍**: MQTT已連接，正常工作
- 🔴 **紅色**: MQTT未連接，請檢查Broker地址和網絡

## 故障排查

### 1. 無法連接MQTT Broker

- 檢查瀏覽器是否有安全錯誤信息
- 確認Broker地址是否正確
- 檢查網絡連接
- 嘗試使用不同的Broker

### 2. 收不到數據

- 確認ESP32已連接WiFi
- 檢查MQTT Topic是否與ESP32代碼一致
- 查看瀏覽器控制台是否有錯誤信息
- 確認ESP32正在發送數據 (查看串列監視器)

### 3. 數據突然停止

- 檢查ESP32的WiFi連接
- 檢查MQTT Broker的狀態
- 重新啟動ESP32
- 刷新網頁

## 開發者信息

### 依賴庫

- **Chart.js**: 用於繪製圖表
- **MQTT.js**: 用於MQTT連接 (通過WebSocket)

### 核心算法

- **ADC轉換**: `voltage = (adc_value / 4095) * 3.3`
- **場強計算**: `field_strength = voltage * conversion_factor`
- **統計計算**: 使用滑動窗口計算實時統計

## 瀏覽器兼容性

| 瀏覽器 | 版本 | 支持狀態 |
|--------|------|---------|
| Chrome | 80+ | ✓ 完全支持 |
| Firefox | 75+ | ✓ 完全支持 |
| Safari | 13+ | ✓ 完全支持 |
| Edge | 80+ | ✓ 完全支持 |

## 許可証

本項目由國科會科普實作計畫補助

## 技術支持

如有問題，請檢查：
1. 瀏覽器控制台 (F12 → Console)
2. ESP32串列監視器
3. MQTT Broker日誌

## 更新歷史

- v1.0 (2024-04-28): 初始版本發佈

---

**國科會科普實作計畫補助**
