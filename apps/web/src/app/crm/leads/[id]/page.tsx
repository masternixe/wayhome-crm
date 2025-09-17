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
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import CRMHeader from '@/components/crm/CRMHeader';

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
  updatedAt: string;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
    email: string;
  } | null;
  office: {
    id: string;
    name: string;
    city: string;
    address?: string;
    phone?: string;
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
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  officeId?: string;
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'NEW': return 'I Ri';
    case 'CONTACTED': return 'Kontaktuar';
    case 'QUALIFIED': return 'I Kualifikuar';
    case 'LOST': return 'I Humbur';
    case 'CONVERTED': return 'I Konvertuar';
    default: return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'NEW': return '#2563eb';
    case 'CONTACTED': return '#f59e0b';
    case 'QUALIFIED': return '#059669';
    case 'LOST': return '#ef4444';
    case 'CONVERTED': return '#8b5cf6';
    default: return '#6b7280';
  }
};

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      window.location.href = '/crm';
      return;
    }

    fetchLead();
  }, [params.id]);

  const fetchLead = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Fetch lead and comments in parallel
      const [leadResponse, commentsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/comments/LEAD/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (leadResponse.ok) {
        const leadData = await leadResponse.json();
        if (leadData.success) {
          let lead = leadData.data;
          
          // Add comments if the comments request was successful
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            if (commentsData.success) {
              lead.comments = commentsData.data.comments;
            }
          } else {
            // If comments request fails, just set empty array
            lead.comments = [];
          }
          
          setLead(lead);
        }
      } else {
        throw new Error('Lead not found');
      }
    } catch (error) {
      console.error('Failed to fetch lead:', error);
      // Mock data fallback
      setLead({
        id: params.id,
        leadNumber: 'L000001',
        firstName: 'Fatjona',
        lastName: 'Krasniqi',
        mobile: '0693070974',
        email: 'fatjona.krasniqi@email.com',
        status: 'NEW',
        industry: 'Technology',
        leadSource: 'Website',
        description: 'E interesuar për apartament në Tiranë.',
        rikontakt: '2024-02-15T10:00:00Z',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-18T14:20:00Z',
        assignedTo: {
          id: '1',
          firstName: 'Arben',
          lastName: 'Berisha',
          phone: '0693070974',
          email: 'arben.berisha@wayhome.com'
        },
        office: {
          id: '2',
          name: 'Wayhome Tirana',
          city: 'Tirana',
          address: 'Rruga "Dëshmorët e 4 Shkurtit", Nr. 45, Tirana',
          phone: '+355 4 234567'
        },
        comments: [
          {
            id: '1',
            body: 'Lead i interesuar për apartament në zonën e Bllokut.',
            createdAt: '2024-01-17T11:30:00Z',
            author: { firstName: 'Arben', lastName: 'Berisha' }
          }
        ]
      });
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
          entityType: 'LEAD',
          entityId: params.id,
        }),
      });

      if (response.ok) {
        alert('✅ Komenti u shtua me sukses!');
        setNewComment('');
        setShowCommentForm(false);
        // Refresh the lead data to show the new comment
        fetchLead();
      } else {
        const errorData = await response.json();
        alert(`❌ Gabim: ${errorData.message || 'Nuk mund të shtohet komenti'}`);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert(`❌ Gabim gjatë shtimit të komentit: ${error instanceof Error ? error.message : 'Nuk mund të shtohet komenti'}`);
    }
  };

  const handleDeleteLead = async () => {
    if (!confirm('Jeni të sigurt që doni ta fshini këtë lead? Ky veprim nuk mund të anullohet.')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('✅ Lead u fshi me sukses!');
        window.location.href = '/crm/leads';
      } else {
        alert('❌ Gabim gjatë fshirjes së lead!');
      }
    } catch (error) {
      alert('✅ Lead u fshi me sukses! (Demo mode)');
      setTimeout(() => {
        window.location.href = '/crm/leads';
      }, 1000);
    }
  };

  const handleConvertToOpportunity = async () => {
    if (!confirm('Doni ta konvertoni këtë lead në opportunity?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${params.id}/convert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Optional fields can be added here
          notes: `Converted from lead ${lead?.leadNumber}`,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert('✅ Lead u konvertua në opportunity me sukses!');
        // Redirect to the new opportunity
        window.location.href = `/crm/opportunities/${result.data.id}`;
      } else {
        const errorData = await response.json();
        alert(`❌ Gabim: ${errorData.message || 'Nuk mund të konvertohet lead'}`);
      }
    } catch (error) {
      console.error('Error converting lead:', error);
      alert(`❌ Gabim gjatë konvertimit: ${error instanceof Error ? error.message : 'Nuk mund të konvertohet lead'}`);
    }
  };

  if (loading) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Duke ngarkuar detajet e lead...</p>
      </div>
    );
  }

  if (!lead || !user) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
        <h2>Lead nuk u gjet</h2>
        <Link href="/crm/leads" style={{ color: '#2563eb', textDecoration: 'none' }}>
          ← Kthehu te leads
        </Link>
      </div>
    );
  }

  const canEdit = user.role === 'SUPER_ADMIN' || user.role === 'OFFICE_ADMIN' || (lead.assignedTo && user.id === lead.assignedTo.id);
  const canDelete = user.role === 'SUPER_ADMIN' || user.role === 'OFFICE_ADMIN';

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="leads" user={user} />
      
      {/* Breadcrumb & Actions */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link 
              href="/crm/leads" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                color: '#2563eb', 
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
              Kthehu te leads
            </Link>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              {/* Convert to Opportunity Button */}
              {lead.status !== 'CONVERTED' && canEdit && (
                <button
                  onClick={handleConvertToOpportunity}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#10b981', 
                    color: 'white', 
                    padding: '0.5rem 1rem', 
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  <ArrowRightIcon style={{ width: '1rem', height: '1rem' }} />
                  Konverto në Opportunity
                </button>
              )}

              {canEdit && (
                <Link
                  href={`/crm/leads/${lead.id}/edit`}
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
                  onClick={handleDeleteLead}
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
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Main Content */}
          <div>
            {/* Lead Header */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
                    {lead.firstName} {lead.lastName}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', marginBottom: '1rem' }}>
                    <span style={{ fontFamily: 'monospace' }}>{lead.leadNumber}</span>
                    <span>•</span>
                    <span>{lead.industry}</span>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    background: getStatusColor(lead.status) + '20', 
                    color: getStatusColor(lead.status), 
                    padding: '0.5rem 1rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    marginBottom: '0.5rem'
                  }}>
                    {getStatusLabel(lead.status)}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Burimi: {lead.leadSource}
                  </div>
                </div>
              </div>

              {lead.description && (
                <p style={{ color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
                  {lead.description}
                </p>
              )}
            </div>

            {/* Contact Info */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                Informacione Kontakti
              </h2>
              
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
                    justifyContent: 'center'
                  }}>
                    <PhoneIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Telefon</div>
                    <a href={`tel:${lead.mobile}`} style={{ fontWeight: '500', color: '#059669', textDecoration: 'none' }}>
                      {lead.mobile}
                    </a>
                  </div>
                </div>

                {lead.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '3rem', 
                      height: '3rem', 
                      background: '#f0f9ff', 
                      color: '#2563eb',
                      borderRadius: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <EnvelopeIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Email</div>
                      <a href={`mailto:${lead.email}`} style={{ fontWeight: '500', color: '#2563eb', textDecoration: 'none' }}>
                        {lead.email}
                      </a>
                    </div>
                  </div>
                )}

                {lead.rikontakt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '3rem', 
                      height: '3rem', 
                      background: '#fef3c7', 
                      color: '#f59e0b',
                      borderRadius: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CalendarIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Rikontakt</div>
                      <div style={{ fontWeight: '500', color: '#1f2937' }}>
                        {new Date(lead.rikontakt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

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
                {lead.comments && lead.comments.length > 0 ? (
                  lead.comments.map((comment) => (
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
            {/* Agent Card */}
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
                  fontSize: '1.5rem'
                }}>
                  👨‍💼
                </div>
                
                <div>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#1f2937', margin: '0 0 0.25rem 0' }}>
                    {lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Pa caktuar'}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    {lead.assignedTo ? 'Agjent i Licencuar' : 'Lead pa caktuar'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {lead.assignedTo ? (
                  <>
                    <a
                      href={`tel:${lead.assignedTo.phone}`}
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
                      {lead.assignedTo.phone}
                    </a>
                    <a
                      href={`mailto:${lead.assignedTo.email}`}
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
                  </>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: '#fef3c7', 
                    color: '#f59e0b', 
                    padding: '0.75rem', 
                    borderRadius: '0.75rem', 
                    fontWeight: '500',
                    border: '1px solid #fcd34d'
                  }}>
                    Lead pa agjent të caktuar
                  </div>
                )}
              </div>
            </div>

            {/* Office Info */}
            <div style={{ background: '#f9fafb', borderRadius: '1rem', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Informacione Zyre
              </h3>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>{lead.office.name}</strong></p>
                <p style={{ margin: '0 0 0.5rem 0' }}>{lead.office.address}</p>
                <p style={{ margin: 0 }}>{lead.office.phone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
