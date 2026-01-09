import { useEffect, useState } from 'react'
import { fetchPartnerStats, fetchPartnerProfile } from '../api/client'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

// Modern color palette for partner panel
const modernColors = [
  { primary: '#10b981', secondary: '#34d399' }, // Emerald
  { primary: '#3b82f6', secondary: '#60a5fa' }, // Blue
  { primary: '#8b5cf6', secondary: '#a78bfa' }, // Violet
  { primary: '#f59e0b', secondary: '#fbbf24' }, // Amber
  { primary: '#ef4444', secondary: '#f87171' }, // Red
  { primary: '#06b6d4', secondary: '#22d3ee' }  // Cyan
]

type Partner = {
  id: number | string
  name: string
  email: string
  phone?: string
  createdAt?: string
  logoUrl?: string
}

export default function Dashboard({ onError }: { onError?: (msg: string) => void }) {
  const [stats, setStats] = useState({
    customers: 0,
    products: 0,
    sales: 0,
    revenue: 0
  })
  const [detailedStats, setDetailedStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [partner, setPartner] = useState<Partner | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)

      // Load partner profile and stats in parallel
      const [profileResult, statsResult] = await Promise.allSettled([
        fetchPartnerProfile().catch(err => {
          console.warn('Failed to load partner profile:', err.message)
          return null
        }),
        fetchPartnerStats().catch(err => {
          console.warn('Failed to load partner stats:', err.message)
          return {
            customers: 0,
            products: 0,
            sales: 0,
            revenue: 0
          }
        })
      ])

      const profileData = profileResult.status === 'fulfilled' ? profileResult.value : null
      const statsData = statsResult.status === 'fulfilled' ? statsResult.value : {
        customers: 0,
        products: 0,
        sales: 0,
        revenue: 0
      }

      if (profileData) {
        setPartner(profileData)
      }

      setStats({
        customers: statsData.customers || 0,
        products: statsData.products || 0,
        sales: statsData.sales || 0,
        revenue: statsData.revenue || 0
      })

      // Generate chart data
      const chartData = getChartData(statsData)
      setDetailedStats(chartData)

    } catch (error: any) {
      console.error('Critical error loading dashboard:', error)
      onError?.('Ошибка загрузки дашборда')
    } finally {
      setLoading(false)
    }
  }

  const generateChartData = (stats: any) => {
    const currentDate = new Date()
    const data = [{
      date: format(currentDate, 'dd.MM'),
      customers: stats.customers || 0,
      products: stats.products || 0,
      sales: stats.sales || 0,
      revenue: stats.revenue || 0
    }]

    const categoryData = [
      { name: 'Продукты', value: stats.products || 0, color: modernColors[0].primary },
      { name: 'Продажи', value: stats.sales || 0, color: modernColors[1].primary },
      { name: 'Клиенты', value: stats.customers || 0, color: modernColors[2].primary }
    ].filter(item => item.value > 0)

    return {
      timelineData: data,
      categoryData: categoryData.length > 0 ? categoryData : [
        { name: 'Нет данных', value: 1, color: '#cccccc' }
      ]
    }
  }

  const getChartData = (stats: any) => {
    return generateChartData(stats)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px',
        color: 'var(--gray-500)'
      }}>
        Загрузка дашборда...
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        marginBottom: '32px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: 'var(--gray-900)',
          marginBottom: '8px'
        }}>
          Добро пожаловать, {partner?.name || 'Партнер'}!
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'var(--gray-600)',
          margin: 0
        }}>
          Панель управления вашим магазином
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Customers */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              marginRight: '12px'
            }}>
              👥
            </div>
            <div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Клиенты</div>
              <div style={{
                fontSize: '28px',
                fontWeight: '800',
                lineHeight: 1,
                marginTop: '4px'
              }}>
                {stats.customers.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 10px 25px rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              marginRight: '12px'
            }}>
              📦
            </div>
            <div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Товары</div>
              <div style={{
                fontSize: '28px',
                fontWeight: '800',
                lineHeight: 1,
                marginTop: '4px'
              }}>
                {stats.products.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Sales */}
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 10px 25px rgba(139, 92, 246, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              marginRight: '12px'
            }}>
              💰
            </div>
            <div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Продажи</div>
              <div style={{
                fontSize: '28px',
                fontWeight: '800',
                lineHeight: 1,
                marginTop: '4px'
              }}>
                {stats.sales.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 10px 25px rgba(245, 158, 11, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              marginRight: '12px'
            }}>
              💵
            </div>
            <div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Выручка</div>
              <div style={{
                fontSize: '28px',
                fontWeight: '800',
                lineHeight: 1,
                marginTop: '4px'
              }}>
                {stats.revenue.toLocaleString()} ₽
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px'
      }}>
        {/* Pie Chart */}
        <div style={{
          background: 'var(--white)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--gray-900)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📊 Обзор бизнеса
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={detailedStats?.categoryData || []}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {detailedStats?.categoryData?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [value, 'Количество']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Placeholder for future chart */}
        <div style={{
          background: 'var(--white)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            textAlign: 'center',
            color: 'var(--gray-500)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              Аналитика продаж
            </div>
            <div style={{ fontSize: '14px' }}>
              Детальная статистика скоро будет доступна
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
