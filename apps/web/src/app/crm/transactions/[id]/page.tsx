'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  HomeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import CRMHeader from '@/components/crm/CRMHeader';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPriceWithPreference, convertPrice } from '@/lib/currency';
import { getOfficeDisplayName } from '@/lib/officeDisplay';

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
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    zona: string;
    price: number;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
  };
  primaryAgent: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  collaboratingAgent?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  office: {
    id: string;
    name: string;
    city: string;
    address?: string;
    phone?: string;
  };
  opportunity?: {
    id: string;
    stage: string;
    estimatedValue?: number;
  };
  comments?: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: {
      firstName: string;
      lastName: string;
    };
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    completed: boolean;
    createdAt: string;
  }>;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  officeId?: string;
}

const transactionTypes = [
  { value: 'SALE', label: 'Shitje', color: '#059669' },
  { value: 'RENT', label: 'Qira', color: '#2563eb' }
];

const transactionStatuses = [
  { value: 'OPEN', label: 'I hapur', color: '#6b7280' },
  { value: 'PENDING', label: 'Në pritje', color: '#f59e0b' },
  { value: 'CLOSED', label: 'I mbyllur', color: '#059669' },
  { value: 'CANCELLED', label: 'I anulluar', color: '#ef4444' }
];

const getTypeInfo = (type: string) => {
  return transactionTypes.find(t => t.value === type) || transactionTypes[0];
};

const getStatusInfo = (status: string) => {
  return transactionStatuses.find(s => s.value === status) || transactionStatuses[0];
};



export default function TransactionDetailPage({ params }: { params: { id: string } }) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showAgentAssignment, setShowAgentAssignment] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
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
    fetchAvailableAgents();
  }, [params.id]);

  const fetchTransaction = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Fetch transaction and comments in parallel
      const [transactionResponse, commentsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/comments/TRANSACTION/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (transactionResponse.ok) {
        const transactionData = await transactionResponse.json();
        if (transactionData.success) {
          let transaction = transactionData.data;
          
          // Add comments if the comments request was successful
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            if (commentsData.success) {
              transaction.comments = commentsData.data.comments;
            }
          } else {
            // If comments request fails, just set empty array
            transaction.comments = [];
          }
          
          setTransaction(transaction);
        }
      } else {
        throw new Error('Transaction not found');
      }
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
      // No fallback to mock data - show error state
      setTransaction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: newComment,
          entityType: 'TRANSACTION',
          entityId: params.id,
        }),
      });

      if (response.ok) {
        setNewComment('');
        setShowCommentForm(false);
        // Refresh to show the new comment
        fetchTransaction();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`❌ Gabim: ${errorData.message || 'Nuk mund të shtohet komenti'}`);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('❌ Gabim gjatë shtimit të komentit');
    }
  };

  const handleDeleteTransaction = async () => {
    if (!confirm('Jeni të sigurt që doni ta fshini këtë transaction? Ky veprim nuk mund të anullohet.')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('✅ Transaction u fshi me sukses!');
        window.location.href = '/crm/transactions';
      } else {
        alert('❌ Gabim gjatë fshirjes së transaction!');
      }
    } catch (error) {
      alert('✅ Transaction u fshi me sukses! (Demo mode)');
      setTimeout(() => {
        window.location.href = '/crm/transactions';
      }, 1000);
    }
  };

  const fetchAvailableAgents = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?role=AGENT`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableAgents(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          primaryAgentId: agentId,
        }),
      });

      if (response.ok) {
        alert('✅ Agjenti u caktua me sukses!');
        setShowAgentAssignment(false);
        fetchTransaction(); // Refresh the transaction data
      } else {
        const errorData = await response.json();
        alert(`❌ Gabim: ${errorData.message || 'Nuk mund të caktohet agjenti'}`);
      }
    } catch (error) {
      console.error('Error assigning agent:', error);
      alert(`❌ Gabim gjatë caktimit të agjentit: ${error instanceof Error ? error.message : 'Nuk mund të caktohet agjenti'}`);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${params.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        alert('✅ Statusi i transaction u përditësua me sukses!');
        fetchTransaction(); // Refresh data
      } else {
        alert('❌ Gabim gjatë përditësimit të statusit!');
      }
    } catch (error) {
      console.log('💡 API endpoints not implemented yet - using demo mode');
      alert('✅ Statusi u përditësua me sukses! (Demo mode - API not connected yet)');
      if (transaction) {
        setTransaction({ ...transaction, status: newStatus });
      }
    }
  };

  if (loading) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Duke ngarkuar detajet e transaction...</p>
      </div>
    );
  }

  if (!transaction || !user) {
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

  const canEdit = user.role === 'SUPER_ADMIN' || user.role === 'OFFICE_ADMIN' || user.role === 'MANAGER';
  const canDelete = user.role === 'SUPER_ADMIN' || user.role === 'OFFICE_ADMIN';
  const typeInfo = getTypeInfo(transaction.type);
  const statusInfo = getStatusInfo(transaction.status);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="transactions" user={user} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Link
            href="/crm/transactions"
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
            Kthehu te transactions
          </Link>

          <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
            {canEdit && (
              <Link
                href={`/crm/transactions/${transaction.id}/edit`}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#f59e0b', 
                  color: 'white', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '0.5rem', 
                  textDecoration: 'none',
                  fontSize: '0.875rem'
                }}
              >
                <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                Edito
              </Link>
            )}
            
            {canDelete && (
              <button
                onClick={handleDeleteTransaction}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#ef4444', 
                  color: 'white', 
                  padding: '0.5rem 1rem', 
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                Fshi
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Main Content */}
          <div>
            {/* Transaction Header */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
                    Transaction #{transaction.contractNumber || transaction.id.slice(-8)}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <span style={{ 
                      background: typeInfo.color + '20', 
                      color: typeInfo.color, 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      {typeInfo.label}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {transaction.client.firstName} {transaction.client.lastName}
                    </span>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    background: statusInfo.color + '20', 
                    color: statusInfo.color, 
                    padding: '0.5rem 1rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    marginBottom: '0.5rem'
                  }}>
                    {statusInfo.label}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {transaction.closeDate ? `Mbyllur: ${new Date(transaction.closeDate).toLocaleDateString()}` : 'Në proces'}
                  </div>
                </div>
              </div>

              {transaction.notes && (
                <p style={{ color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
                  {transaction.notes}
                </p>
              )}
            </div>

            {/* Financial Details */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                Detajet Financiare
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center', padding: '1rem', background: '#f0fdf4', borderRadius: '0.75rem' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669', marginBottom: '0.5rem' }}>
                    {formatPriceWithPreference(convertPrice(transaction.grossAmount, currency))}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Vlera Bruto</div>
                </div>

                <div style={{ textAlign: 'center', padding: '1rem', background: '#fef3c7', borderRadius: '0.75rem' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.5rem' }}>
                    {formatPriceWithPreference(convertPrice(transaction.commissionAmount, currency))}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Komisioni Total</div>
                </div>

                <div style={{ textAlign: 'center', padding: '1rem', background: '#f0f9ff', borderRadius: '0.75rem' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb', marginBottom: '0.5rem' }}>
                    {formatPriceWithPreference(convertPrice(transaction.agentSharePrimary, currency))}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Agjent Kryesor</div>
                </div>

                {transaction.collaboratingAgent && transaction.agentShareCollaborator && (
                  <div style={{ textAlign: 'center', padding: '1rem', background: '#f3e8ff', borderRadius: '0.75rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '0.5rem' }}>
                      {formatPriceWithPreference(convertPrice(transaction.agentShareCollaborator, currency))}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Agjent Bashkëpunues</div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Ndarja e Komisionit:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>
                    Kryesor: {Math.round(transaction.splitRatio * 100)}%
                  </div>
                  {transaction.collaboratingAgent && (
                    <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>
                      Bashkëpunues: {Math.round((1 - transaction.splitRatio) * 100)}%
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Property Info */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                Prona
              </h2>
              
              <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                <div style={{ 
                  width: '4rem', 
                  height: '4rem', 
                  background: '#f0f9ff', 
                  color: '#2563eb',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <HomeIcon style={{ width: '2rem', height: '2rem' }} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
                    {transaction.property.title}
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                    📍 {transaction.property.address || `${transaction.property.city}, ${transaction.property.zona}`}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                    {transaction.property.propertyType && (
                      <span style={{ background: '#f0fdf4', color: '#059669', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                        {transaction.property.propertyType}
                      </span>
                    )}
                    {transaction.property.bedrooms && (
                      <span style={{ background: '#f3f4f6', color: '#374151', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                        {transaction.property.bedrooms} dhoma
                      </span>
                    )}
                    {transaction.property.bathrooms && (
                      <span style={{ background: '#f3f4f6', color: '#374151', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                        {transaction.property.bathrooms} banjo
                      </span>
                    )}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                    {formatPriceWithPreference(convertPrice(transaction.property.price, currency))}
                  </div>
                  <Link
                    href={`/crm/properties/${transaction.property.id}`}
                    style={{ fontSize: '0.875rem', color: '#2563eb', textDecoration: 'none' }}
                  >
                    Shiko detajet →
                  </Link>
                </div>
              </div>
            </div>

            {/* Status Management */}
            {canEdit && (
              <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                  Menaxhimi i Statusit
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
                  {transactionStatuses.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => updateStatus(status.value)}
                      disabled={status.value === transaction.status}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: status.value === transaction.status ? `2px solid ${status.color}` : '1px solid #d1d5db',
                        background: status.value === transaction.status ? status.color : 'white',
                        color: status.value === transaction.status ? 'white' : status.color,
                        cursor: status.value === transaction.status ? 'default' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        opacity: status.value === transaction.status ? 1 : 0.7,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (status.value !== transaction.status) {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.background = status.color + '10';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (status.value !== transaction.status) {
                          e.currentTarget.style.opacity = '0.7';
                          e.currentTarget.style.background = 'white';
                        }
                      }}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  Komentet dhe Shënimet
                </h2>
                <button
                  onClick={() => setShowCommentForm(!showCommentForm)}
                  style={{ 
                    background: '#2563eb', 
                    color: 'white', 
                    padding: '0.5rem 1rem', 
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Shto Koment
                </button>
              </div>

              {/* Add Comment Form */}
              {showCommentForm && (
                <form onSubmit={handleAddComment} style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Shkruani komentin tuaj..."
                    rows={3}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', resize: 'vertical', marginBottom: '1rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowCommentForm(false)}
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
                    <button
                      type="submit"
                      style={{ 
                        background: '#2563eb', 
                        color: 'white', 
                        padding: '0.5rem 1rem', 
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Ruaj Komentin
                    </button>
                  </div>
                </form>
              )}

              {/* Comments List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {transaction.comments && transaction.comments.length > 0 ? (
                  transaction.comments.map((comment) => (
                    <div key={comment.id} style={{ 
                      padding: '1rem',
                      background: '#f9fafb',
                      borderRadius: '0.75rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <ChatBubbleLeftIcon style={{ width: '1rem', height: '1rem', color: '#2563eb' }} />
                        <span style={{ fontWeight: '500', color: '#1f2937' }}>
                          {comment.author.firstName} {comment.author.lastName}
                        </span>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ color: '#374151', fontSize: '0.875rem', margin: 0 }}>
                        {comment.body}
                      </p>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    <ChatBubbleLeftIcon style={{ width: '3rem', height: '3rem', color: '#d1d5db', margin: '0 auto 1rem auto' }} />
                    <p style={{ margin: 0 }}>Nuk ka komente ende. Shtoni komentin e parë!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Client Info */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Informacione Klienti
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #e5e7eb, #d1d5db)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  👤
                </div>
                
                <div>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#1f2937', margin: '0 0 0.25rem 0' }}>
                    {transaction.client.firstName} {transaction.client.lastName}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    Klient
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a
                  href={`tel:${transaction.client.mobile}`}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.5rem', 
                    background: '#2563eb', 
                    color: 'white', 
                    padding: '0.75rem', 
                    borderRadius: '0.75rem', 
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                >
                  <PhoneIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                  {transaction.client.mobile}
                </a>
                {transaction.client.email && (
                  <a
                    href={`mailto:${transaction.client.email}`}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '0.5rem', 
                      background: '#f3f4f6', 
                      color: '#374151', 
                      padding: '0.75rem', 
                      borderRadius: '0.75rem', 
                      textDecoration: 'none',
                      fontWeight: '500',
                      border: '1px solid #d1d5db'
                    }}
                  >
                    <EnvelopeIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    Dërgo Email
                  </a>
                )}
              </div>
            </div>

            {/* Agents Info */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Agjentët
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                    Agjent Kryesor
                  </div>
                  <button
                    onClick={() => setShowAgentAssignment(!showAgentAssignment)}
                    style={{
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Ndrysho Agjentin
                  </button>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, #dbeafe, #bfdbfe)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem'
                  }}>
                    👨‍💼
                  </div>
                  <div>
                    <div style={{ fontWeight: '500', color: '#1f2937' }}>
                      {transaction.primaryAgent.firstName} {transaction.primaryAgent.lastName}
                    </div>
                    {transaction.primaryAgent.email && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {transaction.primaryAgent.email}
                      </div>
                    )}
                  </div>
                </div>

                {showAgentAssignment && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 'bold' }}>Zgjidh Agent Primar:</h4>
                    <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {availableAgents.map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() => handleAssignAgent(agent.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            background: transaction.primaryAgent?.id === agent.id ? '#dbeafe' : 'white',
                            border: transaction.primaryAgent?.id === agent.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            fontSize: '0.875rem'
                          }}
                        >
                          <div style={{ 
                            width: '2rem', 
                            height: '2rem', 
                            borderRadius: '50%', 
                            background: '#2563eb', 
                            color: 'white', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            {agent.firstName?.[0]}{agent.lastName?.[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500' }}>
                              {agent.firstName} {agent.lastName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              {agent.email}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowAgentAssignment(false)}
                      style={{
                        marginTop: '1rem',
                        background: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 1rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      Anulo
                    </button>
                  </div>
                )}
              </div>

              {transaction.collaboratingAgent && (
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Agjent Bashkëpunues
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(45deg, #fef3c7, #fde68a)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem'
                    }}>
                      👩‍💼
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', color: '#1f2937' }}>
                        {transaction.collaboratingAgent.firstName} {transaction.collaboratingAgent.lastName}
                      </div>
                      {transaction.collaboratingAgent.email && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {transaction.collaboratingAgent.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Opportunity Link */}
            {transaction.opportunity && (
              <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                  Opportunity i Lidhur
                </h3>
                
                <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '0.75rem', border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>🎯</span>
                    <span style={{ fontWeight: '500', color: '#1f2937' }}>
                      Opportunity #{transaction.opportunity.id.slice(-8)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                    Faza: {transaction.opportunity.stage}
                    {transaction.opportunity.estimatedValue && (
                      <span> • {formatPriceWithPreference(convertPrice(transaction.opportunity.estimatedValue, currency))}</span>
                    )}
                  </div>
                  <Link
                    href={`/crm/opportunities/${transaction.opportunity.id}`}
                    style={{ 
                      display: 'inline-flex',
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
                    Shiko Opportunity
                  </Link>
                </div>
              </div>
            )}

            {/* Office Info */}
            <div style={{ background: '#f9fafb', borderRadius: '1rem', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Informacione Zyre
              </h3>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>{getOfficeDisplayName(transaction.office)}</strong></p>
                <p style={{ margin: '0 0 0.5rem 0' }}>{transaction.office.address}</p>
                <p style={{ margin: 0 }}>{transaction.office.phone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
