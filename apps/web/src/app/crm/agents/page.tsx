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
  ArrowPathIcon,
  BuildingOfficeIcon,
  StarIcon,
  XMarkIcon,
  TrashIcon
} from '@heroicons/react/20/solid';
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
  };
  _count?: {
    leads: number;
    opportunities: number;
    properties: number;
    transactions: number;
  };
}

interface Office {
  id: string;
  name: string;
  city: string;
}

const roles = [
  { value: 'AGENT', label: 'Agent' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'OFFICE_ADMIN', label: 'Office Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' }
];

function AgentsContent() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showNewAgentForm, setShowNewAgentForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [filters, setFilters] = useState({
    q: '',
    role: '',
    officeId: '',
    status: ''
  });
  const [newAgent, setNewAgent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'AGENT',
    officeId: '',
    password: '',
    confirmPassword: '',
    avatar: ''
  });

  useEffect(() => {
    fetchAgents();
    fetchOffices();
  }, [filters]);

  const fetchAgentCounts = async (agentsList: Agent[]) => {
    try {
      const agentsWithCounts = await Promise.all(
        agentsList.map(async (agent) => {
          try {
            // Fetch real counts from actual API endpoints
            const [leadsRes, opportunitiesRes, propertiesRes, transactionsRes] = await Promise.all([
              apiService.getLeads(new URLSearchParams({ assignedToId: agent.id })),
              apiService.getOpportunities(new URLSearchParams({ assignedToId: agent.id })),
              apiService.getProperties(new URLSearchParams({ agentId: agent.id })),
              apiService.getTransactions(new URLSearchParams({ agentId: agent.id }))
            ]);

            // Parse counts more carefully
            let leadsCount = 0;
            let opportunitiesCount = 0;
            let propertiesCount = 0;
            let transactionsCount = 0;

            // Leads count
            if (leadsRes.success && leadsRes.data) {
              if (Array.isArray(leadsRes.data)) {
                leadsCount = leadsRes.data.length;
              } else if (typeof leadsRes.data === 'object' && leadsRes.data !== null && 'data' in leadsRes.data) {
                const dataObj = leadsRes.data as any;
                if (Array.isArray(dataObj.data)) {
                  leadsCount = dataObj.data.length;
                } else if (dataObj.data && typeof dataObj.data === 'object' && 'leads' in dataObj.data && Array.isArray(dataObj.data.leads)) {
                  leadsCount = dataObj.data.leads.length;
                }
              }
            }

            // Opportunities count
            if (opportunitiesRes.success && opportunitiesRes.data) {
              if (Array.isArray(opportunitiesRes.data)) {
                opportunitiesCount = opportunitiesRes.data.length;
              } else if (typeof opportunitiesRes.data === 'object' && opportunitiesRes.data !== null && 'data' in opportunitiesRes.data) {
                const dataObj = opportunitiesRes.data as any;
                if (Array.isArray(dataObj.data)) {
                  opportunitiesCount = dataObj.data.length;
                } else if (dataObj.data && typeof dataObj.data === 'object' && 'opportunities' in dataObj.data && Array.isArray(dataObj.data.opportunities)) {
                  opportunitiesCount = dataObj.data.opportunities.length;
                }
              }
            }

            // Properties count
            if (propertiesRes.success && propertiesRes.data) {
              if (Array.isArray(propertiesRes.data)) {
                propertiesCount = propertiesRes.data.length;
              } else if (typeof propertiesRes.data === 'object' && propertiesRes.data !== null && 'data' in propertiesRes.data) {
                const dataObj = propertiesRes.data as any;
                if (Array.isArray(dataObj.data)) {
                  propertiesCount = dataObj.data.length;
                } else if (dataObj.data && typeof dataObj.data === 'object' && 'properties' in dataObj.data && Array.isArray(dataObj.data.properties)) {
                  propertiesCount = dataObj.data.properties.length;
                }
              }
            }

            // Transactions count
            if (transactionsRes.success && transactionsRes.data) {
              if (Array.isArray(transactionsRes.data)) {
                transactionsCount = transactionsRes.data.length;
              } else if (typeof transactionsRes.data === 'object' && transactionsRes.data !== null && 'data' in transactionsRes.data) {
                const dataObj = transactionsRes.data as any;
                if (Array.isArray(dataObj.data)) {
                  transactionsCount = dataObj.data.length;
                } else if (dataObj.data && typeof dataObj.data === 'object' && 'transactions' in dataObj.data && Array.isArray(dataObj.data.transactions)) {
                  transactionsCount = dataObj.data.transactions.length;
                }
              }
            }

            const counts = {
              leads: leadsCount,
              opportunities: opportunitiesCount,
              properties: propertiesCount,
              transactions: transactionsCount
            };

            return {
              ...agent,
              _count: counts
            };
          } catch (error) {
            console.error(`Error fetching counts for agent ${agent.id}:`, error);
            return {
              ...agent,
              _count: {
                leads: 0,
                opportunities: 0,
                properties: 0,
                transactions: 0
              }
            };
          }
        })
      );

      setAgents(agentsWithCounts);
    } catch (error) {
      console.error('Error fetching agent counts:', error);
    }
  };

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await apiService.getUsers(params);
      
      if (response.success && Array.isArray(response.data)) {
        setAgents(response.data);
        
        // Fetch real counts for each agent
        await fetchAgentCounts(response.data);
      } else {
        console.warn('Failed to fetch agents from API');
        setAgents([]);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffices = async () => {
    try {
      const response = await apiService.get('/offices');
      if (response.success && Array.isArray(response.data)) {
        setOffices(response.data);
      } else {
        console.warn('Failed to fetch offices from API');
        setOffices([]);
      }
    } catch (error) {
      console.error('Failed to fetch offices:', error);
      setOffices([]);
    }
  };

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (!window.confirm(`A jeni i sigurt që doni të fshini agjentin "${agentName}"?\n\nKjo veprim nuk mund të zhbëhet!`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.message}`);
        // Refresh the agents list
        fetchAgents();
      } else {
        const errorData = await response.json();
        alert(`❌ ${errorData.message || 'Failed to delete agent'}`);
      }
    } catch (error) {
      console.error('Delete agent error:', error);
      alert(`❌ Failed to delete agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('❌ Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('❌ Image size must be less than 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      if (result.success && result.data?.url) {
        setNewAgent({ ...newAgent, avatar: result.data.url });
        alert('✅ Avatar uploaded successfully!');
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert(`❌ Failed to upload avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!newAgent.firstName.trim() || !newAgent.lastName.trim() || !newAgent.email.trim()) {
      alert('❌ Plotësoni të gjitha fushat e detyrueshme.');
      return;
    }

    if (!newAgent.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      alert('❌ Formati i email-it nuk është i saktë.');
      return;
    }

    if (newAgent.password.length < 6) {
      alert('❌ Fjalëkalimi duhet të jetë së paku 6 karaktere.');
      return;
    }

    if (newAgent.password !== newAgent.confirmPassword) {
      alert('❌ Fjalëkalimet nuk përputhen.');
      return;
    }

    setCreating(true);

    try {
      const agentData = {
        firstName: newAgent.firstName,
        lastName: newAgent.lastName,
        email: newAgent.email,
        phone: newAgent.phone || undefined,
        role: newAgent.role,
        officeId: newAgent.officeId || undefined,
        password: newAgent.password,
        avatar: newAgent.avatar || undefined
      };

      const response = await apiService.post('/users', agentData);
      
      if (response.success) {
        alert('✅ Agjenti u krijua me sukses!');
        setShowNewAgentForm(false);
        setNewAgent({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          role: 'AGENT',
          officeId: '',
          password: '',
          confirmPassword: '',
          avatar: ''
        });
        fetchAgents();
      } else {
        alert(`❌ Gabim: ${response.message || 'Nuk mund të krijohet agjenti'}`);
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      alert(`❌ Gabim gjatë krijimit të agentit: ${error instanceof Error ? error.message : 'Nuk mund të krijohet agjenti'}`);
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#059669' : '#6b7280';
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'Aktiv' : 'Joaktiv';
  };

  // Role-based access control
  const canCreateAgents = user?.role === 'SUPER_ADMIN' || user?.role === 'OFFICE_ADMIN';
  const canViewAllAgents = user?.role === 'SUPER_ADMIN' || user?.role === 'OFFICE_ADMIN' || user?.role === 'MANAGER';

  // Filter agents based on user role and status (hide inactive/deleted users)
  const activeAgents = agents.filter(agent => agent.status === 'ACTIVE');
  const filteredAgents = canViewAllAgents ? activeAgents : activeAgents.filter(agent => agent.id === user?.id);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="agents" user={user} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
              Menaxhimi i Agjentëve
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              {loading ? 'Duke ngarkuar...' : `${filteredAgents.length} agjentë gjithsej`}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => fetchAgents()}
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
            
            {canCreateAgents && (
              <button
                onClick={() => setShowNewAgentForm(true)}
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
                Agjent i Ri
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#dbeafe', borderRadius: '0.75rem', padding: '0.75rem' }}>
                <UserIcon style={{ width: '1.5rem', height: '1.5rem', color: '#2563eb' }} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {agents.filter(a => a.role === 'AGENT').length}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Agjentë</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#ecfdf5', borderRadius: '0.75rem', padding: '0.75rem' }}>
                <StarIcon style={{ width: '1.5rem', height: '1.5rem', color: '#059669' }} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {agents.filter(a => a.role === 'MANAGER').length}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Menaxherë</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#fef3c7', borderRadius: '0.75rem', padding: '0.75rem' }}>
                <BuildingOfficeIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {agents.filter(a => a.isActive).length}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Aktivë</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#fef2f2', borderRadius: '0.75rem', padding: '0.75rem' }}>
                <CalendarIcon style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {offices.length}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Zyra</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: showFilters ? '1rem' : '0' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <MagnifyingGlassIcon style={{ 
                position: 'absolute', 
                left: '0.75rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                width: '1rem', 
                height: '1rem', 
                color: '#6b7280' 
              }} />
              <input
                type="text"
                placeholder="Kërko agjentë..."
                value={filters.q}
                onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
                style={{ 
                  width: '100%', 
                  paddingLeft: '2.5rem', 
                  padding: '0.5rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.875rem' 
                }}
              />
            </div>

            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
            >
              <option value="">Të gjitha rolet</option>
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>

            <select
              value={filters.officeId}
              onChange={(e) => setFilters(prev => ({ ...prev, officeId: e.target.value }))}
              style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
            >
              <option value="">Të gjitha zyrat</option>
              {offices.map(office => (
                <option key={office.id} value={office.id}>{office.name}</option>
              ))}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: showFilters ? '#2563eb' : '#f9fafb', 
                color: showFilters ? 'white' : '#6b7280', 
                padding: '0.5rem 1rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              <FunnelIcon style={{ width: '1rem', height: '1rem' }} />
              Filtrat
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem', 
              padding: '1rem', 
              background: '#f9fafb', 
              borderRadius: '0.5rem'
            }}>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              >
                <option value="">Statusi</option>
                <option value="active">Aktiv</option>
                <option value="inactive">Joaktiv</option>
              </select>
            </div>
          )}
        </div>

        {/* Agents Table */}
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', color: '#6b7280' }}>Duke ngarkuar agjentët...</div>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <UserIcon style={{ width: '3rem', height: '3rem', color: '#d1d5db', margin: '0 auto 1rem auto' }} />
              <div style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '0.5rem' }}>Nuk u gjetën agjentë</div>
              <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Provoni të ndryshoni kriteret e kërkimit</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '500', color: '#374151', fontSize: '0.875rem' }}>
                      Agjenti
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '500', color: '#374151', fontSize: '0.875rem' }}>
                      Kontakt
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '500', color: '#374151', fontSize: '0.875rem' }}>
                      Roli
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '500', color: '#374151', fontSize: '0.875rem' }}>
                      Zyra
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '500', color: '#374151', fontSize: '0.875rem' }}>
                      Statusi
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '500', color: '#374151', fontSize: '0.875rem' }}>
                      Aktiviteti
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '500', color: '#374151', fontSize: '0.875rem' }}>
                      Veprime
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent, index) => (
                    <tr key={agent.id} style={{ borderTop: index > 0 ? '1px solid #f3f4f6' : 'none' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ 
                            width: '2.5rem', 
                            height: '2.5rem', 
                            background: agent.avatar ? `url(${agent.avatar})` : '#e5e7eb',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#6b7280',
                            fontSize: '1rem',
                            fontWeight: '500'
                          }}>
                            {!agent.avatar && `${agent.firstName[0]}${agent.lastName[0]}`}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500', color: '#1f2937', fontSize: '0.875rem' }}>
                              {agent.firstName} {agent.lastName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              ID: {agent.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.875rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <EnvelopeIcon style={{ width: '0.875rem', height: '0.875rem', color: '#6b7280' }} />
                            <span style={{ color: '#1f2937' }}>{agent.email}</span>
                          </div>
                          {agent.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <PhoneIcon style={{ width: '0.875rem', height: '0.875rem', color: '#6b7280' }} />
                              <span style={{ color: '#6b7280' }}>{agent.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          background: agent.role === 'SUPER_ADMIN' ? '#fef2f2' : 
                                    agent.role === 'OFFICE_ADMIN' ? '#f3e8ff' :
                                    agent.role === 'MANAGER' ? '#fef3c7' : '#f0f9ff',
                          color: agent.role === 'SUPER_ADMIN' ? '#dc2626' : 
                                agent.role === 'OFFICE_ADMIN' ? '#7c3aed' :
                                agent.role === 'MANAGER' ? '#f59e0b' : '#2563eb',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {formatUserRole(agent.role)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.875rem' }}>
                          <div style={{ color: '#1f2937', fontWeight: '500' }}>
                            {agent.office?.name || 'Pa zyrë'}
                          </div>
                          <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                            {agent.office?.city || '-'}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          background: agent.isActive ? '#f0fdf4' : '#f9fafb',
                          color: getStatusColor(agent.isActive),
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {getStatusLabel(agent.isActive)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.875rem' }}>
                          <div style={{ color: '#1f2937' }}>
                            {agent._count ? `${agent._count.leads + agent._count.opportunities + agent._count.properties + agent._count.transactions} punë` : 'N/A'}
                          </div>
                          <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                            {agent.lastLogin ? new Date(agent.lastLogin).toLocaleDateString('sq-AL') : 'Asnjëherë'}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link
                            href={`/crm/agents/${agent.id}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '1.75rem',
                              height: '1.75rem',
                              background: '#f3f4f6',
                              borderRadius: '0.375rem',
                              textDecoration: 'none'
                            }}
                            title="Shiko detajet"
                          >
                            <EyeIcon style={{ width: '0.875rem', height: '0.875rem', color: '#6b7280' }} />
                          </Link>
                          
                          {(canCreateAgents || agent.id === user?.id) && (
                            <Link
                              href={`/crm/agents/${agent.id}/edit`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '1.75rem',
                                height: '1.75rem',
                                background: '#dbeafe',
                                borderRadius: '0.375rem',
                                textDecoration: 'none'
                              }}
                              title="Ndrysho"
                            >
                              <PencilIcon style={{ width: '0.875rem', height: '0.875rem', color: '#2563eb' }} />
                            </Link>
                          )}

                          {/* Delete Button - Only for admins and not for yourself */}
                          {canCreateAgents && agent.id !== user?.id && (
                            <button
                              onClick={() => handleDeleteAgent(agent.id, `${agent.firstName} ${agent.lastName}`)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '1.75rem',
                                height: '1.75rem',
                                background: '#fee2e2',
                                borderRadius: '0.375rem',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                              }}
                              title="Fshi"
                              onMouseOver={(e) => e.currentTarget.style.background = '#fecaca'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#fee2e2'}
                            >
                              <TrashIcon style={{ width: '0.875rem', height: '0.875rem', color: '#dc2626' }} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create New Agent Modal */}
      {showNewAgentForm && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
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
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                Krijo Agjent të Ri
              </h2>
              <button
                onClick={() => setShowNewAgentForm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <XMarkIcon style={{ width: '1.5rem', height: '1.5rem', color: '#6b7280' }} />
              </button>
            </div>

            <form onSubmit={handleCreateAgent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Emri *
                  </label>
                  <input
                    type="text"
                    value={newAgent.firstName}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, firstName: e.target.value }))}
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
                    value={newAgent.lastName}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newAgent.email}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, email: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Telefoni
                  </label>
                  <input
                    type="tel"
                    value={newAgent.phone}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+355 XX XXX XXXX"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Roli *
                  </label>
                  <select
                    value={newAgent.role}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, role: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Zyra
                  </label>
                  <select
                    value={newAgent.officeId}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, officeId: e.target.value }))}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                  >
                    <option value="">Zgjedh zyrën</option>
                    {offices.map(office => (
                      <option key={office.id} value={office.id}>{office.name} - {office.city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Fjalëkalimi *
                  </label>
                  <input
                    type="password"
                    value={newAgent.password}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, password: e.target.value }))}
                    required
                    minLength={6}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Konfirmo Fjalëkalimin *
                  </label>
                  <input
                    type="password"
                    value={newAgent.confirmPassword}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    minLength={6}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              {/* Avatar Upload */}
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Avatar
                </label>
                
                {/* Current Avatar Preview */}
                {newAgent.avatar && (
                  <div style={{ marginBottom: '1rem' }}>
                    <img 
                      src={newAgent.avatar} 
                      alt="Avatar Preview" 
                      style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        border: '2px solid #e5e7eb'
                      }} 
                    />
                  </div>
                )}
                
                {/* File Upload */}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '0.5rem', 
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem'
                  }} 
                />
                
                {/* Manual URL Input (fallback) */}
                <input 
                  type="url" 
                  value={newAgent.avatar} 
                  onChange={(e) => setNewAgent(prev => ({ ...prev, avatar: e.target.value }))} 
                  placeholder="Or enter image URL manually..." 
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '0.5rem', 
                    fontSize: '0.875rem' 
                  }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  type="button"
                  onClick={() => setShowNewAgentForm(false)}
                  style={{ 
                    flex: 1,
                    background: '#f3f4f6', 
                    color: '#374151', 
                    padding: '0.75rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Anulo
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{ 
                    flex: 1,
                    background: creating ? '#9ca3af' : '#2563eb', 
                    color: 'white', 
                    padding: '0.75rem', 
                    border: 'none', 
                    borderRadius: '0.5rem',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  {creating ? 'Duke krijuar...' : 'Krijo Agjentin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentsPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OFFICE_ADMIN', 'MANAGER', 'AGENT']}>
      <AgentsContent />
    </ProtectedRoute>
  );
}
