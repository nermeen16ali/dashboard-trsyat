document.addEventListener('DOMContentLoaded', function () {
    // Common Chart Options
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
            }
        }
    };

    // 1. Performance Overview Chart (Line Chart) - Keep existing logic
    const ctxPerformance = document.getElementById('performanceChart').getContext('2d');
    new Chart(ctxPerformance, {
        type: 'line',
        data: {
            labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
            datasets: [
                {
                    label: 'المناقصات المرفوعة',
                    data: [35, 38, 30, 45, 48, 42],
                    borderColor: '#0891B2',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.4,
                    pointBackgroundColor: '#0891B2',
                    pointRadius: 3.5
                },
                {
                    label: 'التسعيرات',
                    data: [75, 80, 65, 75, 75, 65],
                    borderColor: '#F59E0B', // Purple
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.4,
                    pointBackgroundColor: '#F59E0B',
                    pointRadius: 3.5
                },
                {
                    label: 'العروض',
                    data: [12, 14, 10, 12, 14, 12],
                    borderColor: '#8B5CF6', // Blue
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.4,
                    pointBackgroundColor: '#8B5CF6',
                    pointRadius: 3.5
                },
                {
                    label: 'الاستشارات',
                    data: [25, 26, 22, 24, 26, 25],
                    borderColor: '#10B981', // Green
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.4,
                    pointBackgroundColor: '#10B981',
                    pointRadius: 3.5
                }
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                y: {
                    position: 'right',
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        borderDash: [5, 5],
                        drawBorder: false
                    },
                    ticks: {
                        stepSize: 25
                    }
                },
                x: {
                    reverse: true,
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    align: 'center',
                    rtl: true,
                    labels: {
                        usePointStyle: true,
                        boxWidth: 20,
                        padding: 20,
                        font: {
                            family: 'Expo Arabic',
                            size: 10
                        },
                        generateLabels: (chart) =>
                            chart.data.datasets.map((dataset, i) => ({
                                text: dataset.label,
                                fillStyle: dataset.borderColor,
                                strokeStyle: dataset.borderColor,
                                hidden: !chart.isDatasetVisible(i),
                                index: i,
                                pointStyle: 'line',
                                padding: 16   // 👈 SPACE between bullet and text
                            }))
                    }
                }

            }
        }
    });

    // --- Dynamic Chart Rendering Logic ---

    // Animation Config (Standard)
    const animationConfig = {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
            enabled: true,
            delay: 150
        },
        dynamicAnimation: {
            enabled: true,
            speed: 350
        }
    };

    // Chart Configuration Objects 
    // We define them as functions or objects to be reused

    function getRateOptions() {
        return {
            series: [45, 25, 30],
            labels: ['فائزة', 'خاسرة', 'قيد المراجعة'],
            chart: {
                type: 'pie',
                height: 250,
                fontFamily: 'Inter, Tajawal, sans-serif',
                animations: animationConfig,
                toolbar: { show: false }
            },
            colors: ['#6AB8C2', '#F55960', '#F7A62C'],
            dataLabels: {
                enabled: true,
                style: {
                    fontSize: '12px',
                    fontFamily: 'Inter, Tajawal, sans-serif',
                    fontWeight: 600,
                },
                dropShadow: { enabled: false },
            },
            plotOptions: {
                pie: {
                    dataLabels: {
                        offset: -5,
                    }
                }
            },
            legend: {
                show: true,
                position: 'bottom',
                horizontalAlign: 'center',
                fontSize: '14px',
                fontFamily: 'Inter, Tajawal, sans-serif',
                markers: {
                    width: 10,
                    height: 10,
                    radius: 12,
                },
                itemMargin: {
                    horizontal: 10,
                    vertical: 5
                }
            },
            stroke: { show: true, width: 2, colors: ['#fff'] }
        };
    }

    function getTypesOptions() {
        return {
            series: [35, 25, 20, 20],
            labels: ['عروض فنية', 'عروض مالية', 'تسعير', 'استشارات'],
            chart: {
                type: 'donut',
                height: 250,
                fontFamily: 'Inter, Tajawal, sans-serif',
                animations: animationConfig,
                toolbar: { show: false }
            },
            colors: ['#0c2030', '#6bafb8', '#397D86', '#28736E'],
            dataLabels: {
                enabled: true,
                style: {
                    fontSize: '12px',
                    fontFamily: 'Inter, Tajawal, sans-serif',
                    fontWeight: 500,
                },
                dropShadow: { enabled: false }
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '70%',
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: 'الإجمالي',
                                fontSize: '14px',
                                fontFamily: 'Inter, Tajawal, sans-serif',
                                color: '#6F6F6F'
                            }
                        }
                    }
                }
            },
            legend: {
                show: true,
                position: 'bottom',
                horizontalAlign: 'center',
                fontSize: '14px',
                fontFamily: 'Inter, Tajawal, sans-serif',
                markers: {
                    width: 10,
                    height: 10,
                    radius: 12,
                },
                itemMargin: {
                    horizontal: 10,
                    vertical: 5
                }
            },
            stroke: { show: true, width: 2, colors: ['#fff'] }
        };
    }

    // Chart Instances
    let rateChart = null;
    let typesChart = null;

    // Intersection Observer to Render/Destroy
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.6 // 60% visibility
    };

    const chartObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const isVisible = entry.isIntersecting;
            const id = entry.target.id;

            // Small delay to prevent jitter and ensure user sees start of animation
            // Only apply delay on ENTER, exit should be instant cleanup

            if (isVisible) {
                if (id === 'rateChart' && !rateChart) {
                    rateChart = new ApexCharts(document.querySelector("#rateChart"), getRateOptions());
                    rateChart.render();
                } else if (id === 'typesChart' && !typesChart) {
                    typesChart = new ApexCharts(document.querySelector("#typesChart"), getTypesOptions());
                    typesChart.render();
                }
            } else {
                // Destroy chart to reset animation when scrolling away
                if (id === 'rateChart' && rateChart) {
                    rateChart.destroy();
                    rateChart = null;
                } else if (id === 'typesChart' && typesChart) {
                    typesChart.destroy();
                    typesChart = null;
                }
            }
        });
    }, observerOptions);

    // Start Observing
    const rateContainer = document.querySelector("#rateChart");
    const typesContainer = document.querySelector("#typesChart");
    if (rateContainer) chartObserver.observe(rateContainer);
    if (typesContainer) chartObserver.observe(typesContainer);

    // --- Progress Bar Animation Logic ---
    const progressObserverOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };

    const progressObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const value = bar.getAttribute('aria-valuenow');
                bar.style.width = value + '%';
            } else {
                // Reset width to 0 when scrolled away to replay animation
                entry.target.style.width = '0%';
            }
        });
    }, progressObserverOptions);

    document.querySelectorAll('.progress-bar').forEach(bar => {
        progressObserver.observe(bar);
    });

});
