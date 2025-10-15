
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { getAppointmentsWeeklyStats, getLabResultsStats, getPsaTrends } from '@/lib/actions';
import { useEffect, useState } from 'react';

// Dynamically import Chart to avoid SSR issues with ApexCharts
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// --- Appointments Line Chart ---

const appointmentsLineChartOptions: ApexOptions = {
  chart: {
    type: 'line',
    toolbar: {
      show: false,
    },
    zoom: {
      enabled: false,
    },
    background: 'transparent',
    animations: {
      enabled: true,
      speed: 800,
    }
  },
  stroke: {
    curve: 'smooth',
    width: 3,
  },
  colors: ['#3A6DFF'],
  grid: {
    show: true,
    borderColor: 'rgba(160, 160, 160, 0.2)',
    strokeDashArray: 4,
    xaxis: {
      lines: {
        show: false
      }
    },
    padding: {
      left: 10,
      right: 10,
    }
  },
  xaxis: {
    categories: ['Vie', 'Sáb', 'Dom', 'Lun', 'Mar', 'Mié', 'Jue'],
    labels: {
      style: {
        colors: '#A0A0A0',
        fontSize: '12px',
      },
    },
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
  yaxis: {
    labels: {
      style: {
        colors: '#A0A0A0',
        fontSize: '12px',
      },
      formatter: (value) => `${Math.round(value)}`,
    },
  },
  markers: {
    size: 5,
    colors: ['#3A6DFF'],
    strokeColors: '#fff',
    strokeWidth: 2,
    hover: {
      size: 7,
    },
  },
  tooltip: {
    theme: 'dark',
    custom: function({ series, seriesIndex, dataPointIndex, w }) {
        return `<div class="p-2 bg-gray-800 border-none rounded-md shadow-lg">
            <span class="font-bold text-white">${series[seriesIndex][dataPointIndex]} citas</span>
        </div>`
    }
  },
  legend: {
    show: false,
  },
};

export function AppointmentsLineChart() {
  const [appointmentData, setAppointmentData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAppointmentsWeeklyStats();
        setAppointmentData(data);
      } catch (error) {
        console.error('Error fetching appointment stats:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const appointmentsLineChartSeries = [
    {
      name: 'Citas',
      data: appointmentData,
    },
  ];

  return (
    <Card className={cn("rounded-2xl shadow-sm transition-all duration-300 ease-in-out bg-card/50 hover:scale-[1.02]", "hover:shadow-[0_0_20px_rgba(46,49,146,0.4)]")}>
      <CardHeader>
        <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Evolución de Citas</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[250px] flex items-center justify-center">
            <div className="text-muted-foreground">Cargando datos...</div>
          </div>
        ) : (
          <Chart
            options={appointmentsLineChartOptions}
            series={appointmentsLineChartSeries}
            type="line"
            height={250}
            width="100%"
          />
        )}
      </CardContent>
    </Card>
  );
}

// --- Lab Results Radial Chart ---

const labResultsRadialChartOptions: ApexOptions = {
    chart: {
        type: 'radialBar',
        height: 350,
        toolbar: { show: false },
        background: 'transparent',
    },
    plotOptions: {
        radialBar: {
            hollow: {
                size: '65%',
            },
            dataLabels: {
                name: {
                    show: false,
                },
                value: {
                    show: false,
                },
                total: {
                    show: true,
                    label: 'Total',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#A0A0A0',
                    formatter: function (w) {
                        const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                        return total.toString();
                    }
                }
            },
            track: {
                background: 'hsl(var(--muted))',
                strokeWidth: '97%',
                margin: 5, 
            },
        },
    },
    colors: ['#28A745', '#DC3545'],
    labels: ['Completados', 'Pendientes'],
    legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '14px',
        markers: {
            size: 12,
        },
        itemMargin: {
            horizontal: 10,
        },
        labels: {
            colors: '#A0A0A0'
        }
    },
    stroke: {
      lineCap: "round"
    },
    tooltip: {
        enabled: true,
        theme: 'dark',
        y: {
            formatter: function (val, { seriesIndex, w }) {
                if (w && w.config && w.config.labels) {
                    return `${val} - ${w.config.labels[seriesIndex]}`;
                }
                return val.toString();
            }
        }
    },
};

export function LabResultsBarChart() {
    const [labStats, setLabStats] = useState({ completed: 0, pending: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getLabResultsStats();
                setLabStats(data);
            } catch (error) {
                console.error('Error fetching lab results stats:', error);
                // Keep default values on error
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const labResultsRadialChartSeries = [labStats.completed, labStats.pending];

    return (
        <Card className={cn("rounded-2xl shadow-sm transition-all duration-300 ease-in-out bg-card/50 hover:scale-[1.02]", "hover:shadow-[0_0_20px_rgba(46,49,146,0.4)]")}>
            <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Resultados de Laboratorio</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-[250px] flex items-center justify-center">
                        <div className="text-muted-foreground">Cargando datos...</div>
                    </div>
                ) : (
                    <Chart
                        options={labResultsRadialChartOptions}
                        series={labResultsRadialChartSeries}
                        type="radialBar"
                        height={250}
                        width="100%"
                    />
                )}
            </CardContent>
        </Card>
    );
}

const psaChartOptions: ApexOptions = {
    chart: {
        type: 'area',
        height: 350,
        toolbar: { show: false },
        background: 'transparent',
    },
    stroke: {
        curve: 'smooth',
        width: 2,
    },
    colors: ['#FFC107'],
    fill: {
        type: 'gradient',
        gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.3,
            stops: [0, 90, 100]
        }
    },
    dataLabels: {
        enabled: false
    },
    grid: {
        borderColor: 'rgba(160, 160, 160, 0.1)',
        strokeDashArray: 3,
    },
    xaxis: {
        type: 'datetime',
        categories: [
            "2023-02-01", "2023-05-01", "2023-08-01", 
            "2023-11-01", "2024-02-01", "2024-05-01"
        ],
        labels: {
            style: {
                colors: '#A0A0A0',
                fontSize: '12px',
            },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
    },
    yaxis: {
        title: {
            text: 'PSA (ng/mL)',
            style: {
                color: '#A0A0A0',
                fontWeight: 500,
            }
        },
        labels: {
            style: {
                colors: '#A0A0A0',
                fontSize: '12px',
            },
        },
    },
    tooltip: {
        theme: 'dark',
        x: {
            format: 'dd MMM yyyy'
        }
    },
    markers: {
        size: 4,
        colors: ['#FFC107'],
        strokeColors: '#fff',
        strokeWidth: 2,
        hover: {
            size: 6,
        },
    }
};

export function PsaChart() {
    const [psaData, setPsaData] = useState<{ dates: string[]; values: number[] }>({ dates: [], values: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getPsaTrends();
                setPsaData(data);
            } catch (error) {
                console.error('Error fetching PSA trends:', error);
                // Keep default values on error
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const psaChartSeries = [{
        name: 'Nivel de PSA',
        data: psaData.values
    }];

    // Update chart options with real dates
    const dynamicPsaChartOptions = {
        ...psaChartOptions,
        xaxis: {
            ...psaChartOptions.xaxis,
            categories: psaData.dates,
        },
    };

    return (
        <Card className="rounded-2xl shadow-md hover:shadow-lg transition-all bg-card/50">
            <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Seguimiento de PSA</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-[300px] flex items-center justify-center">
                        <div className="text-muted-foreground">Cargando datos...</div>
                    </div>
                ) : psaData.values.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center">
                        <div className="text-muted-foreground">No hay datos de PSA disponibles</div>
                    </div>
                ) : (
                    <Chart
                        options={dynamicPsaChartOptions}
                        series={psaChartSeries}
                        type="area"
                        height={300}
                        width="100%"
                    />
                )}
            </CardContent>
        </Card>
    )
}
