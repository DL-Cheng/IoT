/* 
 * 靜電場強度量測系統 - 系統配置設定檔
 * 此文件用於統一管理系統的配置參數
 * 修改此文件無需更改其他代碼
 */

// ==================== MQTT 配置 ====================
const CONFIG = {
    MQTT: {
        // MQTT Broker 設置
        server: "broker.emqx.io",        // MQTT Broker 地址
        port: 8084,                       // MQTT WebSocket TLS 埠 (GitHub Pages 必須使用 wss)
        topic: "iot/electrostatic/field",  // 發布主題
        clientIdPrefix: "iot-field-meter", // 客戶端ID前綴
        reconnectTimeout: 4000,            // 重新連接超時時間
        requestTimeout: 4000,              // 請求超時時間
        
        // 發布設置
        publishInterval: 1000,             // 數據發布間隔 (毫秒)
        qos: 0,                           // 服務質量 (0/1/2)
    },

    // ==================== ADC 配置 ====================
    ADC: {
        pin: 34,                          // ESP32 ADC0 引腳 (GPIO34/35)
        resolution: 12,                   // ADC分辨率 (10-12位)
        maxValue: 4095,                   // 最大ADC值 (12位 = 4095)
        vrefVoltage: 3.3,                 // 參考電壓 (3.3V)
        attenuation: 11,                  // 衰減 dB (11dB允許0-3.3V)
        samplesPerRead: 10,               // 每次讀取的採樣平均數
    },

    // ==================== 校準配置 ====================
    CALIBRATION: {
        // 傳感器轉換係數 (V/m per volt)
        // 根據您的傳感器規格調整此值
        // 典型範圍: 20-50 V/m per volt
        // 計算公式: 實際場強(V/m) / 輸入電壓(V)
        conversionFactor: 30.3,
        
        // 偏移量 (V/m) - 可選，用於零點校準
        offsetValue: 0,
        
        // 低通濾波器係數 (0-1)
        // 0 = 無濾波, 1 = 完全平滑
        // 推薦值: 0.1-0.3
        smoothingFactor: 0.1,
    },

    // ==================== 圖表配置 ====================
    CHART: {
        // 最大數據點數
        // 300 @1Hz = 5分鐘數據
        // 600 @1Hz = 10分鐘數據
        maxDataPoints: 300,
        
        // 圖表更新方式
        // "none" = 無動畫 (性能最佳)
        // "active" = 有動畫效果
        animationMode: "none",
        
        // 圖表範圍 (自動調整)
        autoScale: true,
        minY: 0,
        maxY: 5000,
    },

    // ==================== UI 配置 ====================
    UI: {
        // 刷新速率
        updateInterval: 100,              // UI更新間隔 (毫秒)
        
        // 顯示精度
        displayPrecision: 2,              // 小數位數
        
        // 警告閾值
        warningThreshold: 3000,           // 場強警告值 (V/m)
        dangerThreshold: 5000,            // 場強危險值 (V/m)
        
        // 顏色主題
        colorScheme: "dark",              // "dark" 或 "light"
    },

    // ==================== 統計配置 ====================
    STATISTICS: {
        // 統計窗口大小
        windowSize: 300,                  // 點數
        
        // 異常值檢測
        enableOutlierDetection: true,
        outlierThreshold: 3,              // 標準差倍數
        
        // 數據導出格式
        exportFormat: "csv",              // "csv" 或 "json"
    },

    // ==================== 系統配置 ====================
    SYSTEM: {
        // 調試模式
        debugMode: false,
        
        // 模擬模式 (用於測試)
        enableSimulation: false,
        
        // 自動連接
        autoConnect: false,
        
        // 本地存儲
        enableLocalStorage: true,
        storageKey: "iot_field_meter_data",
        
        // 語言
        language: "zh-TW",
        
        // 時區偏移 (小時)
        timezoneOffset: 8,
    }
};

// ==================== 預設主題顏色 ====================
const THEMES = {
    dark: {
        primary: "#0a0e27",
        secondary: "#050810",
        accent: "#00d4ff",
        accentAlt: "#b024d9",
        success: "#00ff88",
        warning: "#ffaa00",
        danger: "#ff3366",
        text: "#ffffff",
        textSecond: "#a0aec0",
    },
    light: {
        primary: "#ffffff",
        secondary: "#f8f8f8",
        accent: "#0066cc",
        accentAlt: "#7700cc",
        success: "#00cc00",
        warning: "#ffaa00",
        danger: "#cc0000",
        text: "#000000",
        textSecond: "#666666",
    }
};

// ==================== 單位定義 ====================
const UNITS = {
    fieldStrength: "V/m",
    voltage: "V",
    current: "mA",
    power: "mW",
    temperature: "°C",
    humidity: "%RH",
};

// ==================== 通知模板 ====================
const NOTIFICATIONS = {
    connected: "MQTT已連接",
    disconnected: "MQTT已斷開",
    dataReceived: "已接收數據",
    error: "發生錯誤",
    warning: "警告: 場強超過閾值",
    danger: "危險: 場強強度可能對設備有害",
};

// 凍結配置對象，防止意外修改
Object.freeze(CONFIG);
Object.freeze(THEMES);
Object.freeze(UNITS);
Object.freeze(NOTIFICATIONS);

// 導出為全局變量
window.CONFIG = CONFIG;
window.THEMES = THEMES;
window.UNITS = UNITS;
window.NOTIFICATIONS = NOTIFICATIONS;
