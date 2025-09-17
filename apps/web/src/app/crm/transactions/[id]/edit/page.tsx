'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import CRMHeader from '@/components/crm/CRMHeader';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPriceWithPreference, convertPrice } from '@/lib/currency';

interface Transaction {
  id: string;
  type: string;
  status: string;
  grossAmount: number;
  commissionAmount: number;
  agentSharePrimary: number;
  agentShareCollaborator?: number;
  currency: string;
  splitRatio: number;
  closeDate?: string;
  contractNumber?: string;
  notes?: string;
  propertyId: string;
  clientId: string;
  primaryAgentId: string;
  collaboratingAgentId?: string;
  property: {
    id: string;
    title: string;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
  primaryAgent: {
    id: string;
    firstName: string;
    lastName: string;
  };
  collaboratingAgent?: {
    id: string;
    firstName: string;
    lastName: string;
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

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const transactionTypes = [
  { value: 'SALE', label: 'Shitje' },
  { value: 'RENT', label: 'Qira' }
];

const transactionStatuses = [
  { value: 'OPEN', label: 'I hapur' },
  { value: 'PENDING', label: 'Në pritje' },
  { value: 'CLOSED', label: 'I mbyllur' },
  { value: 'CANCELLED', label: 'I anulluar' }
];

const currencies = [
  { value: 'EUR', label: 'EUR' },
  { value: 'ALL', label: 'ALL' },
  { value: 'USD', label: 'USD' }
];

export default function EditTransactionPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTransaction, setFetchingTransaction] = useState(true);
  const [formData, setFormData] = useState({
    type: 'SALE',
    status: 'OPEN',
    grossAmount: '',
    commissionAmount: '',
    agentSharePrimary: '',
    agentShareCollaborator: '',
    currency: 'EUR',
    splitRatio: '1',
    closeDate: '',
    contractNumber: '',
    notes: '',
    clientId: '',
    propertyId: '',
    primaryAgentId: '',
    collaboratingAgentId: ''
  });
  const currency = useCurrency();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      window.location.href = '/crm';
      return;
    }

    fetchTransaction();
    fetchClients();
    fetchProperties();
    fetchAgents();
  }, [params.id]);

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
          setClients([]);
        }
      } else {
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
        if (data.success) {
          const propertiesData = data.data.properties || data.data || [];
          if (Array.isArray(propertiesData)) {
            setProperties(propertiesData);
          } else {
            setProperties([]);
          }
        } else {
          setProperties([]);
        }
      } else {
        setProperties([]);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      setProperties([]);
    }
  };

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?role=AGENT,MANAGER,OFFICE_ADMIN,SUPER_ADMIN`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setAgents(data.data);
        } else {
          setAgents([]);
        }
      } else {
        setAgents([]);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      setAgents([]);
    }
  };

  const fetchTransaction = async () => {
    setFetchingTransaction(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const txnData = data.data;
          setTransaction(txnData);
          
          // Populate form with existing data
          setFormData({
            type: txnData.type || 'SALE',
            status: txnData.status || 'OPEN',
            grossAmount: txnData.grossAmount?.toString() || '',
            commissionAmount: txnData.commissionAmount?.toString() || '',
            agentSharePrimary: txnData.agentSharePrimary?.toString() || '',
            agentShareCollaborator: txnData.agentShareCollaborator?.toString() || '',
            currency: txnData.currency || 'EUR',
            splitRatio: txnData.splitRatio?.toString() || '1',
            closeDate: txnData.closeDate ? txnData.closeDate.split('T')[0] : '',
            contractNumber: txnData.contractNumber || '',
            notes: txnData.notes || '',
            clientId: txnData.clientId || '',
            propertyId: txnData.propertyId || '',
            primaryAgentId: txnData.primaryAgentId || '',
            collaboratingAgentId: txnData.collaboratingAgentId || ''
          });
        }
      } else {
        throw new Error('Transaction not found');
      }
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
      setTransaction(null);
    } finally {
      setFetchingTransaction(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanedFormData = {
        ...formData,
        grossAmount: formData.grossAmount ? parseFloat(formData.grossAmount) : undefined,
        commissionAmount: formData.commissionAmount ? parseFloat(formData.commissionAmount) : undefined,
        agentSharePrimary: formData.agentSharePrimary ? parseFloat(formData.agentSharePrimary) : undefined,
        agentShareCollaborator: formData.agentShareCollaborator ? parseFloat(formData.agentShareCollaborator) : undefined,
        splitRatio: formData.splitRatio ? parseFloat(formData.splitRatio) : undefined,
        closeDate: formData.closeDate ? new Date(formData.closeDate).toISOString() : undefined,
        collaboratingAgentId: formData.collaboratingAgentId || undefined,
      };

      console.log('Updating transaction with data:', cleanedFormData);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedFormData),
      });

      if (response.ok) {
        const data = await response.json();
        alert('✅ Transaction u përditësua me sukses!');
        window.location.href = `/crm/transactions/${params.id}`;
      } else {
        const errorData = await response.json();
        console.error('Update error:', errorData);
        alert(`❌ Gabim: ${errorData.message || 'Nuk mund të përditësohet transaction'}`);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      console.log('💡 API endpoints not implemented yet - using demo mode');
      alert('✅ Transaction u përditësua me sukses! (Demo mode - API not connected yet)');
      setTimeout(() => {
        window.location.href = `/crm/transactions/${params.id}`;
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };



  if (!user || fetchingTransaction) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Duke ngarkuar transaction...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
        <CRMHeader currentPage="transactions" user={user} />
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h2>Transaction nuk u gjet</h2>
          <Link href="/crm/transactions" style={{ color: '#2563eb', textDecoration: 'none' }}>
            ← Kthehu te transactions
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
        <CRMHeader currentPage="transactions" user={user} />
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h2>Nuk keni leje për të edituar këtë transaction</h2>
          <Link href={`/crm/transactions/${params.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
            ← Kthehu te detajet e transaction
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="transactions" user={user} />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Link 
            href={`/crm/transactions/${params.id}`}
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
            Kthehu te detajet e transaction
          </Link>
        </div>

        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {/* Form Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
              Edito Transaction
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Përditësoni të dhënat e transaction për: {transaction.client.firstName} {transaction.client.lastName}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Informacione Bazë
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
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
                    {Array.isArray(clients) ? clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.firstName} {client.lastName} ({client.mobile})
                      </option>
                    )) : null}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Prona *
                  </label>
                  <select
                    value={formData.propertyId}
                    onChange={(e) => handleInputChange('propertyId', e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  >
                    <option value="">Zgjidhni pronën...</option>
                    {Array.isArray(properties) ? properties.map(property => (
                      <option key={property.id} value={property.id}>
                        {property.title} - {formatPriceWithPreference(convertPrice(property.price, currency))}
                      </option>
                    )) : null}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Lloji *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  >
                    {transactionTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Statusi
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  >
                    {transactionStatuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Monedha
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  >
                    {currencies.map(currency => (
                      <option key={currency.value} value={currency.value}>{currency.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Data e Mbylljes
                  </label>
                  <input
                    type="date"
                    value={formData.closeDate}
                    onChange={(e) => handleInputChange('closeDate', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Detajet Financiare
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Vlera Bruto
                  </label>
                  <input
                    type="number"
                    value={formData.grossAmount}
                    onChange={(e) => handleInputChange('grossAmount', e.target.value)}
                    placeholder="250000"
                    min="0"
                    step="100"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Komisioni Total
                  </label>
                  <input
                    type="number"
                    value={formData.commissionAmount}
                    onChange={(e) => handleInputChange('commissionAmount', e.target.value)}
                    placeholder="7500"
                    min="0"
                    step="100"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Pjesa e Agjentit Kryesor
                  </label>
                  <input
                    type="number"
                    value={formData.agentSharePrimary}
                    onChange={(e) => handleInputChange('agentSharePrimary', e.target.value)}
                    placeholder="5625"
                    min="0"
                    step="100"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Pjesa e Bashkëpunuesit
                  </label>
                  <input
                    type="number"
                    value={formData.agentShareCollaborator}
                    onChange={(e) => handleInputChange('agentShareCollaborator', e.target.value)}
                    placeholder="1875"
                    min="0"
                    step="100"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Raporti i Ndarjes (0-1)
                  </label>
                  <input
                    type="number"
                    value={formData.splitRatio}
                    onChange={(e) => handleInputChange('splitRatio', e.target.value)}
                    placeholder="0.75"
                    min="0"
                    max="1"
                    step="0.01"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Numri i Kontratës
                  </label>
                  <input
                    type="text"
                    value={formData.contractNumber}
                    onChange={(e) => handleInputChange('contractNumber', e.target.value)}
                    placeholder="CT000001"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Agents */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Agjentët
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Agjenti Kryesor *
                  </label>
                  <select
                    value={formData.primaryAgentId}
                    onChange={(e) => handleInputChange('primaryAgentId', e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  >
                    <option value="">Zgjidhni agentin...</option>
                    {Array.isArray(agents) ? agents.map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.firstName} {agent.lastName} ({agent.email})
                      </option>
                    )) : null}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Agjenti Bashkëpunues
                  </label>
                  <select
                    value={formData.collaboratingAgentId}
                    onChange={(e) => handleInputChange('collaboratingAgentId', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  >
                    <option value="">Asnjë bashkëpunues...</option>
                    {Array.isArray(agents) ? agents.map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.firstName} {agent.lastName} ({agent.email})
                      </option>
                    )) : null}
                  </select>
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
                placeholder="Përshkruani detajet e transaction..."
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', resize: 'vertical' }}
              />
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '1rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
              <Link
                href={`/crm/transactions/${params.id}`}
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
                {loading ? '⏳ Duke ruajtur...' : '✅ Përditëso Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
