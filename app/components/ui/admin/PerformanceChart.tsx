'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Import dynamique pour éviter les problèmes de SSR
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface InvestmentData {
  date: string
  amount: number
}

interface ChartState {
  options: any
  series: any[]
}

export default function PerformanceChart() {
  const [chartState, setChartState] = useState<ChartState | null>(null)
  const [timeRange, setTimeRange] = useState<string>('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvestmentData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/investment-chart?range=${timeRange}`)
        if (!response.ok) {
          throw new Error('Failed to fetch investment data')
        }
        const data: InvestmentData[] = await response.json()
        
        // Préparer les données pour le graphique
        const categories = data.map(item => item.date)
        const seriesData = data.map(item => item.amount)

        const options = {
          chart: {
            type: 'area' as const,
            height: 350,
            zoom: {
              enabled: false
            },
            foreColor: '#9CA3AF',
            toolbar: {
              show: false
            },
            dropShadow: {
              enabled: true,
              color: '#0891B2',
              top: 2,
              left: 2,
              blur: 8,
              opacity: 0.2
            },
            animations: {
              enabled: true,
              easing: 'easeinout' as const,
              speed: 800,
              animateGradually: {
                enabled: true,
                delay: 150
              },
              dynamicAnimation: {
                enabled: true,
                speed: 350
              }
            }
          },
          colors: ['#0891B2'],
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.7,
              opacityTo: 0.1,
              stops: [0, 90, 100]
            }
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            curve: 'smooth' as const,
            width: 3
          },
          grid: {
            borderColor: '#374151',
            strokeDashArray: 4,
            padding: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
            }
          },
          xaxis: {
            categories: categories,
            axisBorder: {
              color: '#374151'
            },
            axisTicks: {
              color: '#374151'
            },
            labels: {
              style: {
                colors: '#9CA3AF'
              },
              rotate: -45,
              hideOverlappingLabels: true,
              trim: true
            },
            tooltip: {
              enabled: false
            }
          },
          yaxis: {
            labels: {
              formatter: (value: number) => `$${value.toLocaleString()}`,
              style: {
                colors: '#9CA3AF'
              }
            }
          },
          tooltip: {
            theme: 'dark' as const,
            x: {
              formatter: (value: string) => value
            },
            y: {
              formatter: (value: number) => `$${value.toLocaleString()}`
            }
          },
          legend: {
            show: false
          }
        }

        const series = [{
          name: 'Investissements',
          data: seriesData
        }]

        setChartState({ options, series })

      } catch (error) {
        console.error('Error fetching investment chart data:', error)
        // Données de démo en cas d'erreur
        setChartState(getDemoData())
      } finally {
        setLoading(false)
      }
    }

    fetchInvestmentData()
  }, [timeRange])

  const getDemoData = (): ChartState => {
    // Données de démo pour le développement
    const categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const data = categories.map(() => Math.floor(Math.random() * 100000) + 50000)

    const options = {
      chart: {
        type: 'area' as const,
        height: 350,
        zoom: {
          enabled: false
        },
        foreColor: '#9CA3AF',
        toolbar: {
          show: false
        }
      },
      colors: ['#0891B2'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.1,
          stops: [0, 90, 100]
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth' as const,
        width: 3
      },
      grid: {
        borderColor: '#374151',
        strokeDashArray: 4
      },
      xaxis: {
        categories: categories,
        axisBorder: {
          color: '#374151'
        },
        axisTicks: {
          color: '#374151'
        },
        labels: {
          style: {
            colors: '#9CA3AF'
          }
        }
      },
      yaxis: {
        labels: {
          formatter: (value: number) => `$${value.toLocaleString()}`,
          style: {
            colors: '#9CA3AF'
          }
        }
      },
      tooltip: {
        theme: 'dark' as const
      },
      legend: {
        show: false
      }
    }

    const series = [{
      name: 'Investissements',
      data: data
    }]

    return { options, series }
  }

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range)
  }

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Performance des investissements</h3>
        <select 
          className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-sm text-white"
          value={timeRange}
          onChange={(e) => handleTimeRangeChange(e.target.value)}
        >
          <option value="week">7 derniers jours</option>
          <option value="month">30 derniers jours</option>
          <option value="quarter">3 derniers mois</option>
          <option value="year">12 derniers mois</option>
        </select>
      </div>
      
      {chartState && (
        <Chart
          options={chartState.options}
          series={chartState.series}
          type="area"
          height={350}
        />
      )}
    </div>
  )
}