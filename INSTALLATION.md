# 安裝和配置指南

## 目錄

1. [前置要求](#前置要求)
2. [硬件連接](#硬件連接)
3. [軟件安裝](#軟件安裝)
4. [配置步驟](#配置步驟)
5. [測試驗證](#測試驗證)
6. [故障排查](#故障排查)

---

## 前置要求

### 硬件
- ESP32 開發板 (推薦 ESP32-DevKitC 或相似版本)
- 靜電場傳感器模塊 (輸出 0-3.3V)
- USB-A 到 Micro USB 線
- 杜邦線 (若干)
- 計算機或筆記本電腦 (任何作業系統)

### 軟件
- Arduino IDE (v1.8.13 或更高版本) - 下載: https://www.arduino.cc/en/main/software
- USB 驅動程序 (CH340 或 CP2102，根據您的開發板)
- 網絡瀏覽器 (Chrome、Firefox、Safari 或 Edge)

---

## 硬件連接

### 1. 傳感器接線

將靜電場傳感器連接到 ESP32：

```
傳感器引腳    →    ESP32 引腳
┌─────────────────────────────┐
│ VCC (+)      →    3V3 (3.3V) │
│ GND (-)      →    GND        │
│ Signal (OUT) →    GPIO34 (A0)│
└─────────────────────────────┘
```

**注意**: GPIO34 和 GPIO35 是唯一不支持 PWM 的 ADC 引腳，因此推薦用於模擬輸入。

### 2. 連接至計算機

使用 USB Micro 線將 ESP32 連接到計算機。

---

## 軟件安裝

### 第一步：安裝 Arduino IDE

1. 訪問 https://www.arduino.cc/en/main/software
2. 下載適合您作業系統的版本
3. 按照安裝嚮導完成安裝

### 第二步：安裝 ESP32 開發板支持

1. 打開 Arduino IDE
2. **文件 > 首選項 (Preferences)**
3. 在 "Additional Board Manager URLs" 中粘貼：
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
4. 點擊 **確定**
5. **工具 > 開發板 > 開發板管理器**
6. 搜尋 "esp32"
7. 安裝 "ESP32 by Espressif Systems"

### 第三步：安裝所需庫

1. **工具 > 管理庫**
2. 安裝以下庫：
   - `WiFi.h` (內置)
   - `PubSubClient` (作者: Nick O'Leary)
   - `ArduinoJson` (作者: Benoit Blanchon)

**搜索和安裝步驟**：
- 在搜索框中輸入庫名
- 點擊搜索結果
- 點擊 "安裝"

### 第四步：配置 USB 驅動程序

**Windows 使用者**：
1. 從 https://github.com/nodemcu/ch340g-ch34-ch34s-mac-linux-drivers 下載驅動程序
2. 安裝驅動程序

**Linux 使用者**：
```bash
sudo usermod -a -G dialout $USER
```

**macOS 使用者**：
- 通常自動安裝，無需額外操作

---

## 配置步驟

### 第一步：配置 ESP32 代碼

1. 在 Arduino IDE 中打開 `ESP32_Electrostatic_Meter.ino`

2. 修改以下配置 (第 20-21 行)：

```cpp
const char* WIFI_SSID = "YOUR_SSID";        // 改為您的 WiFi 名稱
const char* WIFI_PASSWORD = "YOUR_PASSWORD"; // 改為您的 WiFi 密碼
```

3. **可選**：修改 MQTT 設置 (第 24-27 行)

4. 選擇開發板和端口：
   - **工具 > 開發板** → 選擇 "ESP32 Dev Module"
   - **工具 > 端口** → 選擇您的 COM 端口

5. 上傳代碼：
   - 點擊 → (上傳按鈕)
   - 等待 "上傳完成" 消息

### 第二步：驗證 ESP32 連接

1. 打開 **串列監視器** (工具 > 串列監視器)
2. 設置波特率為 115200
3. 按下 ESP32 上的 RST 按鈕
4. 您應該看到：
   ```
   ╔═══════════════════════════════════════╗
   ║  靜電場強度量測系統 - ESP32           ║
   │  國科會科普實作計畫補助                  ║
   ╚═══════════════════════════════════════╝
   ```

### 第三步：配置網頁

1. 編輯 `config.js` 檔案

2. 根據需要修改配置 (主要是校準係數)：

```javascript
CALIBRATION: {
    conversionFactor: 30.3,  // 根據您的傳感器調整此值
    smoothingFactor: 0.1,
},
```

3. 保存文件

### 第四步：部署網頁

**選項 A：本地測試**
- 直接在瀏覽器中打開 `index.html`
- 或使用本地 Web 服務器

**選項 B：部署到服務器**
1. 上傳所有文件到 Web 服務器
2. 通過服務器 URL 訪問

---

## 測試驗證

### 1. WiFi 連接測試

檢查串列監視器是否顯示：
```
✓ WiFi已連接
  IP地址: 192.168.x.x
  信號強度: -50 dBm
```

### 2. MQTT 連接測試

檢查串列監視器是否顯示：
```
✓ MQTT已連接
  發布主題: iot/electrostatic/field
```

### 3. 網頁測試

1. 打開網頁
2. 在底部輸入 MQTT Broker 資訊
3. 點擊 "連接" 按鈕
4. 檢查連接狀態 (應該顯示 "連線中" 和綠色指示燈)
5. 應該看到實時數據更新

### 4. 信號健全性測試

- 在傳感器附近輕輕移動手指
- 磨擦傳感器 (產生靜電)
- 觀察數值變化

---

## 故障排查

### 問題 1：無法上傳代碼到 ESP32

**症状**: "連接失敗" 或 "端口不可用"

**解決方案**：
1. 檢查 USB 線連接
2. 確保已安裝 USB 驅動程序
3. 在 5 秒內重新連接 USB
4. 重新啟動 Arduino IDE

### 問題 2：WiFi 連接失敗

**症状**: 串列監視器顯示 "WiFi連接失敗"

**解決方案**：
1. 檢查 WiFi 名稱和密碼是否正確
2. 確保 WiFi 信號良好
3. 檢查 WiFi 是否允許 2.4GHz 連接 (ESP32 不支持 5GHz)
4. 嘗試使用 WiFi 密碼重置 ESP32

### 問題 3：MQTT 連接失敗

**症状**: 串列監視器顯示 "MQTT連接失敗"

**解決方案**：
1. 檢查 Broker 地址是否正確
2. 確保 WiFi 已連接
3. 檢查防火牆設置
4. 嘗試使用不同的 MQTT Broker
5. 檢查網絡延遲 (某些地區可能無法訪問 broker.emqx.io)

### 問題 4：網頁無法接收數據

**症状**: 網頁連接成功，但沒有數據顯示

**解決方案**：
1. 打開瀏覽器開發者工具 (F12 → 控制台)
2. 查看是否有錯誤信息
3. 確認 MQTT Topic 與 ESP32 代碼一致
4. 檢查 ESP32 串列監視器是否顯示 "📤 數據已發送"
5. 嘗試手動發送測試消息到 Topic

### 問題 5：數據波動異常

**症状**: 數值紊亂，變化無規律

**解決方案**：
1. 檢查傳感器接線是否牢固
2. 增加 `SAMPLE_COUNT` (多次採樣平均)
3. 增加 `smoothingFactor` (增加濾波量)
4. 檢查是否有電磁干擾

---

## 進階配置

### 1. 校準傳感器

獲得最佳測量結果：

```cpp
// 在已知環境中進行測試
1. 記錄 10 個 ADC 讀數
2. 計算平均值
3. 調整 CALIBRATION 中的 conversionFactor

實際場強 (V/m) = ADC值 × (3.3V / 4095) × conversionFactor
```

### 2. 自定義採樣率

修改 `MQTT_PUBLISH_INTERVAL`：
- 500ms = 2Hz (快速響應)
- 1000ms = 1Hz (平衡)
- 5000ms = 0.2Hz (低功耗)

### 3. 聯網診斷

使用 `mosquitto_sub` 檢查數據：
```bash
mosquitto_sub -h broker.emqx.io -t "iot/electrostatic/field"
```

---

## 支持和反饋

如有問題：

1. 查看 README.md 中的故障排查部分
2. 檢查 Arduino IDE 串列監視器的錯誤消息
3. 查看瀏覽器控制台的 JavaScript 錯誤
4. 驗證硬件連接

---

**國科會科普實作計畫補助**

*最後更新時間: 2024-04-28*
