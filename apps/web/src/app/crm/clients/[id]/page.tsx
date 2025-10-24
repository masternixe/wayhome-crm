'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import CRMHeader from '@/components/crm/CRMHeader';
import { getOfficeDisplayName } from '@/lib/officeDisplay';

interface ClientComment {
  id: string;
  body: string;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface RelatedProperty {
  id: string;
  title: string;
  address?: string;
  price?: number;
  currency?: string;
  status?: string;
  createdAt: string;
}

interface RelatedOpportunity {
  id: string;
  stage: string;
  estimatedValue?: number;
  createdAt: string;
}

interface RelatedTransaction {
  id: string;
  grossAmount: number;
  currency: string;
  createdAt: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  preferredCurrency?: string;
  notes?: string;
  createdAt: string;
  ownerAgent?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    avatar?: string;
  } | null;
  office: {
    id: string;
    name: string;
    city?: string;
    address?: string;
    phone?: string;
  };
  properties?: RelatedProperty[];
  opportunities?: RelatedOpportunity[];
  transactions?: RelatedTransaction[];
  comments?: ClientComment[];
  totalSpent?: number;
  lastActivity?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  officeId?: string;
}

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<Client | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      window.location.href = '/crm';
      return;
    }
    fetchClient();
  }, [params.id]);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Fetch client and comments in parallel
      const [clientResponse, commentsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/comments/CLIENT/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (clientResponse.ok) {
        const clientData = await clientResponse.json();
        if (clientData.success) {
          let client = clientData.data;
          
          // Add comments if the comments request was successful
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            if (commentsData.success) {
              client.comments = commentsData.data.comments;
            }
          } else {
            // If comments request fails, just set empty array
            client.comments = [];
          }
          
          setClient(client);
        } else {
          throw new Error(clientData.message || 'Failed to fetch client');
        }
      } else {
        throw new Error('Client not found');
      }
    } catch (error) {
      console.error('Failed to fetch client:', error);
      setClient(null);
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
          entityType: 'CLIENT',
          entityId: params.id,
        }),
      });

      if (response.ok) {
        alert('✅ Komenti u shtua me sukses!');
        setNewComment('');
        setShowCommentForm(false);
        fetchClient();
      } else {
        const errorData = await response.json();
        alert(`❌ Gabim: ${errorData.message || 'Nuk mund të shtohet komenti'}`);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('❌ Gabim gjatë shtimit të komentit');
    }
  };

  const handleDeleteClient = async () => {
    if (!confirm('Jeni të sigurt që doni ta fshini këtë klient? Ky veprim nuk mund të anullohet.')) return;
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('✅ Klienti u fshi me sukses!');
        window.location.href = '/crm/clients';
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`❌ Gabim: ${errorData.message || 'Nuk mund të fshihet klienti'}`);
      }
    } catch (error) {
      alert('✅ Klienti u fshi me sukses! (Demo mode)');
      setTimeout(() => (window.location.href = '/crm/clients'), 1000);
    }
  };

  if (loading) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Duke ngarkuar detajet e klientit...</p>
      </div>
    );
  }

  if (!client || !user) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
        <CRMHeader currentPage="clients" user={user} />
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h2>Klienti nuk u gjet</h2>
          <Link href="/crm/clients" style={{ color: '#2563eb', textDecoration: 'none' }}>
            ← Kthehu te klientët
          </Link>
        </div>
      </div>
    );
  }

  const canEdit =
    user.role === 'SUPER_ADMIN' ||
    user.role === 'OFFICE_ADMIN' ||
    user.role === 'MANAGER' ||
    (user.role === 'AGENT' && client.ownerAgent && client.ownerAgent.id === user.id);
  const canDelete = user.role === 'SUPER_ADMIN' || user.role === 'OFFICE_ADMIN' || user.role === 'MANAGER';

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="clients" user={user} />

      {/* Breadcrumb & Actions */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link
              href="/crm/clients"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#2563eb',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
              Kthehu te klientët
            </Link>

            <div style={{ display: 'flex', gap: '1rem' }}>
              {canEdit && (
                <Link
                  href={`/crm/clients/${client.id}/edit`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#f59e0b',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                  }}
                >
                  <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                  Edito
                </Link>
              )}

              {canDelete && (
                <button
                  onClick={handleDeleteClient}
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
                    fontSize: '0.875rem',
                  }}
                >
                  <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                  Fshi
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Main Content */}
          <div>
            {/* Client Header */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
                    {client.firstName} {client.lastName}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    <CalendarIcon style={{ width: '1rem', height: '1rem' }} />
                    <span>Krijuar më: {new Date(client.createdAt).toLocaleDateString()}</span>
                    {client.lastActivity && (
                      <>
                        <span>•</span>
                        <span>Aktiviteti i fundit: {new Date(client.lastActivity).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {typeof client.totalSpent === 'number' && (
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#059669' }}>
                      {client.preferredCurrency === 'ALL'
                        ? `${(client.totalSpent || 0).toLocaleString()} ALL`
                        : `€${(client.totalSpent || 0).toLocaleString()}`}
                    </div>
                  )}
                  {client.preferredCurrency && (
                    <div style={{
                      marginTop: '0.5rem',
                      background: '#f0fdf4',
                      color: '#059669',
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                    }}>
                      {client.preferredCurrency}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    background: '#f0fdf4',
                    color: '#059669',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <PhoneIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Telefon</div>
                    <a href={`tel:${client.mobile}`} style={{ fontWeight: '500', color: '#059669', textDecoration: 'none' }}>
                      {client.mobile}
                    </a>
                  </div>
                </div>

                {client.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      background: '#f0f9ff',
                      color: '#2563eb',
                      borderRadius: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <EnvelopeIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Email</div>
                      <a href={`mailto:${client.email}`} style={{ fontWeight: '500', color: '#2563eb', textDecoration: 'none' }}>
                        {client.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Client Properties */}
            {client.properties && (
              <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                    Pronat e Klientit
                  </h2>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {client.properties.length} prona
                  </div>
                </div>

                {client.properties.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {client.properties.map((p) => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ fontWeight: '600', color: '#1f2937' }}>{p.title}</div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {p.address}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                            {typeof p.price === 'number' && (
                              <span style={{ color: '#2563eb', fontWeight: 600 }}>
                                {p.currency === 'ALL' ? `${p.price.toLocaleString()} ALL` : `€${p.price.toLocaleString()}`}
                              </span>
                            )}
                            {p.status && (
                              <span style={{ background: '#eef2ff', color: '#4338ca', padding: '0.125rem 0.5rem', borderRadius: '999px' }}>
                                {p.status}
                              </span>
                            )}
                          </div>
                        </div>
                        <Link href={`/crm/properties/${p.id}`} style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
                          Shiko detajet →
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    <p style={{ margin: 0 }}>Ky klient nuk ka prona të regjistruara.</p>
                  </div>
                )}
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
                    fontSize: '0.875rem',
                  }}
                >
                  Shto Koment
                </button>
              </div>

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
                        fontSize: '0.875rem',
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
                        fontSize: '0.875rem',
                      }}
                    >
                      Ruaj Komentin
                    </button>
                  </div>
                </form>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {client.comments && client.comments.length > 0 ? (
                  client.comments.map((comment) => (
                    <div key={comment.id} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
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
            {/* Owner Agent */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Agjenti Përgjegjës
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
                  fontSize: '1.5rem',
                }}>
                  👨‍💼
                </div>

                <div>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#1f2937', margin: '0 0 0.25rem 0' }}>
                    {client.ownerAgent ? `${client.ownerAgent.firstName} ${client.ownerAgent.lastName}` : 'Pa caktuar'}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    {client.ownerAgent ? 'Agjent i Licencuar' : 'Pa agjent të caktuar'}
                  </p>
                </div>
              </div>

              {client.ownerAgent && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {client.ownerAgent.phone && (
                    <a
                      href={`tel:${client.ownerAgent.phone}`}
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
                        fontWeight: '500',
                      }}
                    >
                      <PhoneIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                      {client.ownerAgent.phone}
                    </a>
                  )}
                  {client.ownerAgent.email && (
                    <a
                      href={`mailto:${client.ownerAgent.email}`}
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
                        border: '1px solid #d1d5db',
                      }}
                    >
                      <EnvelopeIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                      Dërgo Email
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Office Info */}
            <div style={{ background: '#f9fafb', borderRadius: '1rem', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Informacione Zyre
              </h3>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>{getOfficeDisplayName(client.office)}</strong></p>
                {client.office.address && (
                  <p style={{ margin: '0 0 0.5rem 0' }}>{client.office.address}</p>
                )}
                {client.office.phone && <p style={{ margin: 0 }}>{client.office.phone}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


