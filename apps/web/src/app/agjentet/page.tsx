'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/solid';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  office?: {
    id: string;
    name: string;
    city: string;
  };
}

export default function AgjentetPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: '',
    city: '',
  });

  useEffect(() => {
    fetchAgents();
  }, [filters]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      // Fetch agents from PUBLIC API (no authentication needed)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/agents`);

      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }

      const data = await response.json();
      let agents: Agent[] = [];
      
      if (data.success && data.data) {
        // Transform API data to match Agent interface
        agents = data.data.map((user: any) => ({
          id: user.id,
          firstName: user.firstName === 'Super' && user.lastName === 'Admin' ? 'Wayhome Real Estate' : user.firstName,
          lastName: user.firstName === 'Super' && user.lastName === 'Admin' ? 'Zyra' : user.lastName,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          office: user.office || (user.firstName === 'Super' && user.lastName === 'Admin' ? {
            id: 'default',
            name: 'Wayhome Real Estate Zyra',
            city: 'Tirana'
          } : null),
        }));
      }

      // Apply filters
      let filteredAgents = agents;
      
      if (filters.q) {
        filteredAgents = filteredAgents.filter(agent => 
          `${agent.firstName} ${agent.lastName}`.toLowerCase().includes(filters.q.toLowerCase()) ||
          agent.email.toLowerCase().includes(filters.q.toLowerCase()) ||
          agent.phone?.includes(filters.q)
        );
      }
      
      if (filters.city) {
        filteredAgents = filteredAgents.filter(agent => agent.office?.city === filters.city);
      }

      // Sort alphabetically by name
      filteredAgents.sort((a, b) => {
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      });

      setAgents(filteredAgents);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      {/* Page Header */}
      <section style={{ background: 'linear-gradient(135deg, #ffa500 0%, #ff6b35 100%)', color: 'white', padding: '3rem 1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem', margin: '0 0 1rem 0' }}>
            Agjentët Tanë
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, margin: 0 }}>
            Kontaktoni drejtpërdrejt me ekspertët tanë të pasurive të patundshme
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Search and Filters */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Kërkoni për emër, email ose telefon..."
                value={filters.q}
                onChange={(e) => handleFilterChange('q', e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem 0.75rem 2.5rem', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '0.75rem', 
                  fontSize: '1rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <MagnifyingGlassIcon style={{ 
                position: 'absolute', 
                left: '0.75rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                width: '1.25rem', 
                height: '1.25rem', 
                color: '#6b7280' 
              }} />
            </div>

            <div>
              <select
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '0.75rem', fontSize: '1rem' }}
              >
                <option value="">Të gjitha zyrat</option>
                <option value="Tirana">Tirana</option>
                <option value="Durrës">Durrës</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1rem', color: '#6b7280' }}>
            {loading ? 'Duke kërkuar...' : `${agents.length} agjentë të gjetur`}
          </div>
        </div>



        {/* Agents Grid */}
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937', textAlign: 'center' }}>
            Agjentët Tanë
          </h2>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ background: '#f3f4f6', borderRadius: '1rem', height: '300px', animation: 'pulse 2s infinite' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {agents.map((agent) => (
                <Link 
                  key={agent.id} 
                  href={`/agjentet/${agent.id}`}
                  style={{ 
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'block'
                  }}
                >
                  <div style={{ 
                    background: 'white', 
                    borderRadius: '1rem', 
                    padding: '2rem', 
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    textAlign: 'center',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  }}
                  >
                  {/* Agent Avatar */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    {agent.avatar ? (
                      <img 
                        src={agent.avatar} 
                        alt={`${agent.firstName} ${agent.lastName}`} 
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          margin: '0 auto'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ffa500, #ff6b35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                        color: 'white',
                        fontWeight: 'bold',
                        margin: '0 auto'
                      }}>
                        {agent.firstName[0]}{agent.lastName[0]}
                      </div>
                    )}
                  </div>

                  {/* Agent Name */}
                  <h3 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold', 
                    marginBottom: '0.5rem', 
                    color: '#1f2937',
                    margin: '0 0 0.5rem 0'
                  }}>
                    {agent.firstName} {agent.lastName}
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#f59e0b',
                    fontWeight: '500',
                    margin: '0 0 0.5rem 0'
                  }}>
                    {agent.firstName === 'Wayhome Real Estate' && agent.lastName === 'Zyra' ? 'Përfaqësues i Wayhome Real Estate' : 'Agjent i Pasurive të Patundshme'}
                  </p>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    margin: '0 0 1rem 0'
                  }}>
                    {agent.office?.name} • {agent.office?.city}
                  </p>

                  {/* Contact Info */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      color: '#6b7280',
                      fontSize: '0.875rem'
                    }}>
                      <EnvelopeIcon style={{ width: '1rem', height: '1rem' }} />
                      <span>{agent.email}</span>
                    </div>
                    {agent.phone && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '0.5rem',
                        color: '#6b7280',
                        fontSize: '0.875rem'
                      }}>
                        <PhoneIcon style={{ width: '1rem', height: '1rem' }} />
                        <span>{agent.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    {agent.phone && (
                      <a
                        href={`tel:${agent.phone}`}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          gap: '0.5rem', 
                          background: '#ffa500', 
                          color: 'white', 
                          padding: '0.75rem 1.5rem', 
                          borderRadius: '0.75rem', 
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e69500'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffa500'}
                      >
                        <PhoneIcon style={{ width: '1rem', height: '1rem' }} />
                        Telefono
                      </a>
                    )}
                    <a
                      href={`mailto:${agent.email}`}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '0.5rem', 
                        background: 'white', 
                        color: '#ffa500', 
                        padding: '0.75rem 1.5rem', 
                        borderRadius: '0.75rem', 
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        border: '2px solid #ffa500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffa500';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.color = '#ffa500';
                      }}
                    >
                      <EnvelopeIcon style={{ width: '1rem', height: '1rem' }} />
                      Email
                    </a>
                  </div>
                </div>
                </Link>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && agents.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
                Nuk u gjetën agjentë
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Provoni të ndryshoni kriteret e kërkimit
              </p>
            </div>
          )}


        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
