# 快速開始指南

## 簡介

本系統是一個用於實時監測靜電場強度的 IoT 解決方案。通過 ESP32 讀取傳感器數據，經由 MQTT 協定傳輸，最後在網頁顯示。

---

## 文件說明

```
IoT/
├── index.html                    # 主網頁面板
├── test.html                     # 模擬測試頁面
├── style.css                     # 樣式表 (物理科技感設計)
├── script.js                     # 主程式邏輯通訊和數據處理
├── simulation.js                 # 模擬模式腳本
├── config.js                     # 系統配置文件
├── ESP32_Electrostatic_Meter.ino # ESP32 Arduino 程式碼
├── README.md                     # 完整文檔
├── INSTALLATION.md               # 詳細安裝和配置指南
└── QUICK_START.md                # 本文件
```

---

## 一分鐘快速開始

### 第一步：測試網頁功能

如果您還沒有硬件，可以先在瀏覽器中測試網頁功能：

1. 打開 `test.html` 文件
2. 網頁會自動開始模擬數據
3. 您可以選擇不同的模擬模式：
   - **正弦波**：規律的上下波動
   - **隨機噪聲**：隨機浮動的數值
   - **脈衝**：脈動式的數據
   - **混合**：多種模式的組合

### 第二步：配置 ESP32 硬件

1. **連接硬件**
   - 將靜電場傳感器連接到 ESP32 的 GPIO34 (A0)
   - 詳見 [INSTALLATION.md](INSTALLATION.md#硬件連接)

2. **編程**
   - 在 Arduino IDE 中打開 `ESP32_Electrostatic_Meter.ino`
   - 修改 WiFi 名稱和密碼 (第 20-21 行)
   - 上傳到 ESP32

### 第三步：運行系統

1. **打開網頁**
   - 在瀏覽器中打開 `index.html`

2. **連接到 MQTT**
   - Broker地址: `broker.emqx.io` (預設)
   - Topic: `iot/electrostatic/field` (預設)
   - 點擊 "連接" 按鈕

3. **查看實時數據**
   - 連接成功後，應該看到：
     - 綠色的 "連線中" 指示燈
     - 實時更新的場強數值
     - 時間序列圖表

---

## 功能概覽

### 📊 主顯示區
- **大型數值顯示**: 當前靜電場強度
- **原始電壓**: 傳感器的實際輸入電壓
- **三個側框**: 最小值、最大值、平均值

### 📈 分析工具
- **實時圖表**: 時間序列數據可視化
- **統計表格**: 詳細的統計信息
  - 當前值、峰值、最小值、平均值、標準差、數據點數

### 🎛️ 操作面板
- **連接按鈕**: 連接/斷開 MQTT
- **清除按鈕**: 重置所有數據
- **導出按鈕**: 下載 CSV 數據
- **自定義配置**: 修改 Broker 和 Topic

### 🎨 界面設計
- **物理科技感**: 深色主題、青色發光效果
- **響應式設計**: 支持桌面和移動設備
- **實時反饋**: 數值變化時有動畫效果

---

## 數據流程

```
[靜電場]->[傳感器]->[ESP32 ADC]
                        |
                    [WiFi]
                        |
                  [MQTT Broker]
                   broker.emqx.io
                        |
                   [WebSocket]
                        |
                   [網頁面板]
                        |
                   [圖表展示]
```

---

## 常見問題

**Q: 可以離線使用嗎?**
A: 不行。系統需要WiFi連接才能正常工作。

**Q: 可以自定義 Broker 嗎?**
A: 可以。在 `script.js` 第一次連接時修改 Broker 地址。

**Q: 如何校準傳感器?**
A: 修改 `config.js` 中的 `conversionFactor` 值。詳見 [INSTALLATION.md](INSTALLATION.md#校準說明)

**Q: 網頁無法接收數據?**
A: 
1. 檢查 ESP32 是否已連接 WiFi
2. 確認 MQTT Topic 一致
3. 查看瀏覽器控制台是否有錯誤

**Q: 怎樣獲得最準確的測量?**
A: 
1. 讓系統運行 5-10 分鐘熱機
2. 在穩定環境中進行測量
3. 根據已知標準進行校準

---

## 代碼結構

### script.js 的主要函數

```javascript
// 初始化
initChart()              // 創建圖表
connectMQTT()           // 連接 MQTT
disconnectMQTT()        // 斷開連接

// 數據處理
adcToFieldStrength()    // ADC值轉換到場強
updateDisplay()          // 更新 UI
updateStatistics()       // 更新統計信息

// 用戶交互
clearData()             // 清除所有數據
exportData()            // 導出為 CSV
```

### HTML 的主要區塊

```html
<header>        <!-- 標題和副題 -->
<status>        <!-- 連接狀態 -->
<data-display>  <!-- 主數值顯示 -->
<chart>         <!-- 時間序列圖表 -->
<stats-table>   <!-- 統計表格 -->
<controls>      <!-- 操作面板 -->
<footer>        <!-- 國科會補助顯示 -->
```

---

## 部署選項

### 選項 1：本地測試
```bash
# 直接打開 HTML 文件
# 或使用 Python HTTP 服務器
python3 -m http.server 8000
# 訪問 http://localhost:8000/index.html
```

### 選項 2：在線部署
- 上傳所有文件到 Web 服務器 (如 GitHub Pages)
- 通過 HTTPS (WebSocket 需要 HTTPS)
- 配置 CORS (如需要)

### 選項 3：本地 Docker
```bash
# 創建 Docker 容器運行 Web 服務器
docker run -d -p 8080:80 -v /path/to/IoT:/usr/share/nginx/html nginx
```

---

## 安全提示

⚠️ **重要**：
1. 不要在代碼中硬編碼 WiFi 密碼
2. 使用環境變量或配置文件
3. MQTT Broker 應該支持加密連接
4. 定期更新 Arduino 庫

---

## 下一步

1. 閱讀 [INSTALLATION.md](INSTALLATION.md) 瞭解詳細設置
2. 查看 [README.md](README.md) 獲得完整文檔
3. 修改 `config.js` 自定義配置
4. 測試不同的傳感器設置

---

## 技術支持

如遇到問題：

1. **查看日誌**
   - ESP32: 串列監視器
   - 網頁: 瀏覽器開發者工具 (F12)

2. **檢查連接**
   ```bash
   # 測試 MQTT 連接
   mqtt_sub -h broker.emqx.io -t "iot/electrostatic/field"
   ```

3. **驗證硬件**
   - 檢查接線
   - 測試傳感器
   - 確認 ADC 讀值

## 關鍵文件修改指南

| 文件 | 用途 | 常見修改 |
|-----|------|---------|
| config.js | 系統配置 | conversionFactor, maxDataPoints |
| script.js | 邏輯代碼 | MQTT topic, 數據處理算法 |
| style.css | 視覺設計 | 顏色、字體、佈局 |
| ESP32_Electrostatic_Meter.ino | 硬件代碼 | WiFi憑證、PIN 腳、採樣率 |

---

## 版本信息

- **系統版本**: 1.0
- **發佈日期**: 2024-04-28
- **補助機構**: 國科會科普實作計畫

---

**祝您使用愉快！** 🚀

有任何問題或建議，請參考完整文檔或檢查故障排查部分。
