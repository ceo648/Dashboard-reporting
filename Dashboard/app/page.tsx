'use client'

import { useState, useEffect } from 'react'
import { Card, Metric, Text, Badge, Accordion, AccordionHeader, AccordionBody } from '@tremor/react'
import { Users, AlertTriangle, TrendingUp, TrendingDown, Calendar, CheckCircle2, ChevronDown, RefreshCw, Camera, ShoppingBag } from 'lucide-react'
import { AreaChart } from '@tremor/react'

// Types
interface ClientData {
  client_name: string
  ghl_subaccount_id: string
  meta_ad_account_id: string
  calendar_diagnosis_id: string
  calendar_demo_id: string
  calendar_presuccess_id: string
}

interface LiveStats {
  leads_3d: number
  appointments_3d: number
  leads_7d: number
  appointments_7d: number
  booking_rate_7d: number | null
  show_ups_7d: number
  total_appointments_7d: number
  cpl_7d: number
  spend_7d: number
  alert_count: number
  alerts: string[]
  trend_data: TrendDataPoint[]
}

interface TrendDataPoint {
  date: string
  leads: number
  appointments: number
  show_ups: number
}

interface ClientWithStats extends ClientData {
  stats?: LiveStats
  loading?: boolean
}

interface PortfolioMetrics {
  totalClients: number
  clientsWithAlerts: number
  avgCpl: number
  avgBookingRate: number
  avgShowUpRate: number
}

// Webhook URLs
const GET_CLIENTS_LIST_URL = 'https://sunpoweragency.app.n8n.cloud/webhook/get-clients-list'
const GET_LIVE_STATS_URL = '[INSERISCI URL WORKFLOW GET-LIVE-STATS]'

export default function DashboardPage() {
  const [clients, setClients] = useState<ClientWithStats[]>([])
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics>({
    totalClients: 0,
    clientsWithAlerts: 0,
    avgCpl: 0,
    avgBookingRate: 0,
    avgShowUpRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('Monitoring')
  const [selectedClientForInsights, setSelectedClientForInsights] = useState<string>('')

  // Fetch clients list
  useEffect(() => {
    fetchClientsList()
  }, [])

  const fetchClientsList = async () => {
    setLoading(true)
    try {
      console.log('Fetching clients from:', GET_CLIENTS_LIST_URL)
      const response = await fetch(GET_CLIENTS_LIST_URL, { cache: "no-store" })
      
      console.log('Response status:', response.status, response.ok)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("Raw response data:", data)
      console.log("Data type:", typeof data)
      console.log("Is array:", Array.isArray(data))
      console.log("Data length:", Array.isArray(data) ? data.length : 'not an array')
      
      // Assumendo che l'API restituisca un array di clienti
      // Se la struttura è diversa, adatta di conseguenza
      let clientsList: ClientData[] = []
      
      if (Array.isArray(data)) {
        clientsList = data
      } else if (data && typeof data === 'object') {
        // Prova diverse chiavi possibili
        clientsList = data.clients || data.data || data.items || []
        // Se è un oggetto singolo, prova a trattarlo come array
        if (clientsList.length === 0 && data.client_name) {
          clientsList = [data]
        }
      }
      
      console.log("Parsed clients list:", clientsList)
      console.log("Clients count:", clientsList.length)
      
      if (clientsList.length === 0) {
        console.warn('No clients found in response, using mock data')
        throw new Error('No clients in response')
      }
      
      const clientsWithLoading: ClientWithStats[] = clientsList.map(client => ({
        ...client,
        loading: true,
      }))

      setClients(clientsWithLoading)
      
      // Set first client as default for insights
      if (clientsWithLoading.length > 0) {
        setSelectedClientForInsights(clientsWithLoading[0].ghl_subaccount_id)
      }

      // Fetch live stats for each client
      clientsWithLoading.forEach(client => {
        fetchLiveStats(client.ghl_subaccount_id, client.client_name)
      })
    } catch (error) {
      console.error('Error fetching clients:', error)
      // Fallback a dati mock in caso di errore (per sviluppo)
      console.log('Using mock data as fallback')
      const mockClients: ClientData[] = [
        {
          client_name: 'Client A',
          ghl_subaccount_id: '12345',
          meta_ad_account_id: '67890',
          calendar_diagnosis_id: 'cal1',
          calendar_demo_id: 'cal2',
          calendar_presuccess_id: 'cal3',
        },
      ]
      const clientsWithLoading: ClientWithStats[] = mockClients.map(client => ({
        ...client,
        loading: true,
      }))
      setClients(clientsWithLoading)
      if (clientsWithLoading.length > 0) {
        setSelectedClientForInsights(clientsWithLoading[0].ghl_subaccount_id)
      }
      clientsWithLoading.forEach(client => {
        fetchLiveStats(client.ghl_subaccount_id, client.client_name)
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchLiveStats = async (ghlSubaccountId: string, clientName: string) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${GET_LIVE_STATS_URL}?ghl_subaccount_id=${ghlSubaccountId}`, { cache: "no-store" })
      // const data = await response.json()

      // Mock data
      const mockStats: LiveStats = {
        leads_3d: 0,
        appointments_3d: 0,
        leads_7d: 12,
        appointments_7d: 8,
        booking_rate_7d: null,
        show_ups_7d: 0,
        total_appointments_7d: 0,
        cpl_7d: 25.0,
        spend_7d: 300.0,
        alert_count: 0,
        alerts: [],
        trend_data: generateMockTrendData(),
      }

      setClients(prevClients =>
        prevClients.map(client =>
          client.ghl_subaccount_id === ghlSubaccountId
            ? { ...client, stats: mockStats, loading: false }
            : client
        )
      )

      // Recalculate portfolio metrics
      recalculatePortfolioMetrics()
    } catch (error) {
      console.error('Error fetching live stats:', error)
      setClients(prevClients =>
        prevClients.map(client =>
          client.ghl_subaccount_id === ghlSubaccountId
            ? { ...client, loading: false }
            : client
        )
      )
    }
  }

  const generateMockTrendData = (): TrendDataPoint[] => {
    const data: TrendDataPoint[] = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      data.push({
        date: date.toISOString().split('T')[0],
        leads: Math.floor(Math.random() * 5) + 1,
        appointments: Math.floor(Math.random() * 4),
        show_ups: Math.floor(Math.random() * 3),
      })
    }
    return data
  }

  const recalculatePortfolioMetrics = () => {
    const clientsWithStats = clients.filter(c => c.stats && !c.loading)
    
    if (clientsWithStats.length === 0) {
      setPortfolioMetrics({
        totalClients: clients.length,
        clientsWithAlerts: 0,
        avgCpl: 0,
        avgBookingRate: 0,
        avgShowUpRate: 0,
      })
      return
    }

    const totalClients = clients.length
    const clientsWithAlerts = clientsWithStats.filter(c => (c.stats?.alert_count || 0) > 0).length
    
    const totalCpl = clientsWithStats.reduce((sum, c) => sum + (c.stats?.cpl_7d || 0), 0)
    const avgCpl = totalCpl / clientsWithStats.length

    const bookingRates = clientsWithStats
      .map(c => c.stats?.booking_rate_7d)
      .filter((rate): rate is number => rate !== null && rate !== undefined)
    const avgBookingRate = bookingRates.length > 0
      ? bookingRates.reduce((sum, rate) => sum + rate, 0) / bookingRates.length
      : 0

    const showUpRates = clientsWithStats
      .map(c => {
        const showUps = c.stats?.show_ups_7d || 0
        const totalApps = c.stats?.total_appointments_7d || 0
        return totalApps > 0 ? (showUps / totalApps) * 100 : 0
      })
      .filter(rate => rate > 0)
    const avgShowUpRate = showUpRates.length > 0
      ? showUpRates.reduce((sum, rate) => sum + rate, 0) / showUpRates.length
      : 0

    setPortfolioMetrics({
      totalClients,
      clientsWithAlerts,
      avgCpl,
      avgBookingRate,
      avgShowUpRate,
    })
  }

  useEffect(() => {
    recalculatePortfolioMetrics()
  }, [clients])

  const formatCurrency = (value: number) => `€${value.toFixed(2)}`
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#8e0b0b] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sunpower Agency Dashboard
              </h1>
            </div>
            <nav className="flex space-x-2">
              {[
                { name: 'Monitoring', icon: '📊' },
                { name: 'Insights', icon: '📈' },
                { name: 'Calls', icon: '📞' },
                { name: 'Earnings', icon: '💰' }
              ].map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                    activeTab === tab.name
                      ? 'bg-[#8e0b0b] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'Monitoring' && (
          <>
            {/* Executive Overview */}
            <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Executive Overview
            </h2>
            <button
              onClick={fetchClientsList}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Clients</Text>
                  <Metric className="mt-2 text-2xl text-gray-900">{portfolioMetrics.totalClients}</Metric>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">Clients with Alerts</Text>
                  <Metric className="mt-2 text-2xl text-gray-900">{portfolioMetrics.clientsWithAlerts}</Metric>
                </div>
                <div className="w-12 h-12 bg-[#8e0b0b]/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-[#8e0b0b]" />
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">Portfolio Avg CPL (7D)</Text>
                  <Metric className="mt-2 text-2xl text-gray-900">
                    {portfolioMetrics.avgCpl > 0 ? formatCurrency(portfolioMetrics.avgCpl) : 'N/A'}
                  </Metric>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">Portfolio Avg Booking Rate</Text>
                  <Metric className="mt-2 text-2xl text-gray-900">
                    {portfolioMetrics.avgBookingRate > 0 ? formatPercentage(portfolioMetrics.avgBookingRate) : 'N/A'}
                  </Metric>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">Portfolio Avg Show-Up Rate</Text>
                  <Metric className="mt-2 text-2xl text-gray-900">
                    {portfolioMetrics.avgShowUpRate > 0 ? formatPercentage(portfolioMetrics.avgShowUpRate) : 'N/A'}
                  </Metric>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Client Status */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Client Status
            </h2>
            <Text className="text-sm text-gray-600">
              {clients.length} {clients.length === 1 ? 'client' : 'clients'}
            </Text>
          </div>

          {loading && clients.length === 0 ? (
            <Card className="p-8 bg-white border border-gray-200 rounded-lg">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Leads (3D)</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments (3D)</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Leads (7D)</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments (7D)</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Rate (7D)</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Show-Ups (7D)</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CPL (7D)</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Spend (7D)</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Alert Count</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clients.map((client) => (
                      <ClientTableRow
                        key={client.ghl_subaccount_id}
                        client={client}
                        isExpanded={expandedClient === client.ghl_subaccount_id}
                        onToggle={() =>
                          setExpandedClient(
                            expandedClient === client.ghl_subaccount_id ? null : client.ghl_subaccount_id
                          )
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
          </>
        )}

        {activeTab === 'Insights' && (
          <InsightsView 
            clients={clients}
            selectedClient={selectedClientForInsights}
            onClientChange={setSelectedClientForInsights}
          />
        )}

        {activeTab === 'Calls' && (
          <div className="text-center py-20">
            <Text className="text-gray-500">Calls section coming soon...</Text>
          </div>
        )}

        {activeTab === 'Earnings' && (
          <div className="text-center py-20">
            <Text className="text-gray-500">Earnings section coming soon...</Text>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              © 2025 Sunpower Agency. All Rights Reserved.
            </p>
            <p className="text-sm text-gray-600">
              Client Monitoring Dashboard
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Insights View Component
interface InsightsViewProps {
  clients: ClientWithStats[]
  selectedClient: string
  onClientChange: (clientId: string) => void
}

function InsightsView({ clients, selectedClient, onClientChange }: InsightsViewProps) {
  const selectedClientData = clients.find(c => c.ghl_subaccount_id === selectedClient)
  const stats = selectedClientData?.stats
  const loading = selectedClientData?.loading || false
  const alertCount = stats?.alert_count || 0
  const hasAlerts = alertCount > 0

  const formatCurrency = (value: number) => `€${value.toFixed(2)}`
  const formatPercentage = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A'
    return `${value.toFixed(1)}%`
  }

  const showUpRate = stats && stats.total_appointments_7d > 0
    ? `${stats.show_ups_7d}/${stats.total_appointments_7d}`
    : '0/0'

  return (
    <div className="space-y-8">
      {/* Client Selection */}
      <section>
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="client-select" className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <select
              id="client-select"
              value={selectedClient}
              onChange={(e) => onClientChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8e0b0b] focus:border-transparent"
            >
              {clients.map(client => (
                <option key={client.ghl_subaccount_id} value={client.ghl_subaccount_id}>
                  {client.client_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
              hasAlerts ? 'bg-[#8e0b0b] text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {hasAlerts ? 'Alert' : 'Healthy'}
            </span>
          </div>
        </div>
      </section>

      {/* Key Metrics Overview */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Key Metrics Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div>
              <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">Leads (7d)</Text>
              <Metric className="mt-2 text-2xl text-gray-900">{loading ? '...' : (stats?.leads_7d || 0)}</Metric>
              <Text className="mt-1 text-sm text-gray-600">3d: {loading ? '...' : (stats?.leads_3d || 0)}</Text>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div>
              <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">Appointments (7d)</Text>
              <Metric className="mt-2 text-2xl text-gray-900">{loading ? '...' : (stats?.appointments_7d || 0)}</Metric>
              <Text className="mt-1 text-sm text-gray-600">3d: {loading ? '...' : (stats?.appointments_3d || 0)}</Text>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div>
              <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">Booking Rate (7d)</Text>
              <Metric className="mt-2 text-2xl text-gray-900">{loading ? '...' : formatPercentage(stats?.booking_rate_7d || null)}</Metric>
              <Text className="mt-1 text-sm text-gray-600">N/A</Text>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div>
              <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">Show-Ups (7d)</Text>
              <Metric className="mt-2 text-2xl text-gray-900">{loading ? '...' : showUpRate}</Metric>
              <Text className="mt-1 text-sm text-gray-600">
                {stats && stats.total_appointments_7d === 0 ? 'No appointments' : `${stats?.show_ups_7d || 0} show-ups`}
              </Text>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div>
              <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">CPL (7d)</Text>
              <Metric className="mt-2 text-2xl text-gray-900">{loading ? '...' : (stats ? formatCurrency(stats.cpl_7d) : 'N/A')}</Metric>
              <Text className="mt-1 text-sm text-gray-600">
                <span className={hasAlerts ? 'text-[#8e0b0b]' : 'text-gray-600'}>
                  {hasAlerts ? 'Alert' : 'Healthy'}
                </span>
              </Text>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div>
              <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">Spend (7d)</Text>
              <Metric className="mt-2 text-2xl text-gray-900">{loading ? '...' : (stats ? formatCurrency(stats.spend_7d) : 'N/A')}</Metric>
              <Text className="mt-1 text-sm text-gray-600">Total ad spend</Text>
            </div>
          </Card>
        </div>
      </section>

      {/* Efficiency Metrics */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Efficiency Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">Booking Rate</Text>
                <Metric className="mt-2 text-2xl text-gray-900">{loading ? '...' : formatPercentage(stats?.booking_rate_7d || null)}</Metric>
              </div>
              <div className="w-12 h-12 bg-[#8e0b0b]/10 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-[#8e0b0b]" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Spend (7d)</Text>
                <Metric className="mt-2 text-2xl text-gray-900">{loading ? '...' : (stats ? formatCurrency(stats.spend_7d) : 'N/A')}</Metric>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Camera className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cash Collected (7d)</Text>
                <Metric className="mt-2 text-2xl text-gray-900">
                  {loading ? '...' : formatCurrency((stats?.spend_7d || 0) * 2.5)}
                </Metric>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 30-Day Trend Analysis */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">30-Day Trend Analysis</h2>
        {selectedClientData && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            {stats?.trend_data && stats.trend_data.length > 0 ? (
              <AreaChart
                data={stats.trend_data}
                index="date"
                categories={['leads', 'appointments', 'show_ups']}
                colors={['#4b5563', '#6b7280', '#8e0b0b']}
                valueFormatter={(value) => value.toString()}
                yAxisWidth={40}
                showLegend={true}
                curveType="natural"
                className="h-80"
              />
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500 bg-gray-50 rounded border border-gray-200">
                {loading ? 'Loading trend data...' : 'No trend data available'}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

// Client Table Row Component
interface ClientTableRowProps {
  client: ClientWithStats
  isExpanded: boolean
  onToggle: () => void
}

function ClientTableRow({ client, isExpanded, onToggle }: ClientTableRowProps) {
  const stats = client.stats
  const loading = client.loading
  const alertCount = stats?.alert_count || 0
  const hasAlerts = alertCount > 0

  const formatCurrency = (value: number) => `€${value.toFixed(2)}`
  const formatPercentage = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A'
    return `${value.toFixed(1)}%`
  }

  const showUpRate = stats && stats.total_appointments_7d > 0
    ? `${stats.show_ups_7d}/${stats.total_appointments_7d}`
    : '0/0'

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${hasAlerts ? 'bg-[#8e0b0b]' : 'bg-gray-400'}`}></div>
            <span className="text-sm font-medium text-gray-900">{client.client_name}</span>
          </div>
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
          {loading ? <div className="animate-pulse h-4 bg-gray-200 rounded w-8 mx-auto"></div> : (stats?.leads_3d || 0)}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
          {loading ? <div className="animate-pulse h-4 bg-gray-200 rounded w-8 mx-auto"></div> : (stats?.appointments_3d || 0)}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
          {loading ? <div className="animate-pulse h-4 bg-gray-200 rounded w-8 mx-auto"></div> : (stats?.leads_7d || 0)}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
          {loading ? <div className="animate-pulse h-4 bg-gray-200 rounded w-8 mx-auto"></div> : (stats?.appointments_7d || 0)}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
          {loading ? <div className="animate-pulse h-4 bg-gray-200 rounded w-8 mx-auto"></div> : formatPercentage(stats?.booking_rate_7d || null)}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
          {loading ? <div className="animate-pulse h-4 bg-gray-200 rounded w-8 mx-auto"></div> : showUpRate}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
          {loading ? <div className="animate-pulse h-4 bg-gray-200 rounded w-8 mx-auto"></div> : (stats ? formatCurrency(stats.cpl_7d) : 'N/A')}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
          {loading ? <div className="animate-pulse h-4 bg-gray-200 rounded w-8 mx-auto"></div> : (stats ? formatCurrency(stats.spend_7d) : 'N/A')}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-center">
          {hasAlerts ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#8e0b0b] text-white">
              {alertCount}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
              0
            </span>
          )}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            hasAlerts ? 'bg-[#8e0b0b] text-white' : 'bg-gray-200 text-gray-700'
          }`}>
            {hasAlerts ? 'Alert' : 'Healthy'}
          </span>
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-center">
          <button
            onClick={onToggle}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronDown
              className={`h-5 w-5 transition-transform ${
                isExpanded ? 'transform rotate-180' : ''
              }`}
            />
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={12} className="px-6 py-6 bg-gray-50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trend Chart */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {client.client_name} - 30-Day Trends
                </h3>
                {stats?.trend_data && stats.trend_data.length > 0 ? (
                  <AreaChart
                    data={stats.trend_data}
                    index="date"
                    categories={['leads', 'appointments', 'show_ups']}
                    colors={['#4b5563', '#6b7280', '#8e0b0b']}
                    valueFormatter={(value) => value.toString()}
                    yAxisWidth={40}
                    showLegend={true}
                    curveType="natural"
                    className="h-64"
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500 bg-white rounded border border-gray-200">
                    No trend data available
                  </div>
                )}
              </div>

              {/* Alerts List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Alerts
                </h3>
                {stats?.alerts && stats.alerts.length > 0 ? (
                  <div className="space-y-2">
                    {stats.alerts.map((alert, index) => (
                      <div
                        key={index}
                        className="p-3 bg-[#8e0b0b]/10 border border-[#8e0b0b]/30 rounded-md"
                      >
                        <Text className="text-sm text-[#8e0b0b] font-medium">{alert}</Text>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-100 border border-gray-300 rounded-md">
                    <Text className="text-sm text-gray-700">
                      No alerts - All systems healthy
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// Client Row Component (Legacy - kept for reference)
interface ClientRowProps {
  client: ClientWithStats
  isExpanded: boolean
  onToggle: () => void
}

function ClientRow({ client, isExpanded, onToggle }: ClientRowProps) {
  const stats = client.stats
  const loading = client.loading
  const alertCount = stats?.alert_count || 0
  const hasAlerts = alertCount > 0

  const formatCurrency = (value: number) => `€${value.toFixed(2)}`
  const formatPercentage = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A'
    return `${value.toFixed(1)}%`
  }

  const showUpRate = stats && stats.total_appointments_7d > 0
    ? ((stats.show_ups_7d / stats.total_appointments_7d) * 100).toFixed(1)
    : '0/0'

  return (
    <Card className="p-0 bg-white border border-gray-200">
      <Accordion>
        <AccordionHeader
          onClick={onToggle}
          className="px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between w-full">
            {/* Status */}
            <div className="w-16">
              {hasAlerts ? (
                <Badge className="bg-[#8e0b0b] text-white px-2 py-1 rounded" size="sm">
                  {alertCount}
                </Badge>
              ) : (
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">0</span>
                </div>
              )}
            </div>

            {/* Client Name */}
            <div className="flex-1 min-w-[150px]">
              <Text className="font-semibold text-gray-900">{client.client_name}</Text>
            </div>

            {/* 3 Days Pulse */}
            <div className="w-32 text-center">
              {loading ? (
                <div className="animate-pulse h-4 bg-gray-200 rounded"></div>
              ) : (
                <div className="text-xs">
                  <div className="text-gray-700 font-medium">
                    Leads: {stats?.leads_3d || 0}
                  </div>
                  <div className="text-gray-600">
                    Appts: {stats?.appointments_3d || 0}
                  </div>
                </div>
              )}
            </div>

            {/* 7 Days Performance */}
            <div className="hidden xl:grid grid-cols-6 gap-2 flex-1 text-sm min-w-[500px]">
              <div className="text-center">
                <Text className="text-xs text-gray-600">Leads (7D)</Text>
                <div className="font-medium text-gray-900">{stats?.leads_7d || 0}</div>
              </div>
              <div className="text-center">
                <Text className="text-xs text-gray-600">Appts (7D)</Text>
                <div className="font-medium text-gray-900">{stats?.appointments_7d || 0}</div>
              </div>
              <div className="text-center">
                <Text className="text-xs text-gray-600">Booking Rate (7D)</Text>
                <div className="font-medium text-gray-900">{formatPercentage(stats?.booking_rate_7d || null)}</div>
              </div>
              <div className="text-center">
                <Text className="text-xs text-gray-600">Show-Ups (7D)</Text>
                <div className="font-medium text-gray-900">{showUpRate}</div>
              </div>
              <div className="text-center">
                <Text className="text-xs text-gray-600">CPL (7D)</Text>
                <div className="font-medium text-gray-900">{stats ? formatCurrency(stats.cpl_7d) : 'N/A'}</div>
              </div>
              <div className="text-center">
                <Text className="text-xs text-gray-600">Spend (7D)</Text>
                <div className="font-medium text-gray-900">{stats ? formatCurrency(stats.spend_7d) : 'N/A'}</div>
              </div>
            </div>

            {/* Alerts */}
            <div className="w-20 text-center">
              {hasAlerts ? (
                <Badge className="bg-[#8e0b0b] text-white px-2 py-1 rounded" size="sm">
                  ⚠️ {alertCount}
                </Badge>
              ) : (
                <Badge className="bg-gray-300 text-gray-700 px-2 py-1 rounded" size="sm">0</Badge>
              )}
            </div>

            {/* Status Badge */}
            <div className="w-24 text-center">
              <Badge className={hasAlerts ? 'bg-[#8e0b0b] text-white px-2 py-1 rounded' : 'bg-gray-300 text-gray-700 px-2 py-1 rounded'} size="sm">
                {hasAlerts ? 'Alert' : 'Healthy'}
              </Badge>
            </div>

            {/* Details Toggle */}
            <div className="w-8 flex justify-center">
            <ChevronDown
              className={`h-5 w-5 text-gray-600 transition-transform ${
                isExpanded ? 'transform rotate-180' : ''
              }`}
            />
            </div>
          </div>
        </AccordionHeader>

        {isExpanded && (
          <AccordionBody className="px-6 py-4">
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trend Chart */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {client.client_name} - 30-Day Trends
                  </h3>
                  {stats?.trend_data && stats.trend_data.length > 0 ? (
                    <AreaChart
                      data={stats.trend_data}
                      index="date"
                      categories={['leads', 'appointments', 'show_ups']}
                      colors={['#4b5563', '#6b7280', '#8e0b0b']}
                      valueFormatter={(value) => value.toString()}
                      yAxisWidth={40}
                      showLegend={true}
                      curveType="natural"
                      className="h-64"
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded border border-gray-200">
                      No trend data available
                    </div>
                  )}
                </div>

                {/* Alerts List */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Alerts
                  </h3>
                  {stats?.alerts && stats.alerts.length > 0 ? (
                    <div className="space-y-2">
                      {stats.alerts.map((alert, index) => (
                        <div
                          key={index}
                          className="p-3 bg-[#8e0b0b]/10 border border-[#8e0b0b]/30 rounded-md"
                        >
                          <Text className="text-sm text-[#8e0b0b] font-medium">{alert}</Text>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-100 border border-gray-300 rounded-md">
                      <Text className="text-sm text-gray-700">
                        No alerts - All systems healthy
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            )}
          </AccordionBody>
        )}
      </Accordion>
    </Card>
  )
}

