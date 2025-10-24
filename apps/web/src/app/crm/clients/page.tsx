'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  EyeIcon,
  PencilIcon,
  UserIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ChatBubbleLeftIcon,
  HomeIcon,
  TableCellsIcon,
  Squares2X2Icon
} from '@heroicons/react/20/solid';
import CRMHeader from '@/components/crm/CRMHeader';
import { formatUserRole } from '@/lib/utils';
import { getOfficeDisplayName } from '@/lib/officeDisplay';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  preferredCurrency: string;
  notes?: string;
  createdAt: string;
  ownerAgent?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  office: {
    id: string;
    name: string;
  };
  _count?: {
    opportunities: number;
    transactions: number;
  };
  lastActivity?: string;
  totalSpent?: number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  officeId?: string;
}

export default function CRMClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [agents, setAgents] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    q: '',
    agentId: '',
    hasActivity: false
  });
  const [newClient, setNewClient] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    preferredCurrency: 'EUR',
    notes: '',
    ownerAgentId: ''
  });

  // Initialize user and default filters once
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.role === 'AGENT') {
        setFilters(prev => (
          prev.agentId === parsedUser.id ? prev : { ...prev, agentId: parsedUser.id }
        ));
      }
    } else {
      window.location.href = '/crm';
      return;
    }
  }, []);

  // Fetch clients when filters change
  useEffect(() => {
    fetchClients();
    fetchAgents();
  }, [filters]);

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?role=AGENT,MANAGER`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        // Filter out soft deleted agents (status !== 'ACTIVE')
        const activeAgents = (result.data || []).filter((agent: any) => agent.status === 'ACTIVE');
        setAgents(activeAgents);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const queryParams = new URLSearchParams();
      
      if (filters.q) queryParams.append('search', filters.q);
      if (filters.agentId && filters.agentId !== 'all') queryParams.append('ownerAgentId', filters.agentId);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setClients(data.data.clients);
        } else {
          throw new Error(data.message || 'Failed to fetch clients');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClient),
      });

      if (response.ok) {
        alert('✅ Pronari u krijua me sukses!');
        setShowNewClientForm(false);
        setNewClient({
          firstName: '',
          lastName: '',
          mobile: '',
          email: '',
          preferredCurrency: 'EUR',
          notes: '',
          ownerAgentId: ''
        });
        fetchClients(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`❌ Gabim: ${errorData.message || 'Nuk mund të krijohet klienti'}`);
      }
    } catch (error) {
      console.error('Error creating client:', error);
      alert(`❌ Gabim gjatë krijimit të klientit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="clients" user={user} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
              Menaxhimi i Pronarëve
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              {loading ? 'Duke ngarkuar...' : `${clients.length} klientë gjithsej`}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'white', 
                  color: '#374151', 
                  padding: '0.75rem 1rem', 
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {viewMode === 'cards' ? (
                  <>
                    <TableCellsIcon style={{ width: '1rem', height: '1rem' }} />
                    Tabelë
                  </>
                ) : (
                  <>
                    <Squares2X2Icon style={{ width: '1rem', height: '1rem' }} />
                    Karta
                  </>
                )}
              </button>

              <button
                onClick={() => fetchClients()}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#f3f4f6', 
                  color: '#374151', 
                  padding: '0.75rem 1rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                <ArrowPathIcon style={{ width: '1rem', height: '1rem' }} />
                Rifresko
              </button>
            </div>
            
            <button
              onClick={() => setShowNewClientForm(true)}
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
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <PlusIcon style={{ width: '1rem', height: '1rem' }} />
              Klient i Ri
            </button>
          </div>
        </div>

        {/* Client Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <UserIcon style={{ width: '1.5rem', height: '1.5rem', color: '#2563eb' }} />
              <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Total Pronarë</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
              {clients.length}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <HomeIcon style={{ width: '1.5rem', height: '1.5rem', color: '#059669' }} />
              <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Klientë Aktivë</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
              {clients.filter(c => c._count && (c._count.opportunities > 0 || c._count.transactions > 0)).length}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <CurrencyDollarIcon style={{ width: '1.5rem', height: '1.5rem', color: '#7c3aed' }} />
              <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Vlerë Totale</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
              €{clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0).toLocaleString()}
            </div>
          </div>

          {user.role === 'AGENT' && (
            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <UserIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
                <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Klientët e Mi</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
                {clients.filter(c => c.ownerAgent?.id === user.id).length}
              </div>
            </div>
          )}
        </div>

        {/* Filters Bar */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
              <input
                type="text"
                placeholder="Kërko për emër, telefon, ose email..."
                value={filters.q}
                onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
                style={{ 
                  width: '100%', 
                  padding: '0.5rem 1rem 0.5rem 2.5rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              <MagnifyingGlassIcon style={{ 
                position: 'absolute', 
                left: '0.75rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                width: '1rem', 
                height: '1rem', 
                color: '#6b7280' 
              }} />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.hasActivity}
                onChange={(e) => setFilters(prev => ({ ...prev, hasActivity: e.target.checked }))}
              />
              <span style={{ fontSize: '0.875rem', color: '#374151' }}>Vetëm aktivë</span>
            </label>
          </div>
        </div>

        {/* Clients View */}
        <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
              <p>Duke ngarkuar klientët...</p>
            </div>
          ) : clients.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
                Nuk ka klientë
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Filloni duke shtuar klientin e parë
              </p>
              <button
                onClick={() => setShowNewClientForm(true)}
                style={{ 
                  background: '#2563eb', 
                  color: 'white', 
                  padding: '0.75rem 1.5rem', 
                  border: 'none',
                  borderRadius: '0.5rem', 
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Shto Klient të Ri
              </button>
            </div>
          ) : viewMode === 'table' ? (
            <div>
              {/* Table Header */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 200px 150px 200px 150px',
                gap: '1rem',
                padding: '1rem',
                background: '#f8fafc',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#6b7280'
              }}>
                <span>Klient</span>
                <span>Kontakt</span>
                <span>Aktivitet</span>
                <span>Agjent & Zyre</span>
                <span>Veprime</span>
              </div>

              {/* Table Rows */}
              {clients.map((client) => (
                <div key={client.id} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 200px 150px 200px 150px',
                  gap: '1rem',
                  padding: '1rem',
                  borderBottom: '1px solid #f3f4f6',
                  alignItems: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  {/* Client Info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '2.5rem', 
                        height: '2.5rem', 
                        background: 'linear-gradient(45deg, #dbeafe, #bfdbfe)', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '1.25rem'
                      }}>
                        👤
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                          {client.firstName} {client.lastName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          Pronar prej {new Date(client.createdAt).toLocaleDateString()}
                        </div>
                        {client.totalSpent && (
                          <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#059669' }}>
                            €{client.totalSpent.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#1f2937', marginBottom: '0.25rem' }}>
                      📞 {client.mobile}
                    </div>
                    {client.email && (
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        ✉️ {client.email}
                      </div>
                    )}
                  </div>

                  {/* Activity Summary */}
                  <div>
                    {client._count && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ 
                          background: '#dbeafe', 
                          color: '#1e40af', 
                          padding: '0.125rem 0.375rem', 
                          borderRadius: '0.75rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          textAlign: 'center'
                        }}>
                          {client._count.opportunities} opp.
                        </span>
                        <span style={{ 
                          background: '#f0fdf4', 
                          color: '#166534', 
                          padding: '0.125rem 0.375rem', 
                          borderRadius: '0.75rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          textAlign: 'center'
                        }}>
                          {client._count.transactions} trans.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Agent & Office */}
                  <div>
                    {client.ownerAgent && (
                      <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem' }}>
                        👨‍💼 {client.ownerAgent.firstName} {client.ownerAgent.lastName}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      🏢 {getOfficeDisplayName(client.office)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <Link
                      href={`/crm/clients/${client.id}`}
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
                      title="Detajet"
                    >
                      <EyeIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                    </Link>
                    
                    {(user?.role === 'SUPER_ADMIN' || user?.role === 'OFFICE_ADMIN' || user?.role === 'MANAGER' || 
                      (user?.role === 'AGENT' && client.ownerAgent?.id === user.id)) && (
                      <Link
                        href={`/crm/clients/${client.id}/edit`}
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
                      href={`tel:${client.mobile}`}
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
              ))}
            </div>
          ) : (
            /* Cards View */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1px', background: '#f3f4f6' }}>
              {clients.map((client) => (
                <div key={client.id} style={{ 
                  background: 'white',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  {/* Client Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '2.5rem', 
                        height: '2.5rem', 
                        background: 'linear-gradient(45deg, #dbeafe, #bfdbfe)', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '1.25rem'
                      }}>
                        👤
                      </div>
                      <div>
                        <h3 style={{ fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.25rem 0' }}>
                          {client.firstName} {client.lastName}
                        </h3>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          Pronar prej {new Date(client.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {client.totalSpent && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#059669' }}>
                          €{client.totalSpent.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>total shpenzuar</div>
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <PhoneIcon style={{ width: '1rem', height: '1rem', color: '#2563eb' }} />
                      <a href={`tel:${client.mobile}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                        {client.mobile}
                      </a>
                    </div>
                    {client.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <EnvelopeIcon style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                        <a href={`mailto:${client.email}`} style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}>
                          {client.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Activity Summary */}
                  {client._count && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                      <span style={{ 
                        background: '#dbeafe', 
                        color: '#1e40af', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '1rem', 
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {client._count.opportunities} opportunities
                      </span>
                      <span style={{ 
                        background: '#f0fdf4', 
                        color: '#166534', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '1rem', 
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {client._count.transactions} transaksione
                      </span>
                      <span style={{ 
                        background: '#fef3c7', 
                        color: '#92400e', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '1rem', 
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {client.preferredCurrency}
                      </span>
                    </div>
                  )}

                  {/* Notes Preview */}
                  {client.notes && (
                    <div style={{ 
                      background: '#f9fafb', 
                      padding: '0.75rem', 
                      borderRadius: '0.5rem', 
                      marginBottom: '1rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                        <ChatBubbleLeftIcon style={{ width: '0.875rem', height: '0.875rem', color: '#6b7280' }} />
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>SHËNIM</span>
                      </div>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: '#374151', 
                        margin: 0,
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {client.notes}
                      </p>
                    </div>
                  )}

                  {/* Agent & Last Activity */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      {client.ownerAgent && (
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          Agjenti: <span style={{ fontWeight: '500', color: '#374151' }}>
                            {client.ownerAgent.firstName} {client.ownerAgent.lastName}
                          </span>
                        </div>
                      )}
                      {client.lastActivity && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          Aktiviteti i fundit: {new Date(client.lastActivity).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      href={`/crm/clients/${client.id}`}
                      style={{ 
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        background: '#f0f9ff', 
                        color: '#2563eb', 
                        padding: '0.5rem', 
                        borderRadius: '0.5rem', 
                        textDecoration: 'none',
                        fontSize: '0.875rem'
                      }}
                    >
                      <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                      Detajet
                    </Link>
                    
                    {(user?.role === 'SUPER_ADMIN' || user?.role === 'OFFICE_ADMIN' || user?.role === 'MANAGER' || 
                      (user?.role === 'AGENT' && client.ownerAgent?.id === user.id)) && (
                      <Link
                        href={`/crm/clients/${client.id}/edit`}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '2.5rem',
                          height: '2.5rem',
                          background: '#fef3c7', 
                          color: '#f59e0b', 
                          borderRadius: '0.5rem', 
                          textDecoration: 'none'
                        }}
                        title="Edito"
                      >
                        <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                      </Link>
                    )}
                    
                    <a
                      href={`tel:${client.mobile}`}
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2.5rem',
                        height: '2.5rem',
                        background: '#f0fdf4', 
                        color: '#059669', 
                        borderRadius: '0.5rem', 
                        textDecoration: 'none'
                      }}
                      title="Telefono"
                    >
                      <PhoneIcon style={{ width: '1rem', height: '1rem' }} />
                    </a>
                    
                    {client.email && (
                      <a
                        href={`mailto:${client.email}`}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '2.5rem',
                          height: '2.5rem',
                          background: '#fef3c7', 
                          color: '#f59e0b', 
                          borderRadius: '0.5rem', 
                          textDecoration: 'none'
                        }}
                        title="Email"
                      >
                        <EnvelopeIcon style={{ width: '1rem', height: '1rem' }} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Client Form Modal */}
      {showNewClientForm && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '1rem', 
            padding: '2rem', 
            maxWidth: '600px', 
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                Klient i Ri
              </h3>
              <button
                onClick={() => setShowNewClientForm(false)}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  fontSize: '1.5rem', 
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Emri *
                </label>
                <input
                  type="text"
                  value={newClient.firstName}
                  onChange={(e) => setNewClient(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Mbiemri *
                </label>
                <input
                  type="text"
                  value={newClient.lastName}
                  onChange={(e) => setNewClient(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Telefoni *
                </label>
                <input
                  type="tel"
                  value={newClient.mobile}
                  onChange={(e) => setNewClient(prev => ({ ...prev, mobile: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Agjenti Përgjegjës *
                </label>
                <select
                  value={newClient.ownerAgentId}
                  onChange={(e) => setNewClient(prev => ({ ...prev, ownerAgentId: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                >
                  <option value="">Zgjidh Agjentin...</option>
                  {Array.isArray(agents) && agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.firstName} {agent.lastName} ({agent.role})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Monedha e Preferuar
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="currency"
                      value="EUR"
                      checked={newClient.preferredCurrency === 'EUR'}
                      onChange={(e) => setNewClient(prev => ({ ...prev, preferredCurrency: e.target.value }))}
                    />
                    <span>EUR</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="currency"
                      value="ALL"
                      checked={newClient.preferredCurrency === 'ALL'}
                      onChange={(e) => setNewClient(prev => ({ ...prev, preferredCurrency: e.target.value }))}
                    />
                    <span>ALL</span>
                  </label>
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Shënime
                </label>
                <textarea
                  value={newClient.notes}
                  onChange={(e) => setNewClient(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Shënime ose detaje shtesë për klientin..."
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(false)}
                  style={{ 
                    flex: 1,
                    background: '#f3f4f6', 
                    color: '#374151', 
                    padding: '0.75rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  Anulo
                </button>
                <button
                  type="submit"
                  style={{ 
                    flex: 2,
                    background: '#2563eb', 
                    color: 'white', 
                    padding: '0.75rem', 
                    border: 'none', 
                    borderRadius: '0.5rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Krijo Klient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
