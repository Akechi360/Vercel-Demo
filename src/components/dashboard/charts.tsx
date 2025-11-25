
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { getAppointmentsWeeklyStats, getLabResultsStats, getPsaTrends } from '@/lib/actions';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

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
    },
    fontFamily: 'inherit',
  },
  stroke: {
    curve: 'smooth',
    width: 3,
  },
  colors: ['#3A6DFF'], // Primary Blue
  grid: {
    show: true,
    borderColor: 'rgba(255, 255, 255, 0.05)', // Subtle dark mode grid
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
        colors: '#94a3b8', // muted-foreground
        fontSize: '12px',
        fontFamily: 'inherit',
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
        colors: '#94a3b8', // muted-foreground
        fontSize: '12px',
        fontFamily: 'inherit',
      },
      formatter: (value) => `${Math.round(value)}`,
    },
  },
  markers: {
    size: 5,
    colors: ['#3A6DFF'],
    strokeColors: '#1e293b', // card background
    strokeWidth: 2,
    hover: {
      size: 7,
    },
  },
  tooltip: {
    theme: 'dark',
    custom: function ({ series, seriesIndex, dataPointIndex, w }) {
      return `<div class="px-3 py-2 bg-popover border border-border rounded-lg shadow-xl">
            <span class="font-bold text-foreground">${series[seriesIndex][dataPointIndex]} citas</span>
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
      whileHover={{
        y: -2,
        transition: { duration: 0.2 }
      }}
      className="relative"
    >
      {/* Glow effect sutil */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 to-blue-500/10 opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      <Card className="relative rounded-2xl shadow-md transition-all duration-300 ease-in-out bg-card hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.01] group h-[450px] flex flex-col border-border/50">
        <CardHeader className="flex-shrink-0 pb-2">
          <CardTitle className="text-sm uppercase tracking-wider font-semibold text-muted-foreground group-hover:text-primary transition-colors duration-300">Evolución de Citas</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col pt-0">
          {loading ? (
            <div className="h-[350px] flex items-center justify-center">
              <div className="text-muted-foreground animate-pulse">Cargando datos...</div>
            </div>
          ) : (
            <Chart
              options={appointmentsLineChartOptions}
              series={appointmentsLineChartSeries}
              type="line"
              height={350}
              width="100%"
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- Lab Results Radial Chart ---

const labResultsRadialChartOptions: ApexOptions = {
  chart: {
    type: 'radialBar',
    height: 350,
    toolbar: { show: false },
    background: 'transparent',
    fontFamily: 'inherit',
  },
  plotOptions: {
    radialBar: {
      hollow: {
        size: '65%',
        background: 'transparent',
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
          fontSize: '18px',
          fontWeight: 600,
          color: '#94a3b8', // muted-foreground
          formatter: function (w) {
            const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
            return total.toString();
          }
        }
      },
      track: {
        background: 'rgba(255, 255, 255, 0.05)', // Subtle track
        strokeWidth: '100%',
        margin: 5,
      },
    },
  },
  colors: ['#22c55e', '#ef4444'], // Success Green, Destructive Red
  labels: ['Completados', 'Pendientes'],
  legend: {
    show: true,
    position: 'bottom',
    horizontalAlign: 'center',
    fontSize: '14px',
    fontFamily: 'inherit',
    markers: {
      size: 10,
    },
    itemMargin: {
      horizontal: 10,
      vertical: 5,
    },
    labels: {
      colors: '#94a3b8' // muted-foreground
    }
  },
  stroke: {
    lineCap: "round"
  },
  tooltip: {
    enabled: true,
    theme: 'dark',
    style: {
      fontSize: '12px',
      fontFamily: 'inherit',
    },
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
  const [labStats, setLabStats] = useState({ completed: 0, pending: 0, cancelled: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getLabResultsStats();
        console.log('[CHART] Lab Results Stats recibidos:', data);
        setLabStats({
          completed: data.completed,
          pending: data.pending,
          cancelled: data.cancelled || 0,
          total: data.total || (data.completed + data.pending + (data.cancelled || 0))
        });
      } catch (error) {
        console.error('[CHART] Error fetching lab results stats:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const labResultsRadialChartSeries = [labStats.completed, labStats.pending];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1], delay: 0.1 }}
      whileHover={{
        y: -2,
        transition: { duration: 0.2 }
      }}
      className="relative"
    >
      {/* Glow effect sutil */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-success/10 to-destructive/10 opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      <Card className="relative rounded-2xl shadow-md transition-all duration-300 ease-in-out bg-card hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.01] group h-[450px] flex flex-col border-border/50">
        <CardHeader className="flex-shrink-0 pb-2">
          <CardTitle className="text-sm uppercase tracking-wider font-semibold text-muted-foreground group-hover:text-primary transition-colors duration-300">Resultados de Laboratorio</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col pt-0">
          {loading ? (
            <div className="h-[350px] flex items-center justify-center">
              <div className="text-muted-foreground animate-pulse">Cargando datos...</div>
            </div>
          ) : (
            <Chart
              options={labResultsRadialChartOptions}
              series={labResultsRadialChartSeries}
              type="radialBar"
              height={350}
              width="100%"
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

const psaChartOptions: ApexOptions = {
  chart: {
    type: 'area',
    height: 350,
    toolbar: { show: false },
    background: 'transparent',
    fontFamily: 'inherit',
  },
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  colors: ['#f59e0b'], // Warning Amber
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.4,
      opacityTo: 0.05,
      stops: [0, 100]
    }
  },
  dataLabels: {
    enabled: false
  },
  grid: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
        colors: '#94a3b8',
        fontSize: '12px',
        fontFamily: 'inherit',
      },
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    title: {
      text: 'PSA (ng/mL)',
      style: {
        color: '#94a3b8',
        fontWeight: 500,
        fontFamily: 'inherit',
      }
    },
    labels: {
      style: {
        colors: '#94a3b8',
        fontSize: '12px',
        fontFamily: 'inherit',
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
    colors: ['#f59e0b'],
    strokeColors: '#1e293b',
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1], delay: 0.2 }}
      whileHover={{
        y: -2,
        transition: { duration: 0.2 }
      }}
      className="relative"
    >
      {/* Glow effect sutil */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-warning/10 to-orange-500/10 opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      <Card className="relative rounded-2xl shadow-md transition-all duration-300 ease-in-out bg-card hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.01] group h-[450px] flex flex-col border-border/50">
        <CardHeader className="flex-shrink-0 pb-2">
          <CardTitle className="text-sm uppercase tracking-wider font-semibold text-muted-foreground group-hover:text-primary transition-colors duration-300">Seguimiento de PSA</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col pt-0">
          {loading ? (
            <div className="h-[350px] flex items-center justify-center">
              <div className="text-muted-foreground animate-pulse">Cargando datos...</div>
            </div>
          ) : psaData.values.length === 0 ? (
            <div className="h-[350px] flex items-center justify-center">
              <div className="text-muted-foreground">No hay datos de PSA disponibles</div>
            </div>
          ) : (
            <Chart
              options={dynamicPsaChartOptions}
              series={psaChartSeries}
              type="area"
              height={350}
              width="100%"
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
