// Simulation Mode Script for Testing

let simulationRunning = true;
let simulationMode = 'sine';
let simulationTime = 0;
const dataPoints = [];
const maxDataPoints = CONFIG.CHART.maxDataPoints;

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
const clearBtn = document.getElementById('clear-btn');
const exportBtn = document.getElementById('export-btn');
const simulationToggle = document.getElementById('simulation-toggle');
const simulationModeSelect = document.getElementById('simulation-mode');

// Calibration parameters
const CALIBRATION = {
    adcResolution: CONFIG.ADC.maxValue,
    vrefVoltage: CONFIG.ADC.vrefVoltage,
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
                        font: { size: 12 }
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
                        fontSize: 11,
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 212, 255, 0.05)',
                    },
                    ticks: {
                        color: '#a0aec0',
                        fontSize: 11,
                    }
                }
            }
        }
    });
}

// Generate simulated ADC value
function generateSimulatedADC() {
    const baseValue = 2048; // 中間值
    let value;

    switch (simulationMode) {
        case 'sine':
            // 正弦波模式
            const amp = 1000;
            value = baseValue + amp * Math.sin(simulationTime / 100);
            break;

        case 'noise':
            // 隨機噪聲模式
            value = baseValue + (Math.random() - 0.5) * 1500;
            break;

        case 'spike':
            // 脈衝模式
            const period = 100;
            const posInPeriod = simulationTime % period;
            if (posInPeriod < 10) {
                value = baseValue + 1500; // 脈衝
            } else if (posInPeriod < 20) {
                value = baseValue - 1000; // 反向脈衝
            } else {
                value = baseValue + (Math.random() - 0.5) * 300;
            }
            break;

        case 'mixed':
            // 混合模式 (正弦 + 噪聲)
            const sine = 800 * Math.sin(simulationTime / 100);
            const noise = (Math.random() - 0.5) * 400;
            value = baseValue + sine + noise;
            break;

        default:
            value = baseValue;
    }

    // 限制在 ADC 範圍內 (0-4095)
    return Math.max(0, Math.min(4095, Math.round(value)));
}

// Convert ADC value to field strength
function adcToFieldStrength(adcValue) {
    const voltage = (adcValue / CALIBRATION.adcResolution) * CALIBRATION.vrefVoltage;
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
    return Math.sqrt(Math.max(0, variance));
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

    const now = new Date();
    const labels = dataPoints.map((_, index) => {
        const time = new Date(now.getTime() - (dataPoints.length - 1 - index) * 1000);
        return time.toLocaleTimeString('zh-TW').substring(0, 8);
    });

    chart.data.labels = labels;
    chart.data.datasets[0].data = dataPoints;
    chart.update('none');
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
    link.setAttribute('download', `electrostatic_data_simulation_${now.toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Simulation loop
function runSimulation() {
    if (!simulationRunning) return;

    const adcValue = generateSimulatedADC();
    updateDisplay(adcValue);
    simulationTime++;

    setTimeout(runSimulation, 1000); // 每秒一次
}

// Event Listeners
clearBtn.addEventListener('click', () => {
    if (confirm('確定要清除所有數據嗎？')) {
        clearData();
    }
});

exportBtn.addEventListener('click', exportData);

simulationToggle.addEventListener('click', () => {
    simulationRunning = !simulationRunning;
    if (simulationRunning) {
        simulationToggle.textContent = '停止模擬';
        connectionStatus.className = 'indicator online';
        connectionStatus.textContent = '模擬中';
        runSimulation();
    } else {
        simulationToggle.textContent = '開始模擬';
        connectionStatus.className = 'indicator offline';
        connectionStatus.textContent = '已暫停';
    }
});

simulationModeSelect.addEventListener('change', (e) => {
    simulationMode = e.target.value;
    console.log('切換到模擬模式:', simulationMode);
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    console.log('模擬測試模式已初始化');
    console.log('支援的模式: sine (正弦波), noise (隨機), spike (脈衝), mixed (混合)');
    runSimulation();
});
