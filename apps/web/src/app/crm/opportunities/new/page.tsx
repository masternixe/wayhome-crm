'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import CRMHeader from '@/components/crm/CRMHeader';

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

export default function NewOpportunityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    stage: 'PROSPECT',
    estimatedValue: '',
    probability: '',
    expectedCloseDate: '',
    notes: '',
    clientId: '',
    interestedPropertyId: '',
    assignedToId: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Set default assignee to current user
      setFormData(prev => ({ ...prev, assignedToId: parsedUser.id }));
    } else {
      window.location.href = '/crm';
      return;
    }

    fetchClients();
    fetchProperties();
  }, []);

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
        console.log('🔍 Clients API Response:', data);
        
        if (data.success && data.data) {
          // The clients API returns { success: true, data: { clients: [...], pagination: {...} } }
          const clientsArray = data.data.clients || data.data;
          if (Array.isArray(clientsArray)) {
            console.log('✅ Setting clients:', clientsArray.length, 'clients found');
            setClients(clientsArray);
          } else {
            console.warn('❌ Clients data is not an array:', data.data);
            setClients([]);
          }
        } else {
          console.warn('❌ API response not successful:', data);
          setClients([]);
        }
      } else {
        console.error('❌ HTTP Error:', response.status, response.statusText);
        setClients([]);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
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
        if (data.success && data.data && Array.isArray(data.data.properties)) {
          setProperties(data.data.properties);
        } else {
          setProperties([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      setProperties([]);
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

      console.log('Creating opportunity with data:', cleanedFormData);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/opportunities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedFormData),
      });

      if (response.ok) {
        const data = await response.json();
        alert('✅ Opportunity u krijua me sukses!');
        window.location.href = '/crm/opportunities';
      } else {
        const errorData = await response.json();
        console.error('Creation error:', errorData);
        alert(`❌ Gabim: ${errorData.message || 'Nuk mund të krijohet opportunity'}`);
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
      alert(`❌ Gabim gjatë krijimit të opportunity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Duke ngarkuar...</p>
      </div>
    );
  }

  // Check permissions
  const canCreate = user.role === 'SUPER_ADMIN' || user.role === 'OFFICE_ADMIN' || user.role === 'MANAGER';
  
  if (!canCreate) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
        <CRMHeader currentPage="opportunities" user={user} />
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h2>Nuk keni leje për të krijuar opportunity</h2>
          <Link href="/crm/opportunities" style={{ color: '#2563eb', textDecoration: 'none' }}>
            ← Kthehu te opportunities
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sq-AL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="opportunities" user={user} />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Link 
            href="/crm/opportunities"
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
            Kthehu te opportunities
          </Link>
        </div>

        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {/* Form Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
              Krijo Opportunity të Re
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Shtoni një mundësi të re biznesi për t'u ndjekur përgjatë procesit të shitjes.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Informacione Bazë
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minMax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Klienti *
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => handleInputChange('clientId', e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  >
                    <option value="">Zgjidhni klientin...</option>
                    {Array.isArray(clients) && clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.firstName} {client.lastName} ({client.mobile})
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Nëse nuk shihni klientin që kërkohet, <Link href="/crm/clients/new" style={{ color: '#2563eb' }}>krijoni një të ri</Link>.
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Faza Fillestare *
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => handleInputChange('stage', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  >
                    {Array.isArray(opportunityStages) && opportunityStages.map(stage => (
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
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Vlera e pritshme e shitjes.
                  </div>
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
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Sa përqind mundësi keni për ta mbyllur këtë shitje?
                  </div>
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
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Kur prisni ta finalizoni këtë shitje?
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Prona e Interesuar
                  </label>
                  <select
                    value={formData.interestedPropertyId}
                    onChange={(e) => handleInputChange('interestedPropertyId', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  >
                    <option value="">Asnjë pronë e specifikuar...</option>
                    {Array.isArray(properties) && properties.map(property => (
                      <option key={property.id} value={property.id}>
                        {property.title} - {formatCurrency(property.price)}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Opsionale - zgjidhni nëse ka një pronë specifike.
                  </div>
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
                placeholder="Përshkruani detajet e opportunity, interesin e klientit, kushtet e diskutuara, etj..."
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', resize: 'vertical' }}
              />
            </div>

            {/* Preview */}
            {(formData.clientId || formData.estimatedValue || formData.probability) && (
              <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f0f9ff', borderRadius: '0.75rem', border: '1px solid #bfdbfe' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.5rem' }}>
                  🔍 Parashikim i Opportunity
                </h3>
                <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                  {formData.clientId && (
                    <p style={{ margin: '0 0 0.25rem 0' }}>
                      <strong>Klient:</strong> {clients.find(c => c.id === formData.clientId)?.firstName} {clients.find(c => c.id === formData.clientId)?.lastName}
                    </p>
                  )}
                  {formData.estimatedValue && (
                    <p style={{ margin: '0 0 0.25rem 0' }}>
                      <strong>Vlera:</strong> {formatCurrency(parseFloat(formData.estimatedValue))}
                    </p>
                  )}
                  {formData.probability && (
                    <p style={{ margin: '0 0 0.25rem 0' }}>
                      <strong>Probabiliteti:</strong> {formData.probability}%
                    </p>
                  )}
                  <p style={{ margin: 0 }}>
                    <strong>Faza:</strong> {opportunityStages.find(s => s.value === formData.stage)?.label}
                  </p>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '1rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
              <Link
                href="/crm/opportunities"
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
                disabled={loading || !formData.clientId}
                style={{ 
                  flex: 2,
                  background: (loading || !formData.clientId) ? '#9ca3af' : '#2563eb', 
                  color: 'white', 
                  padding: '0.875rem', 
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: (loading || !formData.clientId) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '⏳ Duke krijuar...' : '✅ Krijo Opportunity'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
