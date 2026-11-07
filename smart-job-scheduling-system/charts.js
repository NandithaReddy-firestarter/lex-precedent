/* ==========================================================================
   SMART JOB SCHEDULING SYSTEM - ANALYTICS UTILITY (charts.js)
   Renders and updates Chart.js instances inside the dashboard.
   ========================================================================== */

// Store Chart instances globally
let ratioChartInstance = null;
let profitChartInstance = null;
let utilizationChartInstance = null;

// Common Options for Chart Styles to match Dark Cyber theme
const chartCommonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: {
                color: '#94a3b8', // text-muted
                font: {
                    family: 'Plus Jakarta Sans',
                    size: 11
                }
            }
        },
        tooltip: {
            backgroundColor: '#0b0f19',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            titleColor: '#f8fafc',
            bodyColor: '#94a3b8',
            titleFont: { family: 'Outfit', weight: 'bold' },
            bodyFont: { family: 'Plus Jakarta Sans' }
        }
    },
    scales: {
        x: {
            grid: {
                color: 'rgba(255, 255, 255, 0.03)',
                borderColor: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
                color: '#94a3b8',
                font: { family: 'Plus Jakarta Sans', size: 10 }
            }
        },
        y: {
            grid: {
                color: 'rgba(255, 255, 255, 0.03)',
                borderColor: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
                color: '#94a3b8',
                font: { family: 'Plus Jakarta Sans', size: 10 }
            }
        }
    }
};

/**
 * Initialize all charts with empty/default states
 */
function initCharts() {
    // Graceful fallback if Chart.js CDN fails to load (e.g., offline or sandbox mode)
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js is not defined. Grids and forms will run in fallback mode without charts.");
        
        // Show fallback UI alerts in chart containers
        const containers = ['ratioChart', 'profitChart', 'utilizationChart'];
        containers.forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas && canvas.parentNode) {
                const notice = document.createElement('div');
                notice.style.position = 'absolute';
                notice.style.top = '50%';
                notice.style.left = '50%';
                notice.style.transform = 'translate(-50%, -50%)';
                notice.style.color = 'var(--text-dark)';
                notice.style.fontSize = '0.8rem';
                notice.style.textAlign = 'center';
                notice.style.width = '100%';
                notice.style.padding = '0 10px';
                notice.innerHTML = '<i class="fa-solid fa-chart-line" style="font-size: 1.5rem; margin-bottom: 8px; display: block; color: var(--text-dark);"></i>Analytics charts are offline<br><span style="font-size: 0.7rem; color: var(--text-dark); opacity: 0.6;">(Requires internet to load Chart.js CDN)</span>';
                
                // Set container relative position for centering
                canvas.parentNode.style.position = 'relative';
                canvas.parentNode.appendChild(notice);
                canvas.style.display = 'none';
            }
        });
        return;
    }

    // 1. Ratio Chart (Doughnut)
    const ratioCtx = document.getElementById('ratioChart').getContext('2d');
    ratioChartInstance = new Chart(ratioCtx, {
        type: 'doughnut',
        data: {
            labels: ['Scheduled', 'Rejected/Unscheduled'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#10b981', '#ef4444'],
                borderColor: '#070913',
                borderWidth: 2,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Plus Jakarta Sans', size: 11 }
                    }
                }
            },
            cutout: '70%'
        }
    });

    // 2. Profit Distribution Chart (Bar)
    const profitCtx = document.getElementById('profitChart').getContext('2d');
    profitChartInstance = new Chart(profitCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Profit Value',
                data: [],
                backgroundColor: [],
                borderRadius: 4,
                borderWidth: 0
            }]
        },
        options: {
            ...chartCommonOptions,
            scales: {
                x: {
                    ...chartCommonOptions.scales.x,
                    title: {
                        display: true,
                        text: 'Job IDs (Sorted by Profit)',
                        color: '#94a3b8',
                        font: { family: 'Plus Jakarta Sans', size: 10 }
                    }
                },
                y: {
                    ...chartCommonOptions.scales.y,
                    title: {
                        display: true,
                        text: 'Profit',
                        color: '#94a3b8',
                        font: { family: 'Plus Jakarta Sans', size: 10 }
                    },
                    beginAtZero: true
                }
            }
        }
    });

    // 3. Utilization Chart (Bar)
    const utilCtx = document.getElementById('utilizationChart').getContext('2d');
    utilizationChartInstance = new Chart(utilCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Slot Allocation (1 = Filled, 0 = Empty)',
                data: [],
                backgroundColor: [],
                borderRadius: 4,
                borderWidth: 0
            }]
        },
        options: {
            ...chartCommonOptions,
            plugins: {
                ...chartCommonOptions.plugins,
                legend: {
                    display: false // No need for legend on single bar
                }
            },
            scales: {
                x: {
                    ...chartCommonOptions.scales.x,
                    title: {
                        display: true,
                        text: 'Time Slots',
                        color: '#94a3b8',
                        font: { family: 'Plus Jakarta Sans', size: 10 }
                    }
                },
                y: {
                    ...chartCommonOptions.scales.y,
                    min: 0,
                    max: 1.2,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            if (value === 1) return 'Filled';
                            if (value === 0) return 'Free';
                            return '';
                        },
                        color: '#94a3b8'
                    }
                }
            }
        }
    });
}

/**
 * Updates the visual charts to reflect the current scheduling outcome.
 * 
 * @param {Array} allJobs - All jobs entered in the system.
 * @param {Array} scheduledIds - Set or array of Job IDs that got scheduled.
 * @param {Array} timelineSlots - The slots array representing assigned job IDs at each index.
 */
function updateCharts(allJobs, scheduledIds, timelineSlots) {
    if (!ratioChartInstance || !profitChartInstance || !utilizationChartInstance) {
        return;
    }

    const scheduledCount = scheduledIds.length;
    const rejectedCount = allJobs.length - scheduledCount;

    // --- 1. Update Doughnut Chart (Ratio) ---
    ratioChartInstance.data.datasets[0].data = [scheduledCount, rejectedCount];
    ratioChartInstance.update();

    // --- 2. Update Profit Chart (Bar) ---
    // Sort all jobs by profit descending to show a clean ranking
    const sortedJobsForChart = [...allJobs].sort((a, b) => b.profit - a.profit);
    
    const profitLabels = sortedJobsForChart.map(job => job.id);
    const profitValues = sortedJobsForChart.map(job => job.profit);
    const profitColors = sortedJobsForChart.map(job => {
        // Green if scheduled, Red if rejected/unscheduled
        return scheduledIds.includes(job.id) ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)';
    });

    profitChartInstance.data.labels = profitLabels;
    profitChartInstance.data.datasets[0].data = profitValues;
    profitChartInstance.data.datasets[0].backgroundColor = profitColors;
    profitChartInstance.update();

    // --- 3. Update Utilization Chart (Bar) ---
    // Slots are 1-indexed in our timeline array
    const utilLabels = [];
    const utilValues = [];
    const utilColors = [];

    // Note: timelineSlots[0] is typically empty or unused if 1-indexed. Let's slice from 1.
    const maxSlots = timelineSlots.length - 1;
    
    if (maxSlots <= 0) {
        // Draw empty indicator
        utilizationChartInstance.data.labels = ['No Slots'];
        utilizationChartInstance.data.datasets[0].data = [0];
        utilizationChartInstance.data.datasets[0].backgroundColor = ['rgba(59, 130, 246, 0.2)'];
    } else {
        for (let i = 1; i <= maxSlots; i++) {
            utilLabels.push(`Slot ${i} (${i-1}-${i})`);
            const jobInSlot = timelineSlots[i];
            if (jobInSlot) {
                utilValues.push(1);
                utilColors.push('rgba(6, 182, 212, 0.85)'); // Cyan for filled
            } else {
                utilValues.push(0);
                utilColors.push('rgba(255, 255, 255, 0.05)'); // Grey/Transparent for free
            }
        }
        utilizationChartInstance.data.labels = utilLabels;
        utilizationChartInstance.data.datasets[0].data = utilValues;
        utilizationChartInstance.data.datasets[0].backgroundColor = utilColors;
    }
    utilizationChartInstance.update();
}

/**
 * Resets charts to an empty/initial state.
 */
function resetCharts() {
    if (ratioChartInstance) {
        ratioChartInstance.data.datasets[0].data = [0, 0];
        ratioChartInstance.update();
    }
    if (profitChartInstance) {
        profitChartInstance.data.labels = [];
        profitChartInstance.data.datasets[0].data = [];
        profitChartInstance.data.datasets[0].backgroundColor = [];
        profitChartInstance.update();
    }
    if (utilizationChartInstance) {
        utilizationChartInstance.data.labels = [];
        utilizationChartInstance.data.datasets[0].data = [];
        utilizationChartInstance.data.datasets[0].backgroundColor = [];
        utilizationChartInstance.update();
    }
}
