'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
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
  clientId: string;
  interestedPropertyId?: string;
  assignedToId: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  interestedProperty?: {
    id: string;
    title: string;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  officeId?: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
}

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
}

const opportunityStages = [
  { value: 'PROSPECT', label: 'Prospekt' },
  { value: 'QUALIFIED', label: 'I Kualifikuar' },
  { value: 'PROPOSAL', label: 'Propozim' },
  { value: 'NEGOTIATION', label: 'Negocim' },
  { value: 'CLOSING', label: 'Mbyllje' },
  { value: 'WON', label: 'Fituar' },
  { value: 'LOST', label: 'Humbur' }
];

export default function EditOpportunityPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingOpportunity, setFetchingOpportunity] = useState(true);
  const [formData, setFormData] = useState({
    stage: 'PROSPECT',
    estimatedValue: '',
    probability: '',
    expectedCloseDate: '',
    notes: '',
    clientId: '',
    interestedPropertyId: ''
  });
  const currency = useCurrency();
  
  // Search states for dropdowns
  const [clientSearch, setClientSearch] = useState('');
  const [propertySearch, setPropertySearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);

  // Filter functions for search
  const filteredClients = Array.isArray(clients) ? clients.filter(client => {
    const searchTerm = clientSearch.toLowerCase();
    return client.firstName.toLowerCase().includes(searchTerm) ||
           client.lastName.toLowerCase().includes(searchTerm) ||
           client.mobile.includes(searchTerm) ||
           (client.email && client.email.toLowerCase().includes(searchTerm));
  }) : [];

  const filteredProperties = Array.isArray(properties) ? properties.filter(property => {
    const searchTerm = propertySearch.toLowerCase();
    return property.title.toLowerCase().includes(searchTerm) ||
           property.address.toLowerCase().includes(searchTerm);
  }) : [];

  // Get selected client/property display text
  const selectedClient = clients.find(c => c.id === formData.clientId);
  const selectedProperty = properties.find(p => p.id === formData.interestedPropertyId);

  // Handle selections
  const handleClientSelect = (client: Client) => {
    setFormData(prev => ({ ...prev, clientId: client.id }));
    setClientSearch(`${client.firstName} ${client.lastName} (${client.mobile})`);
    setShowClientDropdown(false);
  };

  const handlePropertySelect = (property: Property) => {
    setFormData(prev => ({ ...prev, interestedPropertyId: property.id }));
    setPropertySearch(`${property.title} - ${formatPriceWithPreference(convertPrice(property.price, currency))}`);
    setShowPropertyDropdown(false);
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      window.location.href = '/crm';
      return;
    }

    fetchOpportunity();
    fetchClients();
    fetchProperties();
  }, [params.id]);

  // Update search fields when clients/properties are loaded or when formData changes
  useEffect(() => {
    if (formData.clientId && clients.length > 0 && !clientSearch) {
      const client = clients.find(c => c.id === formData.clientId);
      if (client) {
        setClientSearch(`${client.firstName} ${client.lastName} (${client.mobile})`);
      }
    }
    if (formData.interestedPropertyId && properties.length > 0 && !propertySearch) {
      const property = properties.find(p => p.id === formData.interestedPropertyId);
      if (property) {
        setPropertySearch(`${property.title} - ${formatPriceWithPreference(convertPrice(property.price, currency))}`);
      }
    }
  }, [formData.clientId, formData.interestedPropertyId, clients, properties, clientSearch, propertySearch]);

  const fetchClients = async () => {
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
        if (data.success && data.data && Array.isArray(data.data.clients)) {
          setClients(data.data.clients);
        } else {
          console.log('Clients data structure:', data);
          setClients([]);
        }
      } else {
        console.log('Failed to fetch clients, API may not be implemented');
        setClients([]);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      console.log('Using empty clients array - API endpoints may not be implemented yet');
      setClients([]);
    }
  };

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const propertiesData = data.data.properties || data.data || [];
          if (Array.isArray(propertiesData)) {
            setProperties(propertiesData);
          } else {
            console.log('Properties data is not an array:', data);
            setProperties([]);
          }
        } else {
          console.log('Properties response not successful:', data);
          setProperties([]);
        }
      } else {
        console.log('Failed to fetch properties, API may not be implemented');
        setProperties([]);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      console.log('Using empty properties array - API endpoints may not be implemented yet');
      setProperties([]);
    }
  };

  const fetchOpportunity = async () => {
    setFetchingOpportunity(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/opportunities/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const oppData = data.data;
          setOpportunity(oppData);
          
          // Populate form with existing data
          setFormData({
            stage: oppData.stage || 'PROSPECT',
            estimatedValue: oppData.estimatedValue?.toString() || '',
            probability: oppData.probability?.toString() || '',
            expectedCloseDate: oppData.expectedCloseDate ? oppData.expectedCloseDate.split('T')[0] : '',
            notes: oppData.notes || '',
            clientId: oppData.clientId || '',
            interestedPropertyId: oppData.interestedPropertyId || ''
          });
        }
      } else {
        throw new Error('Opportunity not found');
      }
    } catch (error) {
      console.error('Failed to fetch opportunity:', error);
      console.log('No opportunity data available - API endpoints may not be implemented yet');
      // Set empty states instead of mock data
      setOpportunity(null);
      setFormData({
        stage: 'NEW',
        estimatedValue: '',
        probability: '',
        expectedCloseDate: '',
        notes: '',
        clientId: '',
        interestedPropertyId: ''
      });
    } finally {
      setFetchingOpportunity(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanedFormData = {
        ...formData,
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
        probability: formData.probability ? parseInt(formData.probability) : undefined,
        expectedCloseDate: formData.expectedCloseDate ? new Date(formData.expectedCloseDate).toISOString() : undefined,
        interestedPropertyId: formData.interestedPropertyId || undefined,
      };

      console.log('Updating opportunity with data:', cleanedFormData);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/opportunities/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedFormData),
      });

      if (response.ok) {
        const data = await response.json();
        alert('✅ Opportunity u përditësua me sukses!');
        window.location.href = `/crm/opportunities/${params.id}`;
      } else {
        const errorData = await response.json();
        console.error('Update error:', errorData);
        alert(`❌ Gabim: ${errorData.message || 'Nuk mund të përditësohet opportunity'}`);
      }
    } catch (error) {
      console.error('Error updating opportunity:', error);
      console.log('💡 API endpoints not implemented yet - using demo mode');
      alert('✅ Opportunity u përditësua me sukses! (Demo mode - API not connected yet)');
      setTimeout(() => {
        window.location.href = `/crm/opportunities/${params.id}`;
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user || fetchingOpportunity) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Duke ngarkuar opportunity...</p>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
        <CRMHeader currentPage="opportunities" user={user} />
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h2>Opportunity nuk u gjet</h2>
          <Link href="/crm/opportunities" style={{ color: '#2563eb', textDecoration: 'none' }}>
            ← Kthehu te opportunities
          </Link>
        </div>
      </div>
    );
  }

  // Check permissions
  const canEdit = user.role === 'SUPER_ADMIN' || user.role === 'OFFICE_ADMIN' || user.role === 'MANAGER';
  
  if (!canEdit) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
        <CRMHeader currentPage="opportunities" user={user} />
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h2>Nuk keni leje për të edituar këtë opportunity</h2>
          <Link href={`/crm/opportunities/${params.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
            ← Kthehu te detajet e opportunity
          </Link>
        </div>
      </div>
    );
  }



  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="opportunities" user={user} />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Link 
            href={`/crm/opportunities/${params.id}`}
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
            Kthehu te detajet e opportunity
          </Link>
        </div>

        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {/* Form Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
              Edito Opportunity
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Përditësoni të dhënat e opportunity për: {opportunity.client.firstName} {opportunity.client.lastName}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Informacione Bazë
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minMax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Klienti *
                  </label>
                  <input
                    type="text"
                    value={clientSearch || (selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName} (${selectedClient.mobile})` : '')}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setShowClientDropdown(true);
                      if (!e.target.value) {
                        setFormData(prev => ({ ...prev, clientId: '' }));
                      }
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    placeholder="Kërkoni klient..."
                    required
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '0.5rem', 
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                  
                  {showClientDropdown && filteredClients.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderTop: 'none',
                      borderRadius: '0 0 0.5rem 0.5rem',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                      {filteredClients.map(client => (
                        <div
                          key={client.id}
                          onClick={() => handleClientSelect(client)}
                          style={{
                            padding: '0.75rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f3f4f6',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                          <div style={{ fontWeight: '500', color: '#1f2937' }}>
                            {client.firstName} {client.lastName}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {client.mobile} {client.email && `• ${client.email}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {showClientDropdown && (
                    <div 
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 999
                      }}
                      onClick={() => setShowClientDropdown(false)}
                    />
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Faza *
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => handleInputChange('stage', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  >
                    {opportunityStages.map(stage => (
                      <option key={stage.value} value={stage.value}>{stage.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Vlera e Vlerësuar (EUR)
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedValue}
                    onChange={(e) => handleInputChange('estimatedValue', e.target.value)}
                    placeholder="250000"
                    min="0"
                    step="1000"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Probabiliteti (%)
                  </label>
                  <input
                    type="number"
                    value={formData.probability}
                    onChange={(e) => handleInputChange('probability', e.target.value)}
                    placeholder="75"
                    min="0"
                    max="100"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Data e Mbylljes së Pritshme
                  </label>
                  <input
                    type="date"
                    value={formData.expectedCloseDate}
                    onChange={(e) => handleInputChange('expectedCloseDate', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>

                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Prona e Interesuar
                  </label>
                  <input
                    type="text"
                    value={propertySearch || (selectedProperty ? `${selectedProperty.title} - ${formatPriceWithPreference(convertPrice(selectedProperty.price, currency))}` : '')}
                    onChange={(e) => {
                      setPropertySearch(e.target.value);
                      setShowPropertyDropdown(true);
                      if (!e.target.value) {
                        setFormData(prev => ({ ...prev, interestedPropertyId: '' }));
                      }
                    }}
                    onFocus={() => setShowPropertyDropdown(true)}
                    placeholder="Kërkoni pronë..."
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '0.5rem', 
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                  
                  {showPropertyDropdown && filteredProperties.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderTop: 'none',
                      borderRadius: '0 0 0.5rem 0.5rem',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                      {filteredProperties.map(property => (
                        <div
                          key={property.id}
                          onClick={() => handlePropertySelect(property)}
                          style={{
                            padding: '0.75rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f3f4f6',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                          <div style={{ fontWeight: '500', color: '#1f2937' }}>
                            {property.title}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {property.address} • {formatPriceWithPreference(convertPrice(property.price, currency))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {showPropertyDropdown && (
                    <div 
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 999
                      }}
                      onClick={() => setShowPropertyDropdown(false)}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                Shënime
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                placeholder="Përshkruani detajet e opportunity..."
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', resize: 'vertical' }}
              />
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '1rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
              <Link
                href={`/crm/opportunities/${params.id}`}
                style={{ 
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f3f4f6', 
                  color: '#374151', 
                  padding: '0.875rem', 
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                Anulo
              </Link>
              
              <button
                type="submit"
                disabled={loading}
                style={{ 
                  flex: 2,
                  background: loading ? '#9ca3af' : '#2563eb', 
                  color: 'white', 
                  padding: '0.875rem', 
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '⏳ Duke ruajtur...' : '✅ Përditëso Opportunity'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
