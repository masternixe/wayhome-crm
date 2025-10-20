'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  MagnifyingGlassIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  preferredCurrency?: string;
}

interface ClientAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (client: Client) => void;
  currentClient?: Client | null;
  propertyTitle: string;
}

export default function ClientAssignmentModal({ 
  isOpen, 
  onClose, 
  onAssign, 
  currentClient, 
  propertyTitle 
}: ClientAssignmentModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(currentClient || null);

  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Support both shapes: data (array) or data.clients (array)
          const list = Array.isArray(data.data)
            ? data.data
            : (Array.isArray(data.data?.clients) ? data.data.clients : []);
          setClients(list);
        } else {
          setClients([]);
        }
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      setClients([]);

    } finally {
      setLoading(false);
    }
  };

  const filteredClients = (Array.isArray(clients) ? clients : []).filter(client => {
    const query = searchQuery.toLowerCase();
    return (
      client.firstName.toLowerCase().includes(query) ||
      client.lastName.toLowerCase().includes(query) ||
      client.mobile.includes(query) ||
      (client.email && client.email.toLowerCase().includes(query))
    );
  });

  const handleAssign = () => {
    if (selectedClient) {
      onAssign(selectedClient);
      onClose();
    }
  };

  const handleRemoveClient = () => {
    setSelectedClient(null);
    onAssign(null as any); // Remove client assignment
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'rgba(0, 0, 0, 0.5)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      zIndex: 1000,
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '1rem', 
        width: '90%', 
        maxWidth: '600px', 
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '1.5rem', 
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
              Cakto Pronar për Pronën
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0 0 0' }}>
              {propertyTitle}
            </p>
          </div>
          
          <button
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              color: '#6b7280'
            }}
          >
            <XMarkIcon style={{ width: '1.5rem', height: '1.5rem' }} />
          </button>
        </div>

        {/* Current Client */}
        {currentClient && (
          <div style={{ 
            padding: '1rem 1.5rem', 
            background: '#f9fafb',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.5rem' }}>
              Pronari Aktual:
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '0.75rem',
              background: 'white',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  background: '#dbeafe', 
                  color: '#2563eb',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>
                <div>
                  <div style={{ fontWeight: '500', color: '#1f2937' }}>
                    {currentClient.firstName} {currentClient.lastName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {currentClient.mobile}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleRemoveClient}
                style={{ 
                  background: '#fef2f2', 
                  color: '#dc2626', 
                  border: '1px solid #fecaca',
                  padding: '0.375rem 0.75rem', 
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                Hiq Pronarin
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ position: 'relative' }}>
            <MagnifyingGlassIcon style={{ 
              position: 'absolute', 
              left: '1rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              width: '1.25rem', 
              height: '1.25rem', 
              color: '#9ca3af' 
            }} />
            <input
              type="text"
              placeholder="Kërko klient sipas emrit, telefonit ose email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem 0.75rem 3rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.5rem', 
                fontSize: '1rem'
              }}
            />
          </div>
        </div>

        {/* Clients List */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '1rem 1.5rem'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
              <p>Duke ngarkuar klientët...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <UserIcon style={{ width: '3rem', height: '3rem', color: '#d1d5db', margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#1f2937' }}>
                {searchQuery ? 'Asnjë rezultat' : 'Asnjë klient'}
              </h3>
              <p style={{ margin: '0 0 1rem 0' }}>
                {searchQuery 
                  ? 'Provoni një kërkesë tjetër.' 
                  : 'Krijoni klientin e parë për të filluar.'
                }
              </p>
              <button
                onClick={() => window.open('/crm/clients/new', '_blank')}
                style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#2563eb', 
                  color: 'white', 
                  padding: '0.5rem 1rem', 
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                Krijo Pronar të Ri
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: selectedClient?.id === client.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    background: selectedClient?.id === client.id ? '#f0f9ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedClient?.id !== client.id) {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedClient?.id !== client.id) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                >
                  <div style={{ 
                    width: '3rem', 
                    height: '3rem', 
                    background: selectedClient?.id === client.id ? '#dbeafe' : '#f3f4f6', 
                    color: selectedClient?.id === client.id ? '#2563eb' : '#6b7280',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <UserIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '0.25rem' }}>
                      {client.firstName} {client.lastName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <PhoneIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                        {client.mobile}
                      </div>
                      {client.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <EnvelopeIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                          {client.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {client.preferredCurrency && (
                    <div style={{ 
                      padding: '0.25rem 0.5rem',
                      background: '#f0fdf4',
                      color: '#059669',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {client.preferredCurrency}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '1.5rem', 
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{ 
              background: '#f3f4f6', 
              color: '#374151', 
              padding: '0.75rem 1.5rem', 
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Anulo
          </button>
          
          <button
            onClick={handleAssign}
            disabled={!selectedClient}
            style={{ 
              background: selectedClient ? '#2563eb' : '#9ca3af', 
              color: 'white', 
              padding: '0.75rem 1.5rem', 
              border: 'none',
              borderRadius: '0.5rem',
              cursor: selectedClient ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem'
            }}
          >
            {currentClient ? 'Ndrysho Pronarin' : 'Cakto Pronarin'}
          </button>
        </div>
      </div>
    </div>
  );
}
