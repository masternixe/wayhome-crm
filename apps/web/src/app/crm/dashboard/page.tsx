'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  HomeIcon, 
  UserGroupIcon, 
  PhoneIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import CRMHeader from '@/components/crm/CRMHeader';
import { formatUserRole } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import apiService from '@/services/apiService';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  points: number;
  office?: {
    name: string;
    city: string;
  };
}

interface DashboardStats {
  totalProperties: number;
  totalLeads: number;
  totalOpportunities: number;
  totalTransactions: number;
  totalRevenue: number;
  myProperties: number;
  myLeads: number;
  myDeals: number;
  myPoints: number;
}

interface Activity {
  id: string;
  type: 'lead' | 'client' | 'property' | 'transaction';
  message: string;
  createdAt: string;
  entityId: string;
}

function DashboardContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalLeads: 0,
    totalOpportunities: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    myProperties: 0,
    myLeads: 0,
    myDeals: 0,
    myPoints: 0
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
      fetchRecentActivities();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching dashboard stats from API...');
      const response = await apiService.getDashboardStats();
      
      if (response.success) {
        console.log('📊 Dashboard API response:', response.data);
        
        // Map dashboard data to stats
        const dashboardStats: DashboardStats = {
          totalProperties: response.data.overview?.totalProperties || 0,
          totalLeads: response.data.overview?.totalLeads || 0,
          totalOpportunities: response.data.overview?.totalOpportunities || 0,
          totalTransactions: response.data.overview?.totalTransactions || 0,
          totalRevenue: response.data.overview?.totalRevenue || 0, // Show TOTAL revenue from all closed deals
          // Show the agent's total properties (not just this month's)
          myProperties: response.data.overview?.totalProperties || 0,
          myLeads: response.data.thisMonth?.newLeads || 0,
          myDeals: response.data.opportunities?.won || 0,
          myPoints: response.data.performance?.myPoints || 0
        };
        
        console.log('✅ Dashboard stats loaded:', dashboardStats);
        setStats(dashboardStats);
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('❌ Failed to fetch dashboard stats:', error);
      
      // API service already handles auth errors, just set empty stats
      const emptyStats: DashboardStats = {
        totalProperties: 0,
        totalLeads: 0,
        totalOpportunities: 0,
        totalTransactions: 0,
        totalRevenue: 0,
        myProperties: 0,
        myLeads: 0,
        myDeals: 0,
        myPoints: 0
      };
      setStats(emptyStats);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    setLoadingActivities(true);
    try {
      console.log('🔍 Fetching recent activities from API...');
      const response = await apiService.getRecentActivity(5); // Get last 5 activities
      
      if (response.success && Array.isArray(response.data)) {
        console.log('📋 Recent activities loaded:', response.data);
        setActivities(response.data);
      } else {
        console.warn('⚠️ No activities data returned');
        setActivities([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch recent activities:', error);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
  };

  if (loading || !user) {
    return (
      <div style={{ 
        fontFamily: 'system-ui, sans-serif', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Duke ngarkuar dashboard-in...</p>
        </div>
      </div>
    );
  }

  const isAgent = user.role === 'AGENT';
  const isManager = user.role === 'MANAGER';
  const isAdmin = user.role === 'OFFICE_ADMIN' || user.role === 'SUPER_ADMIN';

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="dashboard" user={user} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Welcome */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Mirë se erdhe, {user.firstName}! 👋
          </h2>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Ja një përmbledhje e aktivitetit tuaj të fundit
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {/* Personal Stats for Agents */}
          {isAgent && (
            <>
              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>Pronat e Mia</h3>
                  <HomeIcon style={{ width: '1.5rem', height: '1.5rem', color: '#2563eb' }} />
                </div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  {stats.myProperties}
                </p>
              </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>Leads-at e Mi</h3>
                  <PhoneIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
                </div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  {stats.myLeads}
                </p>
              </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>Marrëveshjet e Mia</h3>
                  <CurrencyDollarIcon style={{ width: '1.5rem', height: '1.5rem', color: '#059669' }} />
                </div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  {stats.myDeals}
                </p>
              </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>Pikat e Mia</h3>
                  <span style={{ fontSize: '1.5rem' }}>🏆</span>
                </div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  {stats.myPoints}
                </p>
              </div>
            </>
          )}

          {/* Office/Admin Stats */}
          {(isManager || isAdmin) && (
            <>
              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>Total Prona</h3>
                  <HomeIcon style={{ width: '1.5rem', height: '1.5rem', color: '#2563eb' }} />
                </div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  {stats.totalProperties}
                </p>
              </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>Total Leads</h3>
                  <PhoneIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
                </div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  {stats.totalLeads}
                </p>
              </div>

              <Link href="/crm/opportunities" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                     onMouseOver={(e) => {
                       e.currentTarget.style.transform = 'translateY(-2px)';
                       e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.15)';
                     }}
                     onMouseOut={(e) => {
                       e.currentTarget.style.transform = 'translateY(0)';
                       e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                     }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>Opportunities</h3>
                    <BriefcaseIcon style={{ width: '1.5rem', height: '1.5rem', color: '#8b5cf6' }} />
                  </div>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                    {stats.totalOpportunities}
                  </p>
                </div>
              </Link>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>Transaksionet</h3>
                  <CurrencyDollarIcon style={{ width: '1.5rem', height: '1.5rem', color: '#059669' }} />
                </div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  {stats.totalTransactions}
                </p>
              </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>Të Ardhurat Totale</h3>
                  <ChartBarIcon style={{ width: '1.5rem', height: '1.5rem', color: '#7c3aed' }} />
                </div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  €{stats.totalRevenue.toLocaleString()}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
            Veprime të Shpejta
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Link
              href="/crm/properties/new"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'white',
                padding: '1rem',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                color: '#374151',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <HomeIcon style={{ width: '1.25rem', height: '1.25rem', color: '#2563eb' }} />
              <span style={{ fontWeight: '500' }}>Shto Pronë</span>
            </Link>

            <Link
              href="/crm/leads/new"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'white',
                padding: '1rem',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                color: '#374151',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <PhoneIcon style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />
              <span style={{ fontWeight: '500' }}>Lead i Ri</span>
            </Link>

            <Link
              href="/crm/clients/new"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'white',
                padding: '1rem',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                color: '#374151',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <UserGroupIcon style={{ width: '1.25rem', height: '1.25rem', color: '#059669' }} />
              <span style={{ fontWeight: '500' }}>Klient i Ri</span>
            </Link>

            {(isManager || isAdmin) && (
              <Link
                href="/crm/reports"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: 'white',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  textDecoration: 'none',
                  color: '#374151',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <ChartBarIcon style={{ width: '1.25rem', height: '1.25rem', color: '#7c3aed' }} />
                <span style={{ fontWeight: '500' }}>Raporte</span>
              </Link>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Main Content */}
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
              Aktiviteti i Fundit
            </h3>
            
            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              {loadingActivities ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  Po ngarkohen aktivitetet...
                </div>
              ) : activities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  Nuk ka aktivitete të fundit.
                </div>
              ) : (
                activities.map((activity, index) => {
                  // Helper function to get time difference
                  const getTimeAgo = (dateString: string) => {
                    const now = new Date();
                    const activityDate = new Date(dateString);
                    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
                    
                    if (diffInMinutes < 60) {
                      return `${diffInMinutes} minuta më parë`;
                    } else if (diffInMinutes < 1440) {
                      const hours = Math.floor(diffInMinutes / 60);
                      return `${hours} orë më parë`;
                    } else {
                      const days = Math.floor(diffInMinutes / 1440);
                      return `${days} ditë më parë`;
                    }
                  };

                  // Helper function to get activity color
                  const getActivityColor = (type: string) => {
                    switch (type) {
                      case 'property': return '#2563eb';
                      case 'lead': return '#f59e0b';
                      case 'transaction': return '#059669';
                      case 'client': return '#7c3aed';
                      default: return '#6b7280';
                    }
                  };

                  return (
                    <div key={activity.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1rem', 
                      padding: '1rem 0',
                      borderBottom: index < activities.length - 1 ? '1px solid #f3f4f6' : 'none'
                    }}>
                      <div style={{ 
                        width: '2.5rem', 
                        height: '2.5rem', 
                        background: getActivityColor(activity.type), 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '1rem'
                      }}>
                        {activity.type === 'property' && '🏠'}
                        {activity.type === 'lead' && '📞'}
                        {activity.type === 'transaction' && '💰'}
                        {activity.type === 'client' && '👥'}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '500', color: '#1f2937', margin: '0 0 0.25rem 0' }}>
                          {activity.message}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                          {getTimeAgo(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Points/Leaderboard */}
            {isAgent && (
              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                  🏆 Pikat e Mia
                </h3>
                
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#2563eb' }}>
                    {stats.myPoints}
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>pikë totale</p>
                </div>

                <div style={{ background: '#f9fafb', borderRadius: '0.75rem', padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Objektiva Mujore
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#6b7280' }}>Shitje:</span>
                    <span style={{ color: '#059669', fontWeight: '500' }}>3/5</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: '#6b7280' }}>Qira:</span>
                    <span style={{ color: '#059669', fontWeight: '500' }}>7/10</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Lidhje të Shpejta
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a 
                  href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/health`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#2563eb', 
                    textDecoration: 'none', 
                    fontSize: '0.875rem',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    background: '#f0f9ff'
                  }}
                >
                  🏥 API Health Check
                </a>
                
                <a 
                  href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/api-docs`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#2563eb', 
                    textDecoration: 'none', 
                    fontSize: '0.875rem',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    background: '#f0f9ff'
                  }}
                >
                  📚 API Documentation
                </a>
                
                <Link 
                  href="/"
                  style={{ 
                    color: '#2563eb', 
                    textDecoration: 'none', 
                    fontSize: '0.875rem',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    background: '#f0f9ff'
                  }}
                >
                  🌐 Faqja Publike
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Role-specific Features */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
            Funksionalitetet e Disponueshme
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {/* Agent Features */}
            {isAgent && (
              <>
                <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '0.75rem', border: '1px solid #dbeafe' }}>
                  <h4 style={{ fontWeight: '500', color: '#1e40af', marginBottom: '0.5rem' }}>Menaxhimi i Pronave</h4>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Shto, edito dhe menaxho pronat e tua</p>
                </div>
                <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '0.75rem', border: '1px solid #dbeafe' }}>
                  <h4 style={{ fontWeight: '500', color: '#1e40af', marginBottom: '0.5rem' }}>Lead Management</h4>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Gjurmo dhe konverto leads në klientë</p>
                </div>
                <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '0.75rem', border: '1px solid #dbeafe' }}>
                  <h4 style={{ fontWeight: '500', color: '#1e40af', marginBottom: '0.5rem' }}>Transaksionet</h4>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Shiko dhe menaxho marrëveshjet</p>
                </div>
              </>
            )}

            {/* Manager Features */}
            {(isManager || isAdmin) && (
              <>
                <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '0.75rem', border: '1px solid #dcfce7' }}>
                  <h4 style={{ fontWeight: '500', color: '#166534', marginBottom: '0.5rem' }}>Menaxhimi i Ekipit</h4>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Koordino dhe mbikëqyr ekipin</p>
                </div>
                <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '0.75rem', border: '1px solid #dcfce7' }}>
                  <h4 style={{ fontWeight: '500', color: '#166534', marginBottom: '0.5rem' }}>Raporte dhe Analytics</h4>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Shiko performancën dhe statistikat</p>
                </div>
                <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '0.75rem', border: '1px solid #dcfce7' }}>
                  <h4 style={{ fontWeight: '500', color: '#166534', marginBottom: '0.5rem' }}>Aprovimi i Transaksioneve</h4>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Aprovo dhe mbikëqyr marrëveshjet</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* System Status */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)', 
          color: 'white', 
          borderRadius: '1rem', 
          padding: '2rem', 
          marginTop: '2rem',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', margin: '0 0 1rem 0' }}>
            Statusi i Sistemit
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>✅</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Database</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>⚠️</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Redis (Disabled)</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>⚠️</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Email (Disabled)</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>⚠️</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Stripe (Not Configured)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CRMDashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
