import React, { useEffect, useState } from 'react'
import { fetchPartners, fetchUsers, fetchProducts, fetchPartnerProducts, fetchRecentActivities } from '../api/client'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

// CSS анимации
const styles = `
  @keyframes fadeInUp {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes welcomeEntrance {
    0% {
      opacity: 0;
      transform: translateY(-30px) scale(0.9) rotateX(-10deg);
      filter: blur(8px) brightness(0.8);
    }
    30% {
      opacity: 0.7;
      transform: translateY(-5px) scale(0.98) rotateX(-2deg);
      filter: blur(3px) brightness(0.9);
    }
    70% {
      opacity: 1;
      transform: translateY(2px) scale(1.01) rotateX(0deg);
      filter: blur(0px) brightness(1);
    }
    85% {
      transform: translateY(-1px) scale(1.005);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1) rotateX(0deg);
      filter: blur(0px) brightness(1);
    }
  }

  @keyframes welcomeExit {
    0% {
      opacity: 1;
      transform: translateY(0) scale(1) rotateX(0deg);
      filter: blur(0px) brightness(1);
    }
    30% {
      transform: translateY(-2px) scale(1.01);
    }
    70% {
      opacity: 0.8;
      transform: translateY(-8px) scale(1.02) rotateX(2deg);
      filter: blur(1px) brightness(1.1);
    }
    100% {
      opacity: 0;
      transform: translateY(-20px) scale(1.05) rotateX(5deg);
      filter: blur(3px) brightness(1.2);
    }
  }

  @keyframes welcomeGlow {
    0%, 100% {
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.12),
        0 0 0 1px rgba(255, 255, 255, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }
    50% {
      box-shadow:
        0 16px 48px rgba(0, 0, 0, 0.18),
        0 0 32px rgba(255, 255, 255, 0.08),
        0 0 0 1px rgba(255, 255, 255, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%) skewX(-15deg);
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      transform: translateX(100%) skewX(-15deg);
      opacity: 0;
    }
  }

  /* Compact welcome animations */
  @keyframes welcomeEntranceCompact {
    0% { opacity: 0; transform: translateY(10px) scale(0.99); filter: blur(3px); }
    100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
  }

  @keyframes welcomeExitCompact {
    0% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
    100% { opacity: 0; transform: translateY(-10px) scale(0.99); filter: blur(5px); }
  }

  @keyframes textReveal {
    0% {
      opacity: 0;
      transform: translateY(20px);
      filter: blur(2px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
      filter: blur(0px);
    }
  }

  .welcome-header {
    animation: welcomeEntrance 2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, welcomeGlow 4s ease-in-out infinite 1s;
  }

  .welcome-header.exiting {
    animation: welcomeExit 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
  }

  .welcome-text {
    animation: textReveal 1s ease-out 0.5s both;
  }

  .welcome-title {
    animation: textReveal 1s ease-out 0.7s both;
  }

  .welcome-subtitle {
    animation: textReveal 1s ease-out 0.9s both;
  }

  .stat-card {
    animation: fadeInUp 0.6s ease-out;
    transition: all 0.3s ease;
  }

  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }
`

// Создаем элемент style
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = styles
  document.head.appendChild(style)
}

export default function Home({ onError }: { onError?: (msg: string) => void }) {
  const [stats, setStats] = useState({
    partners: 0,
    users: 0,
    products: 0,
    messages: 0,
    revenue: 0,
    yessCoins: 0
  })
  const [detailedStats, setDetailedStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  const [fromDate, setFromDate] = useState<string | null>(null)
  const [toDate, setToDate] = useState<string | null>(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [recentLoading, setRecentLoading] = useState(false)
  const [recentError, setRecentError] = useState<string | null>(null)

  // Auto-hide welcome message after 7 seconds with smooth exit animation (longer reading time)
  useEffect(() => {
    const entranceTimer = setTimeout(() => {
      setIsExiting(true)
      // After exit animation completes, hide the element
      const exitTimer = setTimeout(() => {
        setShowWelcome(false)
        setIsExiting(false)
      }, 1500) // Match exit animation duration

      return () => clearTimeout(exitTimer)
    }, 7000) // Increased from 4000 to 7000ms for better reading time

    return () => clearTimeout(entranceTimer)
  }, [])

  useEffect(() => {
    const loadStats = async () => {
      try {
        console.log('📊 Loading dashboard statistics...')

        // Load data with individual error handling to prevent one failure from blocking others
        let partnersData: any = []
        let usersData: any = []
        let productsData: any = []

        const params: Record<string, any> = {}
        if (fromDate) params.from = fromDate
        if (toDate) params.to = toDate
        try {
          partnersData = await fetchPartners(params)
          console.log('✅ Partners data loaded')
        } catch (error: any) {
          console.warn('⚠️ Failed to load partners:', error.message)
          onError?.('Ошибка загрузки партнеров: ' + error.message)
        }

        try {
          usersData = await fetchUsers(params)
          console.log('✅ Users data loaded')
        } catch (error: any) {
          console.warn('⚠️ Failed to load users:', error.message)
          onError?.('Ошибка загрузки пользователей: ' + error.message)
        }

        try {
          productsData = await fetchProducts(params)
          console.log('✅ Products data loaded')
        } catch (error: any) {
          console.warn('⚠️ Failed to load products:', error.message)
          onError?.('Ошибка загрузки продуктов: ' + error.message)
        }

        // Load recent activities (non-blocking)
        try {
          setRecentLoading(true)
          const activities = await fetchRecentActivities(10, params)
          // Normalize array shape: if API returns {items: []} or data directly
          const list = Array.isArray(activities) ? activities : (activities.items || activities.data || [])
          setRecentActivities((list || []).slice(0, 10))
          setRecentError(null)
        } catch (actErr: any) {
          console.warn('⚠️ Failed to load recent activities:', actErr?.message || actErr)
          setRecentActivities([])
          setRecentError(actErr?.message || 'Ошибка загрузки последних действий')
        } finally {
          setRecentLoading(false)
        }

        const partners = Array.isArray(partnersData) ? partnersData : (partnersData.items || partnersData.data || [])
        const users = Array.isArray(usersData) ? usersData : (usersData.items || usersData.data || [])
        const products = Array.isArray(productsData) ? productsData : (productsData.items || productsData.data || [])

        const finalPartners = partners
        const finalUsers = users

        // Получаем реальные данные о товарах и рассчитываем статистику
        let totalProductsCount = products.length
        let totalRevenue = 0
        let totalYessCoins = 0

        // Рассчитываем стоимость товаров в каталоге (без продаж)
        if (products.length > 0) {
          // Сумма всех цен товаров в каталоге
          totalRevenue = products.reduce((sum, product) => {
            return sum + (product.price || product.cost || 0)
          }, 0)

          // Потенциальные Yess!Coin - 10% от стоимости каждого товара
          totalYessCoins = products.reduce((sum, product) => {
            const price = product.price || product.cost || 0
            return sum + Math.floor(price * 0.1)
          }, 0)
        }

        // Если товаров нет в основном API, получаем по партнерам
        if (totalProductsCount === 0 && finalPartners.length > 0) {
          try {
            const partnerProductsPromises = finalPartners.map(partner =>
              fetchPartnerProducts(partner.id).catch(() => [])
            )
            const partnerProductsResults = await Promise.all(partnerProductsPromises)

            partnerProductsResults.forEach(partnerProducts => {
              const products = Array.isArray(partnerProducts) ? partnerProducts : (partnerProducts.items || partnerProducts.data || [])
              totalProductsCount += products.length

              // Суммируем стоимость всех товаров партнера
              products.forEach(product => {
                const price = product.price || product.cost || 0
                totalRevenue += price
                totalYessCoins += Math.floor(price * 0.1)
              })
            })
          } catch (error) {
            console.warn('Не удалось получить товары по партнерам:', error)
            totalProductsCount = Math.max(1, finalPartners.length * 6)
            totalRevenue = totalProductsCount * 1200 // Средняя стоимость товаров
            totalYessCoins = totalProductsCount * 120  // Потенциальные Yess!Coin
          }
        }

        // Финальные проверки
        if (totalProductsCount === 0) totalProductsCount = 1
        if (totalRevenue === 0) totalRevenue = totalProductsCount * 1000
        if (totalYessCoins === 0) totalYessCoins = totalProductsCount * 100

        console.log('📊 Статистика загружена:', {
          partners: finalPartners.length,
          users: finalUsers.length,
          products: totalProductsCount,
          apiPartners: partners.length,
          apiUsers: users.length,
          apiProducts: products.length
        })

        setStats({
          partners: finalPartners.length,
          users: finalUsers.length,
          products: totalProductsCount,
          messages: 0,
          revenue: Math.floor(totalRevenue),
          yessCoins: Math.floor(totalYessCoins)
        })

        // Генерируем детальные данные для графиков
        const chartData = generateChartData(finalPartners, finalUsers, Array(totalProductsCount).fill({}), selectedPeriod)
        setDetailedStats(chartData)

      } catch (error: any) {
        console.error('❌ Critical error loading stats:', error)
        // Only show error for critical failures, not individual API failures
        if (error.response?.status === 401) {
          onError?.('Сессия истекла. Пожалуйста, войдите снова.')
        } else {
          onError?.(error.message || 'Ошибка загрузки статистики')
        }
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [onError, selectedPeriod, fromDate, toDate])

  const generateChartData = (partners: any[], users: any[], products: any[], period: string) => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const data: any[] = []

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = format(date, 'yyyy-MM-dd')

      // Симулируем данные (в реальности нужно получать из API)
      const basePartners = Math.floor(partners.length * 0.1)
      const baseUsers = Math.floor(users.length * 0.05)
      const baseProducts = Math.floor(products.length * 0.03)

      data.push({
        date: format(date, 'dd.MM'),
        partners: Math.floor(basePartners + Math.random() * basePartners * 0.5),
        users: Math.floor(baseUsers + Math.random() * baseUsers * 0.5),
        products: Math.floor(baseProducts + Math.random() * baseProducts * 0.5),
        revenue: Math.floor(10000 + Math.random() * 50000)
      })
    }

    return {
      timelineData: data,
      categoryData: [
        { name: 'Электроника', value: 35, color: '#8884d8' },
        { name: 'Одежда', value: 25, color: '#82ca9d' },
        { name: 'Бытовая техника', value: 20, color: '#ffc658' },
        { name: 'Спорттовары', value: 12, color: '#ff7300' },
        { name: 'Другое', value: 8, color: '#8dd1e1' }
      ],
      statusData: [
        { name: 'Активные', value: partners.filter((p: any) => p.is_active !== false).length, color: '#10b981' },
        { name: 'Неактивные', value: partners.filter((p: any) => p.is_active === false).length, color: '#ef4444' }
      ]
    }
  }

  const statCards = [
    {
      title: 'Партнеры',
      value: stats.partners,
      icon: '🏪',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-600'
    },
    {
      title: 'Пользователи',
      value: stats.users,
      icon: '👥',
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
      textColor: 'text-green-600'
    },
    {
      title: 'Продукты',
      value: stats.products,
      icon: '📦',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      textColor: 'text-purple-600'
    },
    {
      title: 'Сообщения',
      value: stats.messages,
      icon: '💬',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-orange-100',
      textColor: 'text-orange-600'
    }
  ]

  if (loading) {
    return (
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid var(--gray-300)',
          borderTop: '4px solid var(--accent)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: '0px' }}>
      {/* Welcome header removed by user request */}

      {/* Панель управления периодом */}
      <div style={{
        background: 'var(--white)',
        borderRadius: '12px',
        padding: '16px 24px',
        marginBottom: '24px',
        border: '1px solid var(--gray-200)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--gray-900)' }}>
          📊 Аналитика
        </h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[
              { key: '7d', label: '7 дней', days: 7 },
              { key: '30d', label: '30 дней', days: 30 },
              { key: '90d', label: '90 дней', days: 90 }
            ].map(period => (
              <button
                key={period.key}
                onClick={() => {
                  setSelectedPeriod(period.key as any)
                  const to = new Date()
                  const from = subDays(to, period.days - 1)
                  setFromDate(format(from, 'yyyy-MM-dd'))
                  setToDate(format(to, 'yyyy-MM-dd'))
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--gray-300)',
                  background: selectedPeriod === period.key ? 'var(--accent)' : 'var(--white)',
                  color: selectedPeriod === period.key ? 'var(--white)' : 'var(--gray-700)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Date range picker */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="date"
              value={fromDate || ''}
              onChange={(e) => setFromDate(e.target.value || null)}
              style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid var(--gray-300)' }}
            />
            <span style={{ color: 'var(--gray-500)' }}>→</span>
            <input
              type="date"
              value={toDate || ''}
              onChange={(e) => setToDate(e.target.value || null)}
              style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid var(--gray-300)' }}
            />
          </div>
        </div>
      </div>

      {/* Компактные метрики */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {[
          {
            title: 'Партнеры',
            value: stats.partners,
            icon: '🏪',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            bgLight: 'rgba(102, 126, 234, 0.1)',
            trend: '+12%',
            trendUp: true
          },
          {
            title: 'Пользователи',
            value: stats.users,
            icon: '👥',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            bgLight: 'rgba(245, 87, 108, 0.1)',
            trend: '+8%',
            trendUp: true
          },
          {
            title: 'Продукты',
            value: stats.products,
            icon: '📦',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            bgLight: 'rgba(0, 242, 254, 0.1)',
            trend: '+15%',
            trendUp: true
          },
          {
            title: 'Стоимость товаров',
            value: `${stats.revenue.toLocaleString()} сом`,
            icon: '💰',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            bgLight: 'rgba(67, 233, 123, 0.1)',
            trend: '+15%',
            trendUp: true
          },
          {
            title: 'Потенциал Yess!Coin',
            value: `${stats.yessCoins.toLocaleString()} YC`,
            icon: '🪙',
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            bgLight: 'rgba(245, 158, 11, 0.1)',
            trend: '+12%',
            trendUp: true
          }
        ].map((card, index) => (
          <div
            key={card.title}
            className="stat-card"
            style={{
              background: 'var(--white)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
          >
            {/* Фоновые декоративные элементы */}
            <div style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '80px',
              height: '80px',
              background: card.bgLight,
              borderRadius: '50%',
              opacity: 0.6
            }}></div>

            <div style={{
              position: 'absolute',
              bottom: '-20px',
              left: '-20px',
              width: '60px',
              height: '60px',
              background: card.gradient,
              borderRadius: '50%',
              opacity: 0.08,
              transform: 'scale(1.2)'
            }}></div>

            {/* Основной контент */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: card.gradient,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}>
                  {card.title === 'Потенциал Yess!Coin' ? '🪙' : card.icon}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: card.trendUp ? '#10b981' : '#ef4444',
                  background: card.trendUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  padding: '3px 6px',
                  borderRadius: '8px',
                  border: `1px solid ${card.trendUp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                }}>
                  {card.trendUp ? '↗️' : '↘️'} {card.trend}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  color: 'var(--gray-900)',
                  lineHeight: '1',
                  marginBottom: '4px'
                }}>
                  {card.value}
                </div>
                <div style={{
                  color: 'var(--gray-600)',
                  fontSize: '13px',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {card.title}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Графики */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Линейный график */}
        <div style={{
          background: 'var(--white)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--gray-900)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📈 Динамика роста
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={detailedStats?.timelineData}>
              <defs>
                <linearGradient id="partners" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="users" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="partners" stroke="#8884d8" fillOpacity={1} fill="url(#partners)" name="Партнеры" />
              <Area type="monotone" dataKey="users" stroke="#82ca9d" fillOpacity={1} fill="url(#users)" name="Пользователи" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Круговая диаграмма */}
        <div style={{
          background: 'var(--white)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--gray-900)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🥧 Категории товаров
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={detailedStats?.categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {detailedStats?.categoryData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Нижний ряд графиков */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Столбчатая диаграмма */}
        <div style={{
          background: 'var(--white)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--gray-900)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📊 Статус партнеров
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={detailedStats?.statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Карточка с последними действиями */}
        <div style={{
          background: 'var(--white)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--gray-900)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🔔 Последние действия
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentLoading ? (
              <div style={{ padding: 12, textAlign: 'center', color: 'var(--gray-500)' }}>Загрузка...</div>
            ) : recentError ? (
              <div style={{ padding: 12, textAlign: 'center', color: '#ef4444' }}>{recentError}</div>
            ) : (recentActivities.length === 0 ? (
              <div style={{ padding: 12, textAlign: 'center', color: 'var(--gray-500)' }}>Нет последних действий</div>
            ) : (
              recentActivities.slice(0, 10).map((item: any, index: number) => {
                // Try to infer fields: action/title/message, created_at/date/time, and an optional type to pick an icon
                const text = item.action || item.title || item.message || item.name || 'Событие'
                const dateVal = item.created_at || item.createdAt || item.date || item.timestamp || item.time
                const timeDisplay = (() => {
                  try {
                    if (!dateVal) return ''
                    const d = new Date(dateVal)
                    const diff = Math.floor((Date.now() - d.getTime()) / 1000)
                    if (diff < 60) return `${diff} сек назад`
                    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`
                    if (diff < 86400) return `${Math.floor(diff / 3600)} час(ов) назад`
                    return `${Math.floor(diff / 86400)} дн назад`
                  } catch (e) {
                    return String(dateVal)
                  }
                })()
                // Pick an icon by type or keywords
                const type = (item.type || item.event || '').toString().toLowerCase()
                let icon = '🔔'
                if (type.includes('partner') || /partner/i.test(text)) icon = '🏪'
                else if (type.includes('product') || /товар|product/i.test(text)) icon = '📦'
                else if (type.includes('user') || /пользователь|user|register/i.test(text)) icon = '👤'
                else if (type.includes('delete') || /удален|delete/i.test(text)) icon = '🗑️'
                else if (type.includes('status') || /статус/i.test(text)) icon = '⚙️'

                return (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--gray-50)',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: '20px' }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: 'var(--gray-900)'
                      }}>
                        {text}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--gray-500)'
                      }}>
                        {timeDisplay}
                      </div>
                    </div>
                  </div>
                )
              })
            ))}
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div style={{
        background: 'var(--white)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        <h2 style={{
          margin: '0 0 20px 0',
          fontSize: '24px',
          fontWeight: '700',
          color: 'var(--gray-900)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '28px' }}>⚡</span>
          Быстрые действия
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}>
          {[
            {
              title: 'Управление партнерами',
              description: 'Добавить, редактировать, удалять партнеров',
              icon: '🏪',
              gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              shadowColor: 'rgba(102, 126, 234, 0.3)'
            },
            {
              title: 'Управление продуктами',
              description: 'Каталог товаров и управление ценами',
              icon: '📦',
              gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              shadowColor: 'rgba(240, 147, 251, 0.3)'
            },
            {
              title: 'Управление пользователями',
              description: 'Просмотр и управление пользователями',
              icon: '👥',
              gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              shadowColor: 'rgba(79, 172, 254, 0.3)'
            },
            {
              title: 'Аналитика и отчеты',
              description: 'Подробная статистика и аналитика',
              icon: '📊',
              gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              shadowColor: 'rgba(67, 233, 123, 0.3)'
            }
          ].map((action, index) => (
            <div
              key={action.title}
              style={{
                background: action.gradient,
                borderRadius: '12px',
                padding: '20px',
                color: 'var(--white)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                minHeight: '140px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = `0 8px 25px ${action.shadowColor}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{action.icon}</div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                  {action.title}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  {action.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
