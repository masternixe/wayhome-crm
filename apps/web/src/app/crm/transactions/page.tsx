'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  CurrencyDollarIcon, 
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  HomeIcon,
  ArrowPathIcon,
  BanknotesIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { formatUserRole } from '@/lib/utils';
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
  createdAt: string;
  property: {
    id: string;
    title: string;
    city: string;
    zona: string;
    price: number;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    mobile: string;
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
  office: {
    id: string;
    name: string;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  officeId?: string;
}

const transactionTypes = ['SALE', 'RENT'];
const transactionStatuses = ['OPEN', 'PENDING', 'CLOSED', 'CANCELLED'];

export default function CRMTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: '',
    type: '',
    status: '',
    agentId: '',
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
          prev.agentId === parsedUser.id ? prev : { ...prev, agentId: parsedUser.id }
        ));
      }
    } else {
      window.location.href = '/crm';
      return;
    }
  }, []);

  // Fetch whenever filters change
  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const queryParams = new URLSearchParams();
      
      if (filters.type !== 'all') queryParams.append('type', filters.type);
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.agentId !== 'all') queryParams.append('primaryAgentId', filters.agentId);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && Array.isArray(data.data.transactions)) {
          setTransactions(data.data.transactions);
        } else {
          console.warn('No transactions found or invalid response format:', data);
          setTransactions([]);
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('Transaction creation will be implemented with full form');
  };

  // Filter transactions for display (client-side filtering for search)
  const filteredTransactions = transactions.filter((transaction) => {
    // Search filter
    if (filters.q) {
      const query = filters.q.toLowerCase();
      const propertyMatch = transaction.property?.title?.toLowerCase().includes(query);
      const clientMatch = `${transaction.client?.firstName || ''} ${transaction.client?.lastName || ''}`.toLowerCase().includes(query);
      const contractMatch = transaction.contractNumber?.toLowerCase().includes(query);
      if (!propertyMatch && !clientMatch && !contractMatch) return false;
    }
    
    return true;
  });

  const closeTransaction = async (transactionId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${transactionId}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Transaksioni u mbyll me sukses! Komisionet u kalkuluan automatikisht.');
        fetchTransactions();
      } else {
        alert('Gabim gjatë mbylljes së transaksionit');
      }
    } catch (error) {
      console.error('Failed to close transaction:', error);
      alert('Gabim gjatë mbylljes së transaksionit');
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { bg: string; text: string; label: string } } = {
      OPEN: { bg: '#dbeafe', text: '#1e40af', label: 'Hapur' },
      PENDING: { bg: '#fef3c7', text: '#92400e', label: 'Në pritje' },
      CLOSED: { bg: '#dcfce7', text: '#15803d', label: 'Mbyllur' },
      CANCELLED: { bg: '#fecaca', text: '#dc2626', label: 'Anulluar' }
    };

    const config = statusConfig[status] || statusConfig.OPEN;
    
    return (
      <span style={{ 
        background: config.bg, 
        color: config.text,
        padding: '0.25rem 0.5rem',
        borderRadius: '0.375rem',
        fontSize: '0.75rem',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {config.label}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    return type === 'SALE' ? (
      <HomeIcon className="h-4 w-4" style={{ color: '#1e40af' }} />
    ) : (
      <CurrencyDollarIcon className="h-4 w-4" style={{ color: '#92400e' }} />
    );
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f9fafb' }}>
      <CRMHeader currentPage="transactions" user={user} />
      <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
              Transaksionet
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Menaxhimi i të gjitha transaksioneve të shitjes dhe qirasë
            </p>
          </div>
          <button
            onClick={() => (window.location.href = '/crm/transactions/new')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#2563eb',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => (e.target as HTMLElement).style.background = '#1d4ed8'}
            onMouseOut={(e) => (e.target as HTMLElement).style.background = '#2563eb'}
          >
            <PlusIcon style={{ height: '1rem', width: '1rem' }} />
            Transaksion i Ri
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {transactionStatuses.map((status) => {
            const count = transactions.filter(t => t.status === status).length;
            const total = transactions.filter(t => t.status === status).reduce((sum, t) => sum + t.grossAmount, 0);
            
            return (
              <div key={status} style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                  {getStatusBadge(status)}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.25rem' }}>
                  {count}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {formatPriceWithPreference(convertPrice(total, currency))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Kërko
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Kërko transaksione..."
                  value={filters.q}
                  onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
                <MagnifyingGlassIcon style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', height: '1rem', width: '1rem', color: '#9ca3af' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Lloji
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              >
                <option value="">Të gjitha</option>
                {transactionTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'SALE' ? 'Shitje' : 'Qira'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Statusi
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              >
                <option value="">Të gjitha</option>
                {transactionStatuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'OPEN' && 'Hapur'}
                    {status === 'PENDING' && 'Në pritje'}
                    {status === 'CLOSED' && 'Mbyllur'}
                    {status === 'CANCELLED' && 'Anulluar'}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setFilters({ q: '', type: '', status: '', agentId: '', dateFrom: '', dateTo: '' })}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                background: 'white',
                color: '#374151',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => (e.target as HTMLElement).style.background = '#f9fafb'}
              onMouseOut={(e) => (e.target as HTMLElement).style.background = 'white'}
            >
              <ArrowPathIcon style={{ height: '1rem', width: '1rem', display: 'inline', marginRight: '0.5rem' }} />
              Reseto
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              Po ngarkojmë transaksionet...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              <BanknotesIcon style={{ height: '3rem', width: '3rem', margin: '0 auto 1rem', color: '#d1d5db' }} />
              <p style={{ fontSize: '1.125rem', fontWeight: '500', margin: '0 0 0.5rem 0' }}>Asnjë transaksion</p>
              <p style={{ margin: 0 }}>Nuk ka transaksione që përputhen me filtrat e zgjedhur.</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '150px 200px 150px 100px 120px 120px 120px 100px', 
                gap: '1rem',
                padding: '1rem',
                borderBottom: '2px solid #f3f4f6',
                background: '#f9fafb',
                fontWeight: '600',
                fontSize: '0.875rem',
                color: '#374151'
              }}>
                <div>Numri</div>
                <div>Prona</div>
                <div>Klienti</div>
                <div>Lloji</div>
                <div>Shuma</div>
                <div>Komisioni</div>
                <div>Statusi</div>
                <div>Veprime</div>
              </div>

              {/* Table Body */}
              {Array.isArray(filteredTransactions) && filteredTransactions.map((transaction) => (
                <div key={transaction.id} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '150px 200px 150px 100px 120px 120px 120px 100px', 
                  gap: '1rem',
                  padding: '1rem',
                  borderBottom: '1px solid #f3f4f6',
                  alignItems: 'center',
                  fontSize: '0.875rem'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', color: '#1f2937', fontFamily: 'monospace' }}>
                      {transaction.contractNumber || `T${transaction.id.slice(-6)}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {formatDate(transaction.createdAt)}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '0.25rem' }}>
                      {transaction.property.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {transaction.property.city}, {transaction.property.zona}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontWeight: '500', color: '#1f2937' }}>
                      {transaction.client.firstName} {transaction.client.lastName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {transaction.client.mobile}
                    </div>
                  </div>
                  
                  <span style={{ 
                    background: transaction.type === 'SALE' ? '#dbeafe' : '#fef3c7', 
                    color: transaction.type === 'SALE' ? '#1e40af' : '#92400e',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {getTypeIcon(transaction.type)}
                    {transaction.type === 'SALE' ? 'Shitje' : 'Qira'}
                  </span>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>
                      {formatPriceWithPreference(convertPrice(transaction.grossAmount, currency))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Bruto
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600', color: '#059669' }}>
                      {formatPriceWithPreference(convertPrice(transaction.commissionAmount, currency))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {((transaction.commissionAmount / transaction.grossAmount) * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  {getStatusBadge(transaction.status)}
                  
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <Link href={`/crm/transactions/${transaction.id}`}>
                      <button style={{
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <EyeIcon style={{ height: '0.875rem', width: '0.875rem', color: '#6b7280' }} />
                      </button>
                    </Link>
                    
                    {transaction.status === 'OPEN' && (
                      <button
                        onClick={() => closeTransaction(transaction.id)}
                        style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          background: '#dcfce7',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <CheckCircleIcon style={{ height: '0.875rem', width: '0.875rem', color: '#15803d' }} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Summary */}
        {filteredTransactions.length > 0 && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: '0 0 1rem 0' }}>
              Përmbledhje
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Totali Transaksioneve</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{filteredTransactions.length}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Shuma Totale</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {formatPriceWithPreference(convertPrice(filteredTransactions.reduce((sum, t) => sum + t.grossAmount, 0), currency))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Komisioni Total</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                  {formatPriceWithPreference(convertPrice(filteredTransactions.reduce((sum, t) => sum + t.commissionAmount, 0), currency))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}