// MQTT Configuration
let mqttClient = null;
let isConnected = false;
const dataPoints = [];
const maxDataPoints = CONFIG.CHART.maxDataPoints; // 5 minutes at 1Hz sampling rate

// Chart instance
let chart = null;

// Statistics
let statistics = {
    min: Infinity,
    max: -Infinity,
    sum: 0,
    count: 0,
    squaredSum: 0,
};

// DOM Elements
const connectionStatus = document.getElementById('connection-status');
const lastUpdate = document.getElementById('last-update');
const sampleRate = document.getElementById('sample-rate');
const fieldStrength = document.getElementById('field-strength');
const rawVoltage = document.getElementById('raw-voltage');
const minValue = document.getElementById('min-value');
const maxValue = document.getElementById('max-value');
const avgValue = document.getElementById('avg-value');
const connectBtn = document.getElementById('connect-btn');
const clearBtn = document.getElementById('clear-btn');
const exportBtn = document.getElementById('export-btn');
const brokerInput = document.getElementById('broker-input');
const topicInput = document.getElementById('topic-input');

// Calibration parameters (these should match ESP32 settings)
const CALIBRATION = {
    adcResolution: CONFIG.ADC.maxValue,
    vrefVoltage: CONFIG.ADC.vrefVoltage,
    adcPin: CONFIG.ADC.pin,
    conversionFactor: CONFIG.CALIBRATION.conversionFactor,
};

// Initialize Chart
function initChart() {
    const ctx = document.getElementById('fieldStrengthChart').getContext('2d');

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '靜電場強度 (V/m)',
                data: [],
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                pointBackgroundColor: '#00f0ff',
                pointBorderColor: '#00d4ff',
                pointHoverRadius: 4,
                segment: {
                    borderColor: (ctx) => {
                        // Color segments based on intensity
                        const value = ctx.p1DataIndex >= 0 ? dataPoints[ctx.p1DataIndex] : 0;
                        if (value > 5000) return '#ff3366';
                        if (value > 3000) return '#ffaa00';
                        return '#00d4ff';
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 12,
                            family: "'Arial', 'Microsoft JhengHei', sans-serif"
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 14, 39, 0.8)',
                    titleColor: '#00d4ff',
                    bodyColor: '#a0aec0',
                    borderColor: '#00d4ff',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 6,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function (context) {
                            return `強度: ${context.parsed.y.toFixed(2)} V/m`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 212, 255, 0.1)',
                        drawBorder: false,
                    },
                    ticks: {
                        color: '#a0aec0',
                        font: { size: 11 },
                        callback: (value) => value.toFixed(0)
                    },
                    title: {
                        display: true,
                        text: '強度 (V/m)',
                        color: '#00d4ff',
                        font: { size: 12, weight: 'bold' }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 212, 255, 0.05)',
                    },
                    ticks: {
                        color: '#a0aec0',
                        font: { size: 11 },
                        maxRotation: 45,
                        minRotation: 0
                    },
                    title: {
                        display: true,
                        text: '時間',
                        color: '#00d4ff',
                        font: { size: 12, weight: 'bold' }
                    }
                }
            }
        }
    });
}

// Convert ADC value to field strength
function adcToFieldStrength(adcValue) {
    // Convert ADC value to voltage
    const voltage = (adcValue / CALIBRATION.adcResolution) * CALIBRATION.vrefVoltage;
    // Convert voltage to field strength (V/m)
    const fieldStrengthVm = voltage * CALIBRATION.conversionFactor;
    return {
        voltage: voltage,
        fieldStrength: fieldStrengthVm
    };
}

// Update display with new data
function updateDisplay(adcValue) {
    const { voltage, fieldStrength: strength } = adcToFieldStrength(adcValue);

    // Add to data array
    dataPoints.push(strength);
    if (dataPoints.length > maxDataPoints) {
        dataPoints.shift();
    }

    // Update statistics
    updateStatistics(strength);

    // Update UI
    const now = new Date();
    fieldStrength.textContent = strength.toFixed(2);
    fieldStrength.classList.add('update');
    setTimeout(() => fieldStrength.classList.remove('update'), 300);

    rawVoltage.textContent = voltage.toFixed(3);
    lastUpdate.textContent = now.toLocaleTimeString('zh-TW');
    minValue.textContent = statistics.min.toFixed(2);
    maxValue.textContent = statistics.max.toFixed(2);
    avgValue.textContent = (statistics.sum / statistics.count).toFixed(2);

    // Update stats table
    updateStatsTable();

    // Update chart
    updateChart();

    // Calculate and display sample rate
    updateSampleRate();
}

// Update statistics
function updateStatistics(value) {
    statistics.min = Math.min(statistics.min, value);
    statistics.max = Math.max(statistics.max, value);
    statistics.sum += value;
    statistics.squaredSum += value * value;
    statistics.count++;
}

// Calculate standard deviation
function getStandardDeviation() {
    if (statistics.count === 0) return 0;
    const mean = statistics.sum / statistics.count;
    const variance = (statistics.squaredSum / statistics.count) - (mean * mean);
    return Math.sqrt(Math.max(0, variance)); // Prevent negative variance due to rounding
}

// Update statistics table
function updateStatsTable() {
    document.getElementById('stat-current').textContent = 
        dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].toFixed(2) : '0.00';
    document.getElementById('stat-peak').textContent = statistics.max.toFixed(2);
    document.getElementById('stat-min').textContent = statistics.min.toFixed(2);
    document.getElementById('stat-avg').textContent = 
        (statistics.count > 0 ? statistics.sum / statistics.count : 0).toFixed(2);
    document.getElementById('stat-std').textContent = getStandardDeviation().toFixed(2);
    document.getElementById('stat-count').textContent = statistics.count;
}

// Update chart
function updateChart() {
    if (!chart) return;

    // Generate time labels
    const now = new Date();
    const labels = dataPoints.map((_, index) => {
        const time = new Date(now.getTime() - (dataPoints.length - 1 - index) * 1000);
        return time.toLocaleTimeString('zh-TW').substring(0, 8);
    });

    chart.data.labels = labels;
    chart.data.datasets[0].data = dataPoints;
    chart.update('none'); // Update without animation for better performance
}

// Update sample rate
let lastUpdateTime = Date.now();
let updateCount = 0;

function updateSampleRate() {
    updateCount++;
    const now = Date.now();
    const timeDiff = now - lastUpdateTime;

    if (timeDiff >= 1000) {
        const rate = (updateCount / (timeDiff / 1000)).toFixed(1);
        sampleRate.textContent = rate + ' Hz';
        updateCount = 0;
        lastUpdateTime = now;
    }
}

// MQTT Connection
function connectMQTT() {
    const broker = brokerInput.value || CONFIG.MQTT.server;
    const topic = topicInput.value || CONFIG.MQTT.topic;

    // Use mqtt over WebSocket / secure connection
    const clientId = CONFIG.MQTT.clientIdPrefix + '-' + Math.random().toString(36).substr(2, 9);
    const connectUrl = `wss://${broker}:${CONFIG.MQTT.port}/mqtt`;

    console.log('Connect button clicked');
    console.log('Connecting to:', connectUrl);
    console.log('Topic:', topic);
    setConnectingStatus();

    mqttClient = mqtt_connect(connectUrl, {
        clientId: clientId,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 4000,
    });

    mqttClient.on('connect', () => {
        console.log('MQTT Connected');
        isConnected = true;
        updateConnectionStatus(true);
        mqttClient.subscribe(topic, { qos: 0 }, (err) => {
            if (err) {
                console.error('Subscribe error:', err);
            } else {
                console.log('Subscribed to:', topic);
            }
        });
    });

    mqttClient.on('message', (receivedTopic, payload) => {
        try {
            const message = payload.toString();
            console.log('Received:', message, 'from topic:', receivedTopic);

            // Parse the message - could be just a number or JSON
            let adcValue;
            try {
                const data = JSON.parse(message);
                adcValue = data.adc || data.value || parseInt(message);
            } catch {
                adcValue = parseInt(message);
            }

            if (!isNaN(adcValue)) {
                updateDisplay(adcValue);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    mqttClient.on('error', (error) => {
        console.error('MQTT Error:', error);
        isConnected = false;
        updateConnectionStatus(false);
    });

    mqttClient.on('close', () => {
        console.log('MQTT Disconnected');
        isConnected = false;
        updateConnectionStatus(false);
    });

    mqttClient.on('offline', () => {
        console.log('MQTT Offline');
        isConnected = false;
        updateConnectionStatus(false);
    });
}

// Update connection status
function setConnectingStatus() {
    connectionStatus.textContent = '連線中...';
    connectionStatus.className = 'indicator connecting';
    connectBtn.textContent = '連線中';
}

function updateConnectionStatus(connected) {
    if (connected) {
        connectionStatus.textContent = '連線中';
        connectionStatus.className = 'indicator online';
        connectBtn.textContent = '斷開連接';
    } else {
        connectionStatus.textContent = '離線';
        connectionStatus.className = 'indicator offline';
        connectBtn.textContent = '連接';
    }
}

// Disconnect MQTT
function disconnectMQTT() {
    if (mqttClient) {
        mqttClient.end();
        mqttClient = null;
        isConnected = false;
        updateConnectionStatus(false);
    }
}

// Clear data
function clearData() {
    dataPoints.length = 0;
    statistics = {
        min: Infinity,
        max: -Infinity,
        sum: 0,
        count: 0,
        squaredSum: 0,
    };
    fieldStrength.textContent = '0.00';
    rawVoltage.textContent = '0.00';
    minValue.textContent = '0.00';
    maxValue.textContent = '0.00';
    avgValue.textContent = '0.00';
    updateChart();
    updateStatsTable();
}

// Export data as CSV
function exportData() {
    if (dataPoints.length === 0) {
        alert('沒有數據可以導出');
        return;
    }

    const now = new Date();
    const csv = [
        ['時間戳', '靜電場強度(V/m)', ''],
        ...dataPoints.map((value, index) => {
            const time = new Date(now.getTime() - (dataPoints.length - 1 - index) * 1000);
            return [time.toISOString(), value.toFixed(2)];
        })
    ];

    const csvContent = csv.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `electrostatic_data_${now.toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Event Listeners
connectBtn.addEventListener('click', () => {
    if (isConnected) {
        disconnectMQTT();
    } else {
        connectMQTT();
    }
});

clearBtn.addEventListener('click', () => {
    if (confirm('確定要清除所有數據嗎？')) {
        clearData();
    }
});

exportBtn.addEventListener('click', exportData);

// Simulate data for testing (remove this in production)
function enableSimulationMode() {
    // Uncomment to test without MQTT
    /*
    setInterval(() => {
        const baseValue = Math.sin(Date.now() / 5000) * 1000 + 1000;
        const noise = (Math.random() - 0.5) * 200;
        const adcValue = Math.floor(Math.max(0, Math.min(4095, baseValue + noise)));
        updateDisplay(adcValue);
    }, 1000);
    */
}

// Function to connect using MQTT.js library (fallback to paho-mqtt if available)
// This uses the mqtt.js library bundled with the page
function mqtt_connect(url, options) {
    return window.mqtt.connect(url, options);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    updateConnectionStatus(false);
    
    // Auto-connect if using default values
    // Uncomment to auto-connect:
    // setTimeout(connectMQTT, 500);
});
