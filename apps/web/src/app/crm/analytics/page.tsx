'use client';

import { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon,
  UserGroupIcon,
  HomeIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  BuildingOfficeIcon,
  UserIcon,
  ArrowPathIcon,
  EyeIcon,
  HeartIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import CRMHeader from '@/components/crm/CRMHeader';
import AnalyticsChart from '@/components/crm/AnalyticsChart';
import DateRangePicker from '@/components/crm/DateRangePicker';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  officeId?: string;
}

interface Office {
  id: string;
  name: string;
  city: string;
}

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  officeId: string;
  role: string;
}

interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalCommission: number;
    totalProperties: number;
    totalLeads: number;
    totalOpportunities: number;
    totalClients: number;
    totalTransactions: number;
    avgDealTime: number;
    monthlyGrowth: number;
  };
  conversionRates: {
    leadToOpportunity: number;
    opportunityToSale: number;
    leadToSale: number;
    avgConversionTime: number;
  };
  clientRetention: {
    newClients: number;
    returningClients: number;
    retentionRate: number;
    avgClientValue: number;
    clientLifetimeValue: number;
  };
  salesByOffice: Array<{
    officeId: string;
    officeName: string;
    sales: number;
    revenue: number;
    deals: number;
    agents: number;
  }>;
  salesByAgent: Array<{
    agentId: string;
    agentName: string;
    officeId: string;
    sales: number;
    revenue: number;
    deals: number;
    commission: number;
    conversionRate: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    sales: number;
    rentals: number;
    commission: number;
    leads: number;
    opportunities: number;
  }>;
  conversionFunnel: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
  clientRetentionChart: Array<{
    month: string;
    newClients: number;
    returningClients: number;
    retentionRate: number;
  }>;
  topPerformers: {
    topOffices: Array<{
      id: string;
      name: string;
      revenue: number;
      deals: number;
      growth: number;
    }>;
    topAgents: Array<{
      id: string;
      name: string;
      office: string;
      revenue: number;
      deals: number;
      conversionRate: number;
      points: number;
    }>;
  };
}

export default function CRMAnalyticsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [offices, setOffices] = useState<Office[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffice, setSelectedOffice] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [activeView, setActiveView] = useState<'sales' | 'conversion' | 'retention'>('sales');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: '',
    label: 'Të gjitha'
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Only allow managers and above to access analytics
      if (parsedUser.role === 'AGENT') {
        alert('Qasje e ndaluar. Vetëm menaxherët dhe administratorët mund të shikojnë analytics.');
        window.location.href = '/crm/dashboard';
        return;
      }
    } else {
      window.location.href = '/crm';
      return;
    }

    fetchAnalytics();
    fetchOffices();
    fetchAgents();
  }, []);

  // Separate effect for data refetching when filters change
  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [dateRange, selectedOffice, selectedAgent, user]);



  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const queryParams = new URLSearchParams();
      
      // Only add date parameters if they have values
      if (dateRange.startDate) queryParams.append('startDate', dateRange.startDate);
      if (dateRange.endDate) queryParams.append('endDate', dateRange.endDate);
      if (selectedOffice !== 'all') queryParams.append('office', selectedOffice);
      if (selectedAgent !== 'all') queryParams.append('agent', selectedAgent);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch analytics');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Set empty state instead of mock data
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };



  const fetchOffices = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOffices(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch offices');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to fetch offices:', error);
      setOffices([]);
    }
  };

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?role=AGENT,MANAGER`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAgents(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch agents');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      setAgents([]);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sq-AL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getFilteredAgents = () => {
    if (selectedOffice === 'all') return agents;
    return agents.filter(agent => agent.officeId === selectedOffice);
  };

  const getSalesChartData = () => {
    if (!analytics) return [];
    
    if (selectedAgent !== 'all') {
      const agent = analytics.salesByAgent.find(a => a.agentId === selectedAgent);
      return agent ? [{ label: agent.agentName, value: agent.revenue }] : [];
    }
    
    if (selectedOffice !== 'all') {
      const office = analytics.salesByOffice.find(o => o.officeId === selectedOffice);
      return office ? [{ label: office.officeName, value: office.revenue }] : [];
    }
    
    return analytics.salesByOffice.map(office => ({
      label: office.officeName,
      value: office.revenue
    }));
  };

  if (loading) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
        <p>Duke ngarkuar analytics...</p>
      </div>
    );
  }

    if (!analytics) {
  return (
      <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f3f4f6' }}>
        <CRMHeader currentPage="Analytics" />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ color: '#1f2937', marginBottom: '1rem' }}>Problem me ngarkimin e të dhënave</h2>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            Nuk munda të ngarkoj të dhënat e analytics. Ju lutem kontrolloni lidhjen me serverin.
          </p>
          <button
            onClick={() => {
              fetchAnalytics();
              fetchOffices();
              fetchAgents();
            }}
            style={{
              background: '#2563eb',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Provo përsëri
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Header */}
      <CRMHeader currentPage="Analytics" />

      {/* Controls */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem 1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
            📊 Analytics Dashboard
            </h1>
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Date Range Picker */}
            <DateRangePicker 
              value={dateRange}
              onChange={setDateRange}
            />
            
            {/* Office Filter */}
            <select
              value={selectedOffice}
              onChange={(e) => {
                setSelectedOffice(e.target.value);
                setSelectedAgent('all'); // Reset agent when office changes
              }}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                background: 'white'
              }}
            >
              <option value="all">Të gjitha zyrat</option>
              {offices.map(office => (
                <option key={office.id} value={office.id}>{office.name}</option>
              ))}
            </select>

            {/* Agent Filter */}
              <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                background: 'white'
              }}
            >
              <option value="all">Të gjithë agjentët</option>
              {getFilteredAgents().map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.firstName} {agent.lastName}
                </option>
              ))}
              </select>

            {/* Export button */}
            <button
              onClick={() => alert('Export functionality coming soon!')}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#2563eb', 
                color: 'white', 
                padding: '0.75rem 1rem', 
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              <DocumentArrowDownIcon style={{ width: '1rem', height: '1rem' }} />
              Export
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {[
            { key: 'sales', label: '💰 Sales Analytics', icon: CurrencyDollarIcon },
            { key: 'conversion', label: '🔄 Conversion Rates', icon: FunnelIcon },
            { key: 'retention', label: '❤️ Client Retention', icon: HeartIcon }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: activeView === tab.key ? '#2563eb' : 'white',
                color: activeView === tab.key ? 'white' : '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <tab.icon style={{ width: '1rem', height: '1rem' }} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sales Analytics View */}
        {activeView === 'sales' && (
          <>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#dbeafe', color: '#2563eb', padding: '1rem', borderRadius: '0.75rem' }}>
                    <CurrencyDollarIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Të ardhurat totale</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0.25rem 0 0 0' }}>
                      {formatCurrency(analytics.overview.totalRevenue)}
                    </h3>
            </div>
            </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <ArrowTrendingUpIcon style={{ width: '1rem', height: '1rem', color: '#059669' }} />
              <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '500' }}>
                    +{analytics.overview.monthlyGrowth}%
              </span>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>këtë muaj</span>
            </div>
          </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#f0fdf4', color: '#059669', padding: '1rem', borderRadius: '0.75rem' }}>
                    <TrophyIcon style={{ width: '1.5rem', height: '1.5rem' }} />
            </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Komisioni total</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0.25rem 0 0 0' }}>
                      {formatCurrency(analytics.overview.totalCommission)}
                    </h3>
            </div>
            </div>
          </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#fef3c7', color: '#f59e0b', padding: '1rem', borderRadius: '0.75rem' }}>
                    <HomeIcon style={{ width: '1.5rem', height: '1.5rem' }} />
            </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Transaksione</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0.25rem 0 0 0' }}>
                      {analytics.overview.totalTransactions}
                    </h3>
            </div>
            </div>
          </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#fce7f3', color: '#ec4899', padding: '1rem', borderRadius: '0.75rem' }}>
                    <UserGroupIcon style={{ width: '1.5rem', height: '1.5rem' }} />
            </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Klientë totalë</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0.25rem 0 0 0' }}>
                      {analytics.overview.totalClients}
                    </h3>
            </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <AnalyticsChart
                title="📈 Të ardhurat mujore"
                data={analytics.revenueByMonth.map(month => ({
                  label: month.month,
                  value: month.sales + month.rentals
                }))}
                type="line"
                currency={true}
              />
              
              <AnalyticsChart
                title="🏢 Shitjet sipas zyrës"
                data={getSalesChartData()}
                type="pie"
                currency={true}
              />
            </div>

            {/* Office Performance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                  🏢 Performance by Office
            </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {analytics.salesByOffice.map((office, index) => (
                    <div key={office.officeId} style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      background: '#f9fafb',
                      borderRadius: '0.75rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                          width: '3rem', 
                          height: '3rem', 
                          background: '#dbeafe', 
                          color: '#2563eb',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <BuildingOfficeIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '500', color: '#1f2937' }}>
                            {office.officeName}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {office.deals} deals • {office.agents} agents
                          </div>
                  </div>
            </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
                          {formatCurrency(office.revenue)}
              </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {office.sales} sales
              </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                  🏆 Top Performing Agents
            </h3>
            
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {analytics.salesByAgent.slice(0, 5).map((agent, index) => (
                    <div key={agent.agentId} style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'space-between',
                      padding: '1rem',
                  background: index === 0 ? '#fef3c7' : '#f9fafb',
                      borderRadius: '0.75rem',
                  border: index === 0 ? '1px solid #fbbf24' : '1px solid #e5e7eb'
                }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </span>
                    <div>
                      <div style={{ fontWeight: '500', color: '#1f2937', fontSize: '0.875rem' }}>
                            {agent.agentName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {agent.conversionRate.toFixed(1)}% conversion
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '0.875rem' }}>
                          {formatCurrency(agent.revenue)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {agent.deals} deals
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
          </>
        )}

        {/* Conversion Analytics View */}
        {activeView === 'conversion' && (
          <>
            {/* Conversion KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#ecfdf5', color: '#059669', padding: '1rem', borderRadius: '0.75rem' }}>
                    <ArrowPathIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Lead → Opportunity</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0.25rem 0 0 0' }}>
                      {analytics.conversionRates.leadToOpportunity.toFixed(1)}%
            </h3>
                  </div>
                    </div>
                    </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#dbeafe', color: '#2563eb', padding: '1rem', borderRadius: '0.75rem' }}>
                    <TrophyIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                    </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Opportunity → Sale</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0.25rem 0 0 0' }}>
                      {analytics.conversionRates.opportunityToSale.toFixed(1)}%
                    </h3>
                  </div>
            </div>
          </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#f3e8ff', color: '#8b5cf6', padding: '1rem', borderRadius: '0.75rem' }}>
                    <ChartBarIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Overall Conversion</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0.25rem 0 0 0' }}>
                      {analytics.conversionRates.leadToSale.toFixed(1)}%
            </h3>
                  </div>
                    </div>
                    </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '0.75rem' }}>
                    <EyeIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                    </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Avg. Conversion Time</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0.25rem 0 0 0' }}>
                      {analytics.conversionRates.avgConversionTime} days
                    </h3>
                  </div>
            </div>
          </div>
        </div>

            {/* Conversion Funnel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <AnalyticsChart
                title="🔄 Conversion Funnel"
                data={analytics.conversionFunnel.map(stage => ({
                  label: stage.stage,
                  value: stage.count
                }))}
                type="bar"
              />

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                  📊 Conversion Breakdown
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {analytics.conversionFunnel.map((stage, index) => (
                    <div key={stage.stage} style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'space-between',
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb'
                }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>
                          {stage.stage}
                  </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
                            {stage.count}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {stage.percentage.toFixed(1)}%
                          </div>
                        </div>
                        <div style={{ 
                          width: '80px',
                          height: '8px',
                          background: '#e5e7eb',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${stage.percentage}%`,
                            height: '100%',
                            background: index === 0 ? '#059669' : index === 1 ? '#2563eb' : index === 2 ? '#f59e0b' : index === 3 ? '#8b5cf6' : '#ef4444',
                            borderRadius: '4px'
                          }} />
                    </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Client Retention View */}
        {activeView === 'retention' && (
          <>
            {/* Retention KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '0.75rem' }}>
                    <HeartIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Retention Rate</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0.25rem 0 0 0' }}>
                      {analytics.clientRetention.retentionRate.toFixed(1)}%
            </h3>
                  </div>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#ecfdf5', color: '#059669', padding: '1rem', borderRadius: '0.75rem' }}>
                    <UserGroupIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>New Clients</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0.25rem 0 0 0' }}>
                      {analytics.clientRetention.newClients}
                    </h3>
                  </div>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#dbeafe', color: '#2563eb', padding: '1rem', borderRadius: '0.75rem' }}>
                    <ArrowPathIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Returning Clients</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0.25rem 0 0 0' }}>
                      {analytics.clientRetention.returningClients}
                    </h3>
                  </div>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#f0fdf4', color: '#059669', padding: '1rem', borderRadius: '0.75rem' }}>
                    <CurrencyDollarIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Lifetime Value</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0.25rem 0 0 0' }}>
                      {formatCurrency(analytics.clientRetention.clientLifetimeValue)}
                    </h3>
              </div>
            </div>
          </div>
        </div>

            {/* Retention Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
              <AnalyticsChart
                title="📈 Client Retention Over Time"
                data={analytics.clientRetentionChart.map(month => ({
                  label: month.month,
                  value: month.retentionRate
                }))}
                type="line"
              />

              <AnalyticsChart
                title="👥 New vs Returning Clients"
                data={[
                  { label: 'New Clients', value: analytics.clientRetention.newClients },
                  { label: 'Returning Clients', value: analytics.clientRetention.returningClients }
                ]}
                type="pie"
              />
          </div>
          </>
        )}
      </div>
    </div>
  );
}