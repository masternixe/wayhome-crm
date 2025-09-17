'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  StarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import CRMHeader from '@/components/crm/CRMHeader';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/apiService';
import { formatUserRole } from '@/lib/utils';

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  office?: {
    id: string;
    name: string;
    city: string;
    address?: string;
    phone?: string;
  };
  _count?: {
    leads: number;
    opportunities: number;
    properties: number;
    transactions: number;
  };
  stats?: {
    totalRevenue: number;
    totalCommission: number;
    conversionRate: number;
    avgDealTime: number;
  };
}

function AgentDetailContent({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLists, setLoadingLists] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    fetchAgent();
    fetchRelatedLists();
  }, [params.id]);

  const fetchAgent = async () => {
    setLoading(true);
    try {
      const response = await apiService.get(`/users/${params.id}`);
      if (response.success) {
        setAgent(response.data);
      } else {
        setAgent(null);
      }
    } catch (error) {
      console.error('Failed to fetch agent:', error);
      setAgent(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedLists = async () => {
    setLoadingLists(true);
    try {
      // Clients owned by this agent
      const clientParams = new URLSearchParams({ ownerAgentId: params.id });
      const clientsRes = await apiService.get(`/clients?${clientParams.toString()}`);
      if (clientsRes.success && clientsRes.data && clientsRes.data.clients) {
        setClients(clientsRes.data.clients);
      } else {
        setClients([]);
      }

      // Leads assigned to this agent
      const leadsParams = new URLSearchParams({ assignedToId: params.id });
      const leadsRes = await apiService.get(`/leads?${leadsParams.toString()}`);
      if (leadsRes.success && leadsRes.data && leadsRes.data.data && Array.isArray(leadsRes.data.data)) {
        setLeads(leadsRes.data.data);
      } else if (leadsRes.success && leadsRes.data && leadsRes.data.leads) {
        setLeads(leadsRes.data.leads);
      } else {
        setLeads([]);
      }

      // Opportunities for this agent (via client ownership)
      const oppParams = new URLSearchParams({ ownerAgentId: params.id });
      const oppRes = await apiService.get(`/opportunities?${oppParams.toString()}`);
      if (oppRes.success && oppRes.data && oppRes.data.opportunities) {
        setOpportunities(oppRes.data.opportunities);
      } else {
        setOpportunities([]);
      }

      // Transactions where agent is involved
      const transParams = new URLSearchParams({ primaryAgentId: params.id });
      const transRes = await apiService.get(`/transactions?${transParams.toString()}`);
      if (transRes.success && transRes.data && transRes.data.data && Array.isArray(transRes.data.data)) {
        setTransactions(transRes.data.data);
      } else if (transRes.success && transRes.data && transRes.data.transactions) {
        setTransactions(transRes.data.transactions);
      } else {
        setTransactions([]);
      }

      // Also include transactions as collaborator
      const transColParams = new URLSearchParams({ collaboratingAgentId: params.id });
      const transColRes = await apiService.get(`/transactions?${transColParams.toString()}`);
      if (transColRes.success && transColRes.data && transColRes.data.transactions) {
        setTransactions(prev => {
          const combined = [...prev, ...transColRes.data.transactions];
          const seen = new Set();
          return combined.filter(t => (seen.has(t.id) ? false : seen.add(t.id)) as unknown as boolean);
        });
      }

      // Properties for this agent (owner or collaborator)
      const propParams = new URLSearchParams({ agentId: params.id });
      const propRes = await apiService.get(`/properties?${propParams.toString()}`);
      if (propRes.success && propRes.data && Array.isArray(propRes.data)) {
        setProperties(propRes.data);
      } else if (propRes.success && propRes.data && propRes.data.data && Array.isArray(propRes.data.data)) {
        setProperties(propRes.data.data);
      } else {
        setProperties([]);
      }
    } catch (error) {
      console.error('Failed to fetch related lists:', error);
      setClients([]);
      setLeads([]);
      setOpportunities([]);
      setTransactions([]);
      setProperties([]);
    } finally {
      setLoadingLists(false);
    }
  };

  // Access control
  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'OFFICE_ADMIN' || user?.id === agent?.id;
  const canViewStats = user?.role === 'SUPER_ADMIN' || user?.role === 'OFFICE_ADMIN' || user?.role === 'MANAGER';

  if (loading) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
        <CRMHeader currentPage="agents" user={user} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '1rem', color: '#6b7280' }}>Duke ngarkuar detajet e agjentit...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
        <CRMHeader currentPage="agents" user={user} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <UserIcon style={{ width: '3rem', height: '3rem', color: '#d1d5db', margin: '0 auto 1rem auto' }} />
            <div style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '0.5rem' }}>Agjenti nuk u gjet</div>
            <Link href="/crm/agents" style={{ color: '#2563eb', textDecoration: 'none' }}>
              Kthehu te lista e agjentëve
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="agents" user={user} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Link
            href="/crm/agents"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              color: '#2563eb', 
              textDecoration: 'none',
              fontSize: '0.875rem'
            }}
          >
            <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
            Kthehu te agjentët
          </Link>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
            {canEdit && (
              <Link
                href={`/crm/agents/${agent.id}/edit`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#2563eb',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                Ndrysho
              </Link>
            )}
          </div>
        </div>

        {/* Agent Profile */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: '2rem' }}>
            <div style={{ 
              width: '6rem', 
              height: '6rem', 
              background: agent.avatar ? `url(${agent.avatar})` : '#e5e7eb',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              fontSize: '2rem',
              fontWeight: '500'
            }}>
              {!agent.avatar && `${agent.firstName[0]}${agent.lastName[0]}`}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  {agent.firstName} {agent.lastName}
                </h1>
                <span style={{
                  background: agent.role === 'SUPER_ADMIN' ? '#fef2f2' : 
                            agent.role === 'OFFICE_ADMIN' ? '#f3e8ff' :
                            agent.role === 'MANAGER' ? '#fef3c7' : '#f0f9ff',
                  color: agent.role === 'SUPER_ADMIN' ? '#dc2626' : 
                        agent.role === 'OFFICE_ADMIN' ? '#7c3aed' :
                        agent.role === 'MANAGER' ? '#f59e0b' : '#2563eb',
                  padding: '0.5rem 1rem',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  {formatUserRole(agent.role)}
                </span>
                <span style={{
                  background: agent.isActive ? '#f0fdf4' : '#f9fafb',
                  color: agent.isActive ? '#059669' : '#6b7280',
                  padding: '0.5rem 1rem',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  {agent.isActive ? 'Aktiv' : 'Joaktiv'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <EnvelopeIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
                  <span style={{ color: '#1f2937' }}>{agent.email}</span>
                </div>
                
                {agent.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <PhoneIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
                    <span style={{ color: '#1f2937' }}>{agent.phone}</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BuildingOfficeIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
                  <span style={{ color: '#1f2937' }}>
                    {agent.office ? `${agent.office.name}, ${agent.office.city}` : 'Pa zyrë'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CalendarIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
                  <span style={{ color: '#6b7280' }}>
                    Anëtar që prej {new Date(agent.createdAt).toLocaleDateString('sq-AL')}
                  </span>
                </div>

                {agent.lastLogin && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ClockIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
                    <span style={{ color: '#6b7280' }}>
                      Hyrja e fundit: {new Date(agent.lastLogin).toLocaleDateString('sq-AL')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#dbeafe', borderRadius: '0.75rem', padding: '0.75rem' }}>
                <UserIcon style={{ width: '1.5rem', height: '1.5rem', color: '#2563eb' }} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {agent._count?.leads || 0}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Leads</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#fef3c7', borderRadius: '0.75rem', padding: '0.75rem' }}>
                <StarIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {agent._count?.opportunities || 0}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Opportunities</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#ecfdf5', borderRadius: '0.75rem', padding: '0.75rem' }}>
                <BuildingOfficeIcon style={{ width: '1.5rem', height: '1.5rem', color: '#059669' }} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {agent._count?.properties || 0}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Prona</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#fef2f2', borderRadius: '0.75rem', padding: '0.75rem' }}>
                <ChartBarIcon style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {agent._count?.transactions || 0}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Transaksione</div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Lists */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '2rem' }}>
          {/* Clients */}
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Klientët</h3>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{clients.length}</div>
            </div>
            {loadingLists ? (
              <div style={{ color: '#6b7280' }}>Duke ngarkuar...</div>
            ) : clients.length === 0 ? (
              <div style={{ color: '#6b7280' }}>Asnjë klient</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
                {clients.map((c: any) => (
                  <Link key={c.id} href={`/crm/clients/${c.id}`} style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb', textDecoration: 'none', color: '#1f2937' }}>
                    <div style={{ fontWeight: 600 }}>{c.firstName} {c.lastName}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{c.mobile}{c.email ? ` • ${c.email}` : ''}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Leads */}
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Leads</h3>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{leads.length}</div>
            </div>
            {loadingLists ? (
              <div style={{ color: '#6b7280' }}>Duke ngarkuar...</div>
            ) : leads.length === 0 ? (
              <div style={{ color: '#6b7280' }}>Asnjë lead</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
                {leads.map((l: any) => (
                  <Link key={l.id} href={`/crm/leads/${l.id}`} style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb', textDecoration: 'none', color: '#1f2937' }}>
                    <div style={{ fontWeight: 600 }}>{l.firstName} {l.lastName}{l.leadNumber ? ` • ${l.leadNumber}` : ''}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{l.mobile}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Opportunities */}
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Opportunities</h3>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{opportunities.length}</div>
            </div>
            {loadingLists ? (
              <div style={{ color: '#6b7280' }}>Duke ngarkuar...</div>
            ) : opportunities.length === 0 ? (
              <div style={{ color: '#6b7280' }}>Asnjë opportunity</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
                {opportunities.map((o: any) => (
                  <Link key={o.id} href={`/crm/opportunities/${o.id}`} style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb', textDecoration: 'none', color: '#1f2937' }}>
                    <div style={{ fontWeight: 600 }}>Klient: {o.client?.firstName} {o.client?.lastName}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Faza: {o.stage}{o.estimatedValue ? ` • €${o.estimatedValue.toLocaleString()}` : ''}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Properties */}
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Prona</h3>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{properties.length}</div>
            </div>
            {loadingLists ? (
              <div style={{ color: '#6b7280' }}>Duke ngarkuar...</div>
            ) : properties.length === 0 ? (
              <div style={{ color: '#6b7280' }}>Asnjë pronë</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
                {properties.map((p: any) => (
                  <Link key={p.id} href={`/crm/properties/${p.id}`} style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb', textDecoration: 'none', color: '#1f2937' }}>
                    <div style={{ fontWeight: 600 }}>{p.title}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{p.address}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Transactions */}
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Transaksione</h3>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{transactions.length}</div>
            </div>
            {loadingLists ? (
              <div style={{ color: '#6b7280' }}>Duke ngarkuar...</div>
            ) : transactions.length === 0 ? (
              <div style={{ color: '#6b7280' }}>Asnjë transaksion</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
                {transactions.map((t: any) => (
                  <Link key={t.id} href={`/crm/transactions/${t.id}`} style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb', textDecoration: 'none', color: '#1f2937' }}>
                    <div style={{ fontWeight: 600 }}>#{t.contractNumber || t.id.slice(-8)}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t.status}{t.grossAmount ? ` • €${t.grossAmount.toLocaleString()}` : ''}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Performance Stats (Admin/Manager only) */}
        {canViewStats && agent.stats && (
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>
              Performanca
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Xhiro Totale</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  €{agent.stats.totalRevenue.toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Komision Totali</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                  €{agent.stats.totalCommission.toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Përqindja e Konvertimit</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {agent.stats.conversionRate}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Koha Mesatare e Deal-it</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>
                  {agent.stats.avgDealTime} ditë
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Office Information */}
        {agent.office ? (
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>
              Informacione mbi Zyrën
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Emri i Zyrës</div>
                <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>{agent.office.name}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Qyteti</div>
                <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>{agent.office.city}</div>
              </div>

              {agent.office.address && (
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Adresa</div>
                  <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>{agent.office.address}</div>
                </div>
              )}

              {agent.office.phone && (
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Telefoni i Zyrës</div>
                  <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>{agent.office.phone}</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <BuildingOfficeIcon style={{ width: '3rem', height: '3rem', color: '#d1d5db', margin: '0 auto 1rem auto' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem' }}>
              Pa Zyrë
            </h2>
            <p style={{ color: '#9ca3af', margin: 0 }}>
              Ky agjent nuk është caktuar në ndonjë zyrë aktualisht.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <AgentDetailContent params={params} />
    </ProtectedRoute>
  );
}
