'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PencilIcon, 
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/20/solid';
import CRMHeader from '@/components/crm/CRMHeader';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPriceWithPreference, convertPrice } from '@/lib/currency';

interface Opportunity {
  id: string;
  stage: string;
  estimatedValue?: number;
  probability?: number;
  expectedCloseDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
  };
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  } | null;
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    leadNumber: string;
  };
  interestedProperty?: {
    id: string;
    title: string;
    address: string;
    price: number;
  };
  office: {
    id: string;
    name: string;
    city: string;
  };
  _count?: {
    tasks: number;
    comments: number;
    transactions: number;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  officeId?: string;
}

const opportunityStages = [
  { value: 'PROSPECT', label: 'Prospekt', color: '#6b7280' },
  { value: 'QUALIFIED', label: 'I Kualifikuar', color: '#2563eb' },
  { value: 'PROPOSAL', label: 'Propozim', color: '#f59e0b' },
  { value: 'NEGOTIATION', label: 'Negocim', color: '#8b5cf6' },
  { value: 'CLOSING', label: 'Mbyllje', color: '#059669' },
  { value: 'WON', label: 'Fituar', color: '#10b981' },
  { value: 'LOST', label: 'Humbur', color: '#ef4444' }
];

export default function CRMOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    q: '',
    stage: '',
    assignedToId: '',
    officeId: '',
    minValue: '',
    maxValue: '',
    dateFrom: '',
    dateTo: ''
  });
  const currency = useCurrency();

  // Initialize user and default filters once
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.role === 'AGENT') {
        setFilters(prev => (
          prev.assignedToId === parsedUser.id ? prev : { ...prev, assignedToId: parsedUser.id }
        ));
      } else if (parsedUser.role !== 'SUPER_ADMIN') {
        setFilters(prev => (
          prev.officeId === (parsedUser.officeId || '') ? prev : { ...prev, officeId: parsedUser.officeId || '' }
        ));
      }
    } else {
      window.location.href = '/crm';
      return;
    }
  }, []);

  // Fetch opportunities when filters change
  useEffect(() => {
    fetchOpportunities();
  }, [filters]);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/opportunities?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOpportunities(data.data.opportunities || []);
        }
      } else {
        throw new Error('Failed to fetch opportunities');
      }
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
      // No fallback to mock data - show empty state
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  const getStageInfo = (stage: string) => {
    return opportunityStages.find(s => s.value === stage) || opportunityStages[0];
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectOpportunity = (opportunityId: string) => {
    setSelectedOpportunities(prev => 
      prev.includes(opportunityId)
        ? prev.filter(id => id !== opportunityId)
        : [...prev, opportunityId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOpportunities.length === opportunitiesArray.length) {
      setSelectedOpportunities([]);
    } else {
      setSelectedOpportunities(opportunitiesArray.map(o => o.id));
    }
  };

  if (!user) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Duke ngarkuar...</p>
      </div>
    );
  }

  // Stats calculations - ensure opportunities is always an array
  const opportunitiesArray = Array.isArray(opportunities) ? opportunities : [];
  const totalValue = opportunitiesArray.reduce((sum, opp) => sum + (opp.estimatedValue || 0), 0);
  const averageProbability = opportunitiesArray.length > 0 
    ? opportunitiesArray.reduce((sum, opp) => sum + (opp.probability || 0), 0) / opportunitiesArray.length 
    : 0;
  const stageStats = opportunityStages.map(stage => ({
    ...stage,
    count: opportunitiesArray.filter(opp => opp.stage === stage.value).length
  }));

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="opportunities" user={user} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
              Opportunities
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Menaxhoni shanset e shitjes dhe përcillni progresin e çdo mundësie biznesi.
            </p>
          </div>
          
          <Link
            href="/crm/opportunities/new"
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#2563eb', 
              color: 'white', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '0.75rem', 
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
          >
            <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            Opportunity e Re
          </Link>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '3rem', height: '3rem', background: '#dbeafe', color: '#2563eb', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                📊
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>{opportunitiesArray.length}</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Opportunities</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '3rem', height: '3rem', background: '#d1fae5', color: '#059669', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                💰
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>{formatPriceWithPreference(convertPrice(totalValue, currency))}</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Vlera Totale</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '3rem', height: '3rem', background: '#fef3c7', color: '#f59e0b', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                📈
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>{Math.round(averageProbability)}%</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Probabilitet Mesatar</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '3rem', height: '3rem', background: '#f3e8ff', color: '#8b5cf6', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🏆
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {stageStats.find(s => s.value === 'WON')?.count || 0}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Fituar</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: showFilters ? '1rem' : '0' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <MagnifyingGlassIcon style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Kërko opportunities..."
                value={filters.q}
                onChange={(e) => handleFilterChange('q', e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: showFilters ? '#2563eb' : '#f3f4f6', 
                color: showFilters ? 'white' : '#374151', 
                padding: '0.75rem 1rem', 
                border: '1px solid ' + (showFilters ? '#2563eb' : '#d1d5db'),
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <FunnelIcon style={{ width: '1rem', height: '1rem' }} />
              Filtro
            </button>
          </div>

          {showFilters && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
              <select
                value={filters.stage}
                onChange={(e) => handleFilterChange('stage', e.target.value)}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
              >
                <option value="">Të gjitha fazat</option>
                {opportunityStages.map(stage => (
                  <option key={stage.value} value={stage.value}>{stage.label}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Vlera minimale"
                value={filters.minValue}
                onChange={(e) => handleFilterChange('minValue', e.target.value)}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
              />

              <input
                type="number"
                placeholder="Vlera maksimale"
                value={filters.maxValue}
                onChange={(e) => handleFilterChange('maxValue', e.target.value)}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
              />

              <input
                type="date"
                placeholder="Nga data"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
              />

              <input
                type="date"
                placeholder="Deri në datë"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
              />
            </div>
          )}
        </div>

        {/* Opportunities Table */}
        <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
              <p>Duke ngarkuar opportunities...</p>
            </div>
          ) : opportunitiesArray.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#1f2937' }}>Asnjë opportunity</h3>
              <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                Kur konvertoni leads në opportunities, ato do të shfaqen këtu.
              </p>
              <Link
                href="/crm/leads"
                style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#2563eb', 
                  color: 'white', 
                  padding: '0.75rem 1.5rem', 
                  borderRadius: '0.75rem', 
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                Shiko Leads
              </Link>
            </div>
          ) : (
            <div>
              {/* Table Header */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '40px 1fr 120px 120px 100px 120px 120px 120px 100px',
                gap: '1rem',
                padding: '1rem',
                background: '#f8fafc',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#6b7280'
              }}>
                <input 
                  type="checkbox" 
                  checked={selectedOpportunities.length === opportunitiesArray.length && opportunitiesArray.length > 0}
                  onChange={handleSelectAll}
                  style={{ width: '1rem', height: '1rem' }}
                />
                <span>Klient & Pronë</span>
                <span>Vlera</span>
                <span>Probabilitet</span>
                <span>Faza</span>
                <span>Agjenti</span>
                <span>Data Mbylljes</span>
                <span>Tasks & Comments</span>
                <span>Veprime</span>
              </div>

              {/* Table Rows */}
              {opportunitiesArray.map((opportunity) => {
                const stageInfo = getStageInfo(opportunity.stage);
                
                return (
                  <div key={opportunity.id}
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '40px 1fr 120px 120px 100px 120px 120px 120px 100px',
                      gap: '1rem',
                      padding: '1rem',
                      borderBottom: '1px solid #f3f4f6',
                      alignItems: 'center',
                      backgroundColor: selectedOpportunities.includes(opportunity.id) ? '#f0f9ff' : 'white'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedOpportunities.includes(opportunity.id)}
                      onChange={() => handleSelectOpportunity(opportunity.id)}
                      style={{ width: '1rem', height: '1rem' }}
                    />
                    
                    <div>
                      <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '0.25rem' }}>
                        {opportunity.client.firstName} {opportunity.client.lastName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        {opportunity.client.mobile}
                      </div>
                      {opportunity.interestedProperty && (
                        <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>
                          📍 {opportunity.interestedProperty.title}
                        </div>
                      )}
                      {opportunity.lead && (
                        <div style={{ fontSize: '0.625rem', color: '#059669', background: '#f0fdf4', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', display: 'inline-block', marginTop: '0.25rem' }}>
                          Lead: {opportunity.lead.leadNumber}
                        </div>
                      )}
                    </div>
                    
                    <span style={{ fontWeight: '500', color: '#1f2937' }}>
                      {opportunity.estimatedValue ? formatPriceWithPreference(convertPrice(opportunity.estimatedValue, currency)) : '-'}
                    </span>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ 
                        width: '100%', 
                        height: '0.5rem', 
                        background: '#e5e7eb', 
                        borderRadius: '0.25rem',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${opportunity.probability || 0}%`, 
                          height: '100%', 
                          background: stageInfo.color,
                          borderRadius: '0.25rem'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280', minWidth: '2rem' }}>
                        {opportunity.probability || 0}%
                      </span>
                    </div>
                    
                    <span style={{ 
                      background: stageInfo.color + '20', 
                      color: stageInfo.color, 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {stageInfo.label}
                    </span>
                    
                    <div style={{ fontSize: '0.75rem' }}>
                      <div style={{ fontWeight: '500', color: '#1f2937' }}>
                        {opportunity.assignedTo ? `${opportunity.assignedTo.firstName} ${opportunity.assignedTo.lastName}` : 'Pa caktuar'}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '0.65rem' }}>
                        {opportunity.assignedTo ? opportunity.assignedTo.email : 'Nuk ka agjent'}
                      </div>
                    </div>
                    
                    <span style={{ color: '#374151', fontSize: '0.875rem' }}>
                      {opportunity.expectedCloseDate 
                        ? new Date(opportunity.expectedCloseDate).toLocaleDateString()
                        : '-'
                      }
                    </span>
                    
                    {opportunity._count && (
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.625rem' }}>
                        <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>
                          {opportunity._count.tasks} task
                        </span>
                        <span style={{ background: '#f0fdf4', color: '#166534', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>
                          {opportunity._count.comments} note
                        </span>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <Link
                        href={`/crm/opportunities/${opportunity.id}`}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '1.75rem',
                          height: '1.75rem',
                          background: '#f0f9ff', 
                          color: '#2563eb', 
                          borderRadius: '0.375rem', 
                          textDecoration: 'none'
                        }}
                        title="Shiko detajet"
                      >
                        <EyeIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                      </Link>
                      
                      {(user?.role === 'SUPER_ADMIN' || user?.role === 'OFFICE_ADMIN' || user?.role === 'MANAGER') && (
                        <Link
                          href={`/crm/opportunities/${opportunity.id}/edit`}
                          style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '1.75rem',
                            height: '1.75rem',
                            background: '#fef3c7', 
                            color: '#f59e0b', 
                            borderRadius: '0.375rem', 
                            textDecoration: 'none'
                          }}
                          title="Edito"
                        >
                          <PencilIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                        </Link>
                      )}
                      
                      <a
                        href={`tel:${opportunity.client.mobile}`}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '1.75rem',
                          height: '1.75rem',
                          background: '#f0fdf4', 
                          color: '#059669', 
                          borderRadius: '0.375rem', 
                          textDecoration: 'none'
                        }}
                        title="Telefono"
                      >
                        <PhoneIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
