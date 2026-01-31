(async function() {
    const loading = document.getElementById('loading');
    const ctx = document.getElementById('vulnerabilityChart');
    const services = ['account', 'payment', 'user'];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    function formatDate(year, month, day) {
        const m = String(month).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
    }

    function getLastDayOfMonth(year, month) {
        return new Date(year, month, 0).getDate();
    }

    async function fetchMonthData(service, year, month) {
        const lastDay = getLastDayOfMonth(year, month);
        const dateStr = formatDate(year, month, lastDay);
        const url = `raw-data/${service}/${dateStr}.json`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            return await response.json();
        } catch (e) {
            return null;
        }
    }

    async function aggregateData() {
        const aggregated = {};
        const months = [];
        
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        
        months.push({ year: lastMonthYear, month: lastMonth, label: `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}` });
        months.push({ year: currentYear, month: currentMonth, label: `${currentYear}-${String(currentMonth).padStart(2, '0')}` });
        
        for (const service of services) {
            if (!aggregated[service]) {
                aggregated[service] = {};
            }
            
            for (const { year, month, label } of months) {
                const data = await fetchMonthData(service, year, month);
                if (data) {
                    aggregated[service][label] = data;
                }
            }
        }
        
        return { aggregated, months };
    }

    function prepareChartData(aggregated, months) {
        const labels = [];
        const datasets = {
            cyber: {
                high: [],
                medium: [],
                low: []
            },
            sonar: {
                high: [],
                medium: [],
                low: []
            }
        };
        
        const monthLabels = months.map(m => m.label);
        
        for (const service of services) {
            for (const monthLabel of monthLabels) {
                const serviceData = aggregated[service];
                const monthData = serviceData[monthLabel];
                
                labels.push(`${service}-${monthLabel}`);
                
                if (monthData) {
                    datasets.cyber.high.push(monthData.cyber?.high || 0);
                    datasets.cyber.medium.push(monthData.cyber?.medium || 0);
                    datasets.cyber.low.push(monthData.cyber?.low || 0);
                    datasets.sonar.high.push(monthData.sonar?.high || 0);
                    datasets.sonar.medium.push(monthData.sonar?.medium || 0);
                    datasets.sonar.low.push(monthData.sonar?.low || 0);
                } else {
                    datasets.cyber.high.push(0);
                    datasets.cyber.medium.push(0);
                    datasets.cyber.low.push(0);
                    datasets.sonar.high.push(0);
                    datasets.sonar.medium.push(0);
                    datasets.sonar.low.push(0);
                }
            }
        }
        
        return { labels, datasets };
    }

    function createChart(labels, datasets) {
        const chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Cyber High',
                    data: datasets.cyber.high,
                    backgroundColor: 'rgba(220, 38, 38, 0.8)',
                    stack: 'cyber'
                },
                {
                    label: 'Cyber Medium',
                    data: datasets.cyber.medium,
                    backgroundColor: 'rgba(249, 115, 22, 0.8)',
                    stack: 'cyber'
                },
                {
                    label: 'Cyber Low',
                    data: datasets.cyber.low,
                    backgroundColor: 'rgba(234, 179, 8, 0.8)',
                    stack: 'cyber'
                },
                {
                    label: 'Sonar High',
                    data: datasets.sonar.high,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    stack: 'sonar'
                },
                {
                    label: 'Sonar Medium',
                    data: datasets.sonar.medium,
                    backgroundColor: 'rgba(251, 191, 36, 0.8)',
                    stack: 'sonar'
                },
                {
                    label: 'Sonar Low',
                    data: datasets.sonar.low,
                    backgroundColor: 'rgba(250, 204, 21, 0.8)',
                    stack: 'sonar'
                }
            ]
        };

        new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '各服务漏洞数量统计（按月分组）',
                        font: { size: 16 }
                    },
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.raw || 0;
                                return `${label}: ${value}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: '服务 - 月份'
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '漏洞数量'
                        }
                    }
                }
            }
        });
    }

    try {
        const { aggregated, months } = await aggregateData();
        const { labels, datasets } = prepareChartData(aggregated, months);
        loading.style.display = 'none';
        createChart(labels, datasets);
    } catch (error) {
        loading.textContent = '加载数据失败: ' + error.message;
    }
})();