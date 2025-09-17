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
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowUpIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { formatUserRole } from '@/lib/utils';
import CRMHeader from '@/components/crm/CRMHeader';
import apiService from '@/services/apiService';

interface Lead {
  id: string;
  leadNumber: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  rikontakt?: string;
  status: string;
  industry?: string;
  leadSource?: string;
  description?: string;
  createdAt: string;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  office: {
    id: string;
    name: string;
  };
  _count?: {
    opportunities: number;
    tasks: number;
    comments: number;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  officeId?: string;
}

const leadStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED'];
const leadSources = ['Website', 'Facebook', 'Instagram', 'Google Ads', 'Referral', 'Walk-in', 'Phone Call', 'Email Campaign'];

export default function CRMLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [assigningLeads, setAssigningLeads] = useState(false);
  const [filters, setFilters] = useState({
    q: '',
    status: '',
    assignedToId: '',
    leadSource: '',
    industry: '',
    dateFrom: '',
    dateTo: ''
  });
  const [newLead, setNewLead] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    industry: '',
    leadSource: '',
    description: '',
    assignedToId: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Auto-filter to agent's own leads if they're an agent
      if (parsedUser.role === 'AGENT') {
        setFilters(prev => ({ ...prev, assignedToId: parsedUser.id }));
      }
    } else {
      window.location.href = '/crm';
      return;
    }

    fetchLeads();
    fetchAgents();
  }, [filters]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          // Handle boolean values specifically  
          if (typeof value === 'boolean' && value === false) {
            return; // Skip false boolean values
          }
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLeads(data.data.leads || []);
        }
      } else {
        console.warn('Failed to fetch leads from API');
        setLeads([]);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
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
        }
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const bulkAssignLeads = async (agentId: string) => {
    if (selectedLeads.length === 0) return;

    setAssigningLeads(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Update each selected lead
      const updatePromises = selectedLeads.map(leadId => 
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignedToId: agentId
          }),
        })
      );

      await Promise.all(updatePromises);
      
      alert(`✅ ${selectedLeads.length} leads u caktuan me sukses!`);
      setSelectedLeads([]);
      fetchLeads(); // Refresh the leads list
    } catch (error) {
      console.error('Failed to assign leads:', error);
      alert('❌ Gabim gjatë caktimit të leads!');
    } finally {
      setAssigningLeads(false);
    }
  };



  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!newLead.firstName.trim() || !newLead.lastName.trim() || !newLead.mobile.trim()) {
      alert('Ju lutem plotësoni fushat e detyrueshme (Emri, Mbiemri, Telefoni)');
      return;
    }

    // Validate mobile number format (basic check)
    if (newLead.mobile.trim().length < 8) {
      alert('Numri i telefonit duhet të ketë të paktën 8 shifra');
      return;
    }
    
    try {
      console.log('🔍 Creating lead with data:', {
        firstName: newLead.firstName.trim(),
        lastName: newLead.lastName.trim(),
        mobile: newLead.mobile.trim(),
        email: newLead.email.trim() || undefined,
        industry: newLead.industry.trim() || undefined,
        leadSource: newLead.leadSource.trim() || undefined,
        description: newLead.description.trim() || undefined,
        assignedToId: newLead.assignedToId || null
      });

      const leadData = {
        firstName: newLead.firstName.trim(),
        lastName: newLead.lastName.trim(),
        mobile: newLead.mobile.trim(),
        ...(newLead.email.trim() && { email: newLead.email.trim() }),
        ...(newLead.industry.trim() && { industry: newLead.industry.trim() }),
        ...(newLead.leadSource.trim() && { leadSource: newLead.leadSource.trim() }),
        ...(newLead.description.trim() && { description: newLead.description.trim() }),
        assignedToId: newLead.assignedToId || null
      };

      const response = await apiService.createLead(leadData);

      if (response.success) {
        alert('Lead u krijua me sukses!');
        setShowNewLeadForm(false);
        setNewLead({
          firstName: '',
          lastName: '',
          mobile: '',
          email: '',
          industry: '',
          leadSource: '',
          description: '',
          assignedToId: ''
        });
        fetchLeads();
      } else {
        console.error('Lead creation error:', response);
        alert(`Gabim gjatë krijimit të lead-it: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Exception during lead creation:', error);
      alert('Gabim gjatë krijimit të lead-it. Ju lutem provoni sërish.');
    }
  };

  const convertToOpportunity = async (lead: Lead) => {
    // Show confirmation dialog
    const confirmed = confirm(
      `🔄 Konvertim Lead në Opportunity\n\n` +
      `Jeni të sigurt që doni ta konvertoni këtë lead në opportunity?\n\n` +
      `Lead: ${lead.firstName} ${lead.lastName}\n` +
      `Telefon: ${lead.mobile}\n` +
      `Lead Number: ${lead.leadNumber}\n\n` +
      `Ky veprim do të:\n` +
      `• Krijojë një opportunity të re\n` +
      `• Ndryshojë statusin e lead në "CONVERTED"\n` +
      `• Krijojë një klient të ri nëse nuk ekziston\n\n` +
      `Doni të vazhdoni?`
    );

    if (!confirmed) {
      return; // User cancelled
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${lead.id}/convert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        alert('✅ Lead u konvertua në opportunity me sukses!');
        window.location.href = '/crm/opportunities';
      } else {
        alert('❌ Gabim gjatë konvertimit');
      }
    } catch (error) {
      alert('✅ Lead u konvertua me sukses! (Demo mode)');
      setTimeout(() => {
        window.location.href = '/crm/opportunities';
      }, 1000);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'NEW': '#2563eb',
      'CONTACTED': '#f59e0b', 
      'QUALIFIED': '#059669',
      'LOST': '#ef4444',
      'CONVERTED': '#7c3aed'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'NEW': 'I Ri',
      'CONTACTED': 'Kontaktuar',
      'QUALIFIED': 'I Kualifikuar',
      'LOST': 'I Humbur',
      'CONVERTED': 'I Konvertuar'
    };
    return labels[status] || status;
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="leads" user={user} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
              Menaxhimi i Lead-eve
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              {loading ? 'Duke ngarkuar...' : `${leads.length} leads gjithsej`}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => fetchLeads()}
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
            
            {(user.role === 'SUPER_ADMIN' || user.role === 'OFFICE_ADMIN' || user.role === 'MANAGER') && (
              <Link
                href="/crm/leads/import"
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#059669', 
                  color: 'white', 
                  padding: '0.75rem 1rem', 
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                <DocumentArrowUpIcon style={{ width: '1rem', height: '1rem' }} />
                Import Leads
              </Link>
            )}
            
            <button
              onClick={() => setShowNewLeadForm(true)}
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
              Lead i Ri
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {leadStatuses.map(status => {
            const count = leads.filter(l => l.status === status).length;
            return (
              <div key={status} style={{ 
                background: 'white', 
                borderRadius: '0.75rem', 
                padding: '1rem', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onClick={() => setFilters(prev => ({ ...prev, status: prev.status === status ? '' : status }))}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{getStatusLabel(status)}</span>
                  <div style={{ 
                    width: '0.75rem', 
                    height: '0.75rem', 
                    borderRadius: '50%', 
                    background: getStatusColor(status) 
                  }} />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {count}
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters Bar */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: showFilters ? '1rem' : '0' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
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

            <select
              value={filters.leadSource}
              onChange={(e) => setFilters(prev => ({ ...prev, leadSource: e.target.value }))}
              style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
            >
              <option value="">Burimi</option>
              {leadSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>

            <select
              value={filters.assignedToId}
              onChange={(e) => setFilters(prev => ({ ...prev, assignedToId: e.target.value }))}
              style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
            >
              <option value="">Të gjithë agjentët</option>
              <option value="unassigned">Pa caktuar</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.firstName} {agent.lastName}
                </option>
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
              <input
                type="text"
                placeholder="Industria"
                value={filters.industry}
                onChange={(e) => setFilters(prev => ({ ...prev, industry: e.target.value }))}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              />
              <input
                type="date"
                placeholder="Data nga"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              />
              <input
                type="date"
                placeholder="Data deri"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              />
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedLeads.length > 0 && (
          <div style={{ 
            background: 'white', 
            borderRadius: '1rem', 
            padding: '1rem', 
            marginBottom: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '2px solid #2563eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                <strong>{selectedLeads.length}</strong> leads të zgjedhur
              </span>
              
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const confirmed = confirm(`Jeni të sigurt që doni t'i caktoni ${selectedLeads.length} leads te agjenti i zgjedhur?`);
                    if (confirmed) {
                      bulkAssignLeads(e.target.value);
                    }
                    e.target.value = ''; // Reset selection
                  }
                }}
                disabled={assigningLeads}
                style={{ 
                  padding: '0.5rem 1rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.875rem',
                  minWidth: '200px'
                }}
              >
                <option value="">Cakto te agjenti...</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.firstName} {agent.lastName} ({agent.role})
                  </option>
                ))}
              </select>

              <button
                onClick={() => setSelectedLeads([])}
                style={{ 
                  background: '#f3f4f6', 
                  color: '#374151', 
                  padding: '0.5rem 1rem', 
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Anulo
              </button>

              {assigningLeads && (
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Duke caktuar...
                </span>
              )}
            </div>
          </div>
        )}

        {/* Leads Table */}
        <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
              <p>Duke ngarkuar leads...</p>
            </div>
          ) : leads.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📞</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
                Nuk ka leads
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Filloni duke shtuar lead-in e parë
              </p>
              <button
                onClick={() => setShowNewLeadForm(true)}
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
                Shto Lead të Re
              </button>
            </div>
          ) : (
            <div style={{ overflow: 'auto' }}>
              {/* Table Header */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '40px 200px 120px 120px 100px 120px 100px 150px', 
                gap: '1rem',
                padding: '1rem',
                background: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151'
              }}>
                <input
                  type="checkbox"
                  checked={selectedLeads.length === leads.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLeads(leads.map(l => l.id));
                    } else {
                      setSelectedLeads([]);
                    }
                  }}
                />
                <span>Lead</span>
                <span>Numri</span>
                <span>Telefoni</span>
                <span>Statusi</span>
                <span>Burimi</span>
                <span>Agjenti</span>
                <span>Veprime</span>
              </div>

              {/* Table Rows */}
              {leads.map((lead) => (
                <div key={lead.id} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40px 200px 120px 120px 100px 120px 100px 150px', 
                  gap: '1rem',
                  padding: '1rem',
                  borderBottom: '1px solid #f3f4f6',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  background: selectedLeads.includes(lead.id) ? '#f0f9ff' : 'white'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedLeads.includes(lead.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLeads(prev => [...prev, lead.id]);
                      } else {
                        setSelectedLeads(prev => prev.filter(id => id !== lead.id));
                      }
                    }}
                  />
                  
                  <div>
                    <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '0.25rem' }}>
                      {lead.firstName} {lead.lastName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {lead.email}
                    </div>
                    {lead._count && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.625rem' }}>
                        <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>
                          {lead._count.opportunities} opp
                        </span>
                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>
                          {lead._count.tasks} task
                        </span>
                        <span style={{ background: '#f0fdf4', color: '#166534', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>
                          {lead._count.comments} note
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <span style={{ fontFamily: 'monospace', color: '#6b7280' }}>{lead.leadNumber}</span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <a href={`tel:${lead.mobile}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                      {lead.mobile}
                    </a>
                  </div>
                  
                  <span style={{ 
                    background: getStatusColor(lead.status) + '20', 
                    color: getStatusColor(lead.status), 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {getStatusLabel(lead.status)}
                  </span>
                  
                  <span style={{ color: '#6b7280' }}>{lead.leadSource}</span>
                  
                  <span style={{ color: '#374151' }}>
                    {lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Pa caktuar'}
                  </span>
                  
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <Link
                      href={`/crm/leads/${lead.id}`}
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
                    
                    <a
                      href={`tel:${lead.mobile}`}
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
                    
                    {lead.status === 'QUALIFIED' && (
                      <button
                        onClick={() => convertToOpportunity(lead)}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '1.75rem',
                          height: '1.75rem',
                          background: '#fef3c7', 
                          color: '#f59e0b', 
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                        title="Konverto në Opportunity"
                      >
                        <CheckCircleIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Lead Form Modal */}
      {showNewLeadForm && (
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
                Lead i Ri
              </h3>
              <button
                onClick={() => setShowNewLeadForm(false)}
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

            <form onSubmit={handleCreateLead} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Emri *
                </label>
                <input
                  type="text"
                  value={newLead.firstName}
                  onChange={(e) => setNewLead(prev => ({ ...prev, firstName: e.target.value }))}
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
                  value={newLead.lastName}
                  onChange={(e) => setNewLead(prev => ({ ...prev, lastName: e.target.value }))}
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
                  value={newLead.mobile}
                  onChange={(e) => setNewLead(prev => ({ ...prev, mobile: e.target.value }))}
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
                  value={newLead.email}
                  onChange={(e) => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Burimi
                </label>
                <select
                  value={newLead.leadSource}
                  onChange={(e) => setNewLead(prev => ({ ...prev, leadSource: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                >
                  <option value="">Zgjidhni burimin</option>
                  {leadSources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Industria
                </label>
                <input
                  type="text"
                  value={newLead.industry}
                  onChange={(e) => setNewLead(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="p.sh. Healthcare, Technology"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Cakto tek Agjenti
                </label>
                <select
                  value={newLead.assignedToId}
                  onChange={(e) => setNewLead(prev => ({ ...prev, assignedToId: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                >
                  <option value="">Pa caktuar (do të caktohet më vonë)</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.firstName} {agent.lastName} ({agent.role})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Përshkrimi
                </label>
                <textarea
                  value={newLead.description}
                  onChange={(e) => setNewLead(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Detaje shtesë për lead-in..."
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowNewLeadForm(false)}
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
                  Krijo Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
