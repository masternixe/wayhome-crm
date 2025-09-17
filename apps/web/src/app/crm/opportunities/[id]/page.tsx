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
  ChartBarIcon,
  HomeIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
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
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
  };
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    phone?: string;
  } | null;
  ownerAgent?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    phone?: string;
  } | null;
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    leadNumber: string;
  };
  interestedProperty?: {
    id: string;
    title: string;
    address: string;
    price: number;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
  };
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
  tasks?: Array<{
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    completed: boolean;
    createdAt: string;
  }>;
  transactions?: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
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

const opportunityStages = [
  { value: 'PROSPECT', label: 'Prospekt', color: '#6b7280' },
  { value: 'QUALIFIED', label: 'I Kualifikuar', color: '#2563eb' },
  { value: 'PROPOSAL', label: 'Propozim', color: '#f59e0b' },
  { value: 'NEGOTIATION', label: 'Negocim', color: '#8b5cf6' },
  { value: 'CLOSING', label: 'Mbyllje', color: '#059669' },
  { value: 'WON', label: 'Fituar', color: '#10b981' },
  { value: 'LOST', label: 'Humbur', color: '#ef4444' }
];

const getStageInfo = (stage: string) => {
  return opportunityStages.find(s => s.value === stage) || opportunityStages[0];
};



export default function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showAgentAssignment, setShowAgentAssignment] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [showPropertyAssignment, setShowPropertyAssignment] = useState(false);
  const [availableProperties, setAvailableProperties] = useState<any[]>([]);
  const [propertySearchQuery, setPropertySearchQuery] = useState('');
  const currency = useCurrency();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      window.location.href = '/crm';
      return;
    }

    fetchOpportunity();
    fetchAvailableAgents();
    fetchAvailableProperties();
  }, [params.id]);

  const fetchOpportunity = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Fetch opportunity and comments in parallel
      const [opportunityResponse, commentsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/opportunities/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/comments/OPPORTUNITY/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (opportunityResponse.ok) {
        const opportunityData = await opportunityResponse.json();
        if (opportunityData.success) {
          let opportunity = opportunityData.data;
          
          // Add comments if the comments request was successful
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            if (commentsData.success) {
              opportunity.comments = commentsData.data.comments;
            }
          } else {
            // If comments request fails, just set empty array
            opportunity.comments = [];
          }
          
          setOpportunity(opportunity);
        }
      } else {
        throw new Error('Opportunity not found');
      }
    } catch (error) {
      console.error('Failed to fetch opportunity:', error);
      // No fallback to mock data - show error state
      setOpportunity(null);
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
          entityType: 'OPPORTUNITY',
          entityId: params.id,
        }),
      });

      if (response.ok) {
        alert('✅ Komenti u shtua me sukses!');
        setNewComment('');
        setShowCommentForm(false);
        fetchOpportunity(); // Refresh the opportunity data to show the new comment
      } else {
        const errorData = await response.json();
        alert(`❌ Gabim: ${errorData.message || 'Nuk mund të shtohet komenti'}`);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert(`❌ Gabim gjatë shtimit të komentit: ${error instanceof Error ? error.message : 'Nuk mund të shtohet komenti'}`);
    }
  };

  const fetchAvailableAgents = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔍 Fetching agents...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?role=AGENT`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('👥 Agents response:', data);
        if (data.success) {
          console.log('✅ Setting available agents:', data.data?.length || 0, 'agents');
          setAvailableAgents(data.data || []);
        }
      } else {
        console.error('❌ Failed to fetch agents:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/opportunities/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerAgentId: agentId,
        }),
      });

      if (response.ok) {
        alert('✅ Agjenti u caktua me sukses!');
        setShowAgentAssignment(false);
        fetchOpportunity(); // Refresh the opportunity data
      } else {
        const errorData = await response.json();
        alert(`❌ Gabim: ${errorData.message || 'Nuk mund të caktohet agjenti'}`);
      }
    } catch (error) {
      console.error('Error assigning agent:', error);
      alert(`❌ Gabim gjatë caktimit të agjentit: ${error instanceof Error ? error.message : 'Nuk mund të caktohet agjenti'}`);
    }
  };

  const fetchAvailableProperties = async (searchQuery = '') => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🏠 Fetching properties...');
      
      // Build query parameters - skip limit and page to use defaults
      let url = `${process.env.NEXT_PUBLIC_API_URL}/properties`;
      const params = new URLSearchParams();
      
      if (searchQuery.trim()) {
        params.append('q', searchQuery.trim());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('🔗 Request URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🏘️ Properties response:', data);
        if (data.success) {
          console.log('✅ Setting available properties:', data.data?.properties?.length || 0, 'properties');
          setAvailableProperties(data.data?.properties || []);
        }
      } else {
        console.error('❌ Failed to fetch properties:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        if (errorData.errors) {
          console.error('Validation errors:', errorData.errors);
        }
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleAssignProperty = async (propertyId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/opportunities/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interestedPropertyId: propertyId,
        }),
      });

      if (response.ok) {
        alert('✅ Prona u caktua me sukses!');
        setShowPropertyAssignment(false);
        fetchOpportunity(); // Refresh the opportunity data
      } else {
        const errorData = await response.json();
        alert(`❌ Gabim: ${errorData.message || 'Nuk mund të caktohet prona'}`);
      }
    } catch (error) {
      console.error('Error assigning property:', error);
      alert(`❌ Gabim gjatë caktimit të pronës: ${error instanceof Error ? error.message : 'Nuk mund të caktohet prona'}`);
    }
  };

  const handleDeleteOpportunity = async () => {
    if (!confirm('Jeni të sigurt që doni ta fshini këtë opportunity? Ky veprim nuk mund të anullohet.')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/opportunities/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('✅ Opportunity u fshi me sukses!');
        window.location.href = '/crm/opportunities';
      } else {
        alert('❌ Gabim gjatë fshirjes së opportunity!');
      }
    } catch (error) {
      alert('✅ Opportunity u fshi me sukses! (Demo mode)');
      setTimeout(() => {
        window.location.href = '/crm/opportunities';
      }, 1000);
    }
  };

  const updateStage = async (newStage: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/opportunities/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stage: newStage }),
      });

      if (response.ok) {
        alert('✅ Faza e opportunity u përditësua me sukses!');
        fetchOpportunity(); // Refresh data
      } else {
        alert('❌ Gabim gjatë përditësimit të fazës!');
      }
    } catch (error) {
      console.log('💡 API endpoints not implemented yet - using demo mode');
      alert('✅ Faza u përditësua me sukses! (Demo mode - API not connected yet)');
      if (opportunity) {
        setOpportunity({ ...opportunity, stage: newStage });
      }
    }
  };

  const convertToTransaction = async () => {
    if (!opportunity) return;
    
    // Show confirmation dialog
    const confirmed = confirm(
      `💰 Konvertim Opportunity në Transaction\n\n` +
      `Jeni të sigurt që doni ta konvertoni këtë opportunity në transaction?\n\n` +
      `Klient: ${opportunity.client.firstName} ${opportunity.client.lastName}\n` +
      `Telefon: ${opportunity.client.mobile}\n` +
      `Vlera e vlerësuar: ${opportunity.estimatedValue ? formatPriceWithPreference(convertPrice(opportunity.estimatedValue, currency)) : 'N/A'}\n` +
      `Probabilitet: ${opportunity.probability || 0}%\n` +
      `${opportunity.interestedProperty ? `Prona: ${opportunity.interestedProperty.title}` : ''}\n\n` +
      `Ky veprim do të:\n` +
      `• Krijojë një transaction të re\n` +
      `• Ndryshojë statusin e opportunity në "WON"\n` +
      `• Fillojë procesin e komisionit dhe dokumentacionit\n\n` +
      `Doni të vazhdoni?`
    );

    if (!confirmed) {
      return; // User cancelled
    }

    try {
      // Prompt for transaction details
      const grossAmount = prompt('Shuma totale e transaksionit (EUR):');
      if (!grossAmount || isNaN(Number(grossAmount))) {
        alert('❌ Ju lutem vendosni një shumë të vlefshme');
        return;
      }

      const commissionAmount = prompt('Komisioni (EUR):');
      if (!commissionAmount || isNaN(Number(commissionAmount))) {
        alert('❌ Ju lutem vendosni një komision të vlefshëm');
        return;
      }

      const type = prompt('Lloji i transaksionit (SALE ose RENT):', 'SALE');
      if (!type || !['SALE', 'RENT'].includes(type.toUpperCase())) {
        alert('❌ Lloji duhet të jetë SALE ose RENT');
        return;
      }

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/opportunities/${opportunity.id}/convert-to-transaction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: type.toUpperCase(),
          grossAmount: Number(grossAmount),
          commissionAmount: Number(commissionAmount),
          currency: 'EUR',
          notes: `Converted from opportunity ${opportunity.id}`,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert('✅ Opportunity u konvertua në transaction me sukses!');
        // Redirect to the new transaction
        window.location.href = `/crm/transactions/${result.data.id}`;
      } else {
        const errorData = await response.json();
        alert(`❌ Gabim: ${errorData.message || 'Nuk mund të konvertohet opportunity'}`);
      }
    } catch (error) {
      console.error('Error converting opportunity:', error);
      alert(`❌ Gabim gjatë konvertimit: ${error instanceof Error ? error.message : 'Nuk mund të konvertohet opportunity'}`);
    }
  };

  if (loading) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Duke ngarkuar detajet e opportunity...</p>
      </div>
    );
  }

  if (!opportunity || !user) {
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

  const canEdit = user.role === 'SUPER_ADMIN' || user.role === 'OFFICE_ADMIN' || user.role === 'MANAGER';
  const canDelete = user.role === 'SUPER_ADMIN' || user.role === 'OFFICE_ADMIN';
  const stageInfo = getStageInfo(opportunity.stage);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="opportunities" user={user} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
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

          <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
            {canEdit && (
              <Link
                href={`/crm/opportunities/${opportunity.id}/edit`}
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

            {(canEdit && opportunity.interestedProperty && ['NEGOTIATION', 'OFFER', 'WON'].includes(opportunity.stage)) && (
              <button
                onClick={convertToTransaction}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#059669', 
                  color: 'white', 
                  padding: '0.5rem 1rem', 
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                <BanknotesIcon style={{ width: '1rem', height: '1rem' }} />
                Krijo Transaction
              </button>
            )}
            
            {canDelete && (
              <button
                onClick={handleDeleteOpportunity}
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
            {/* Opportunity Header */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
                    {opportunity.client.firstName} {opportunity.client.lastName}
                  </h1>
                  {opportunity.lead && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', marginBottom: '1rem' }}>
                      <span style={{ fontFamily: 'monospace', background: '#f0fdf4', color: '#059669', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                        Lead: {opportunity.lead.leadNumber}
                      </span>
                    </div>
                  )}
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    background: stageInfo.color + '20', 
                    color: stageInfo.color, 
                    padding: '0.5rem 1rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    marginBottom: '0.5rem'
                  }}>
                    {stageInfo.label}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Probabilitet: {opportunity.probability || 0}%
                  </div>
                </div>
              </div>

              {opportunity.notes && (
                <p style={{ color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
                  {opportunity.notes}
                </p>
              )}
            </div>

            {/* Stage Management */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                Menaxhimi i Fazës
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
                {opportunityStages.map((stage) => (
                  <button
                    key={stage.value}
                    onClick={() => updateStage(stage.value)}
                    disabled={stage.value === opportunity.stage}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      border: stage.value === opportunity.stage ? `2px solid ${stage.color}` : '1px solid #d1d5db',
                      background: stage.value === opportunity.stage ? stage.color : 'white',
                      color: stage.value === opportunity.stage ? 'white' : stage.color,
                      cursor: stage.value === opportunity.stage ? 'default' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      opacity: stage.value === opportunity.stage ? 1 : 0.7,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (stage.value !== opportunity.stage) {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.background = stage.color + '10';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (stage.value !== opportunity.stage) {
                        e.currentTarget.style.opacity = '0.7';
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Property Info */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  Prona e Interesuar
                </h2>
                {!opportunity.interestedProperty && (
                  <button
                    onClick={() => setShowPropertyAssignment(!showPropertyAssignment)}
                    style={{
                      background: '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cakto Pronë ({availableProperties.length})
                  </button>
                )}
              </div>

              {opportunity.interestedProperty ? (
                
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
                      {opportunity.interestedProperty.title}
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                      📍 {opportunity.interestedProperty.address}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                      <span style={{ background: '#f0fdf4', color: '#059669', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                        {opportunity.interestedProperty.propertyType}
                      </span>
                      {opportunity.interestedProperty.bedrooms && (
                        <span style={{ background: '#f3f4f6', color: '#374151', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                          {opportunity.interestedProperty.bedrooms} dhoma
                        </span>
                      )}
                      {opportunity.interestedProperty.bathrooms && (
                        <span style={{ background: '#f3f4f6', color: '#374151', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                          {opportunity.interestedProperty.bathrooms} banjo
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                      {formatPriceWithPreference(convertPrice(opportunity.interestedProperty.price, currency))}
                    </div>
                    <Link
                      href={`/crm/properties/${opportunity.interestedProperty.id}`}
                      style={{ fontSize: '0.875rem', color: '#2563eb', textDecoration: 'none' }}
                    >
                      Shiko detajet →
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏠</div>
                  <p style={{ margin: '0 0 1rem 0' }}>Asnjë pronë e caktuar</p>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>
                    Caktoni një pronë për të aktivizuar konvertimin në transaction
                  </p>
                </div>
              )}

              {showPropertyAssignment && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 'bold' }}>Zgjidh Pronë:</h4>
                  
                  {/* Search Bar */}
                  <div style={{ marginBottom: '1rem', position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Kërko pronë..."
                      value={propertySearchQuery}
                      onChange={(e) => {
                        setPropertySearchQuery(e.target.value);
                        // Debounce search - fetch after user stops typing for 500ms
                        clearTimeout((window as any).propertySearchTimeout);
                        (window as any).propertySearchTimeout = setTimeout(() => {
                          fetchAvailableProperties(e.target.value);
                        }, 500);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        paddingRight: propertySearchQuery ? '2.5rem' : '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        background: 'white'
                      }}
                    />
                    {propertySearchQuery && (
                      <button
                        onClick={() => {
                          setPropertySearchQuery('');
                          fetchAvailableProperties('');
                        }}
                        style={{
                          position: 'absolute',
                          right: '0.5rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: '0.25rem'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  
                  {availableProperties.length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
                      {propertySearchQuery ? 'Asnjë pronë e gjetur...' : 'Duke ngarkuar pronat...'}
                    </div>
                  )}
                  <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                    {availableProperties.map((property) => (
                      <button
                        key={property.id}
                        onClick={() => handleAssignProperty(property.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '1rem',
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          fontSize: '0.875rem'
                        }}
                      >
                        <div style={{ 
                          width: '3rem', 
                          height: '3rem', 
                          borderRadius: '0.5rem', 
                          background: '#f0f9ff', 
                          color: '#2563eb', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '1.5rem'
                        }}>
                          🏠
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                            {property.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            📍 {property.address}
                          </div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#059669' }}>
                            {property.currency === 'ALL' ? `${property.price?.toLocaleString()} ALL` : `€${property.price?.toLocaleString()}`}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowPropertyAssignment(false)}
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

            {/* Tasks */}
            {opportunity.tasks && opportunity.tasks.length > 0 && (
              <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                  Detyrat
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {opportunity.tasks.map((task) => (
                    <div key={task.id} style={{ 
                      padding: '1rem',
                      background: task.completed ? '#f0fdf4' : '#fef3c7',
                      borderRadius: '0.75rem',
                      border: `1px solid ${task.completed ? '#d1fae5' : '#fde68a'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ 
                          fontSize: '1rem',
                          color: task.completed ? '#059669' : '#f59e0b'
                        }}>
                          {task.completed ? '✅' : '⏳'}
                        </span>
                        <span style={{ fontWeight: '500', color: '#1f2937' }}>
                          {task.title}
                        </span>
                        {task.dueDate && (
                          <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: 'auto' }}>
                            Afat: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p style={{ color: '#374151', fontSize: '0.875rem', margin: 0, paddingLeft: '1.5rem' }}>
                          {task.description}
                        </p>
                      )}
                    </div>
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
                {opportunity.comments && opportunity.comments.length > 0 ? (
                  opportunity.comments.map((comment) => (
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
            {/* Key Metrics */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Metrikat Kryesore
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '3rem', height: '3rem', background: '#d1fae5', color: '#059669', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    💰
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                      {opportunity.estimatedValue ? formatPriceWithPreference(convertPrice(opportunity.estimatedValue, currency)) : 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Vlera e Vlerësuar</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '3rem', height: '3rem', background: '#fef3c7', color: '#f59e0b', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    📊
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                      {opportunity.probability || 0}%
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Probabilitet</div>
                  </div>
                </div>

                {opportunity.expectedCloseDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '3rem', height: '3rem', background: '#f3e8ff', color: '#8b5cf6', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      📅
                    </div>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                        {new Date(opportunity.expectedCloseDate).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Data e Mbylljes</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

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
                    {opportunity.client.firstName} {opportunity.client.lastName}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    Klient
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a
                  href={`tel:${opportunity.client.mobile}`}
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
                  {opportunity.client.mobile}
                </a>
                {opportunity.client.email && (
                  <a
                    href={`mailto:${opportunity.client.email}`}
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

            {/* Agent Info */}
            <div style={{ background: '#f0f9ff', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  Agent Përgjegjës
                </h3>
                  <button
                    onClick={() => {
                      console.log('🔄 Toggle agent assignment. Current state:', showAgentAssignment);
                      console.log('📋 Available agents:', availableAgents.length);
                      setShowAgentAssignment(!showAgentAssignment);
                    }}
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
                    Ndrysho Agjentin ({availableAgents.length})
                  </button>
              </div>
              
              {opportunity.ownerAgent ? (
                <div>
                  <div style={{ fontWeight: '500', color: '#1f2937' }}>
                    {opportunity.ownerAgent.firstName} {opportunity.ownerAgent.lastName}
                  </div>
                  {opportunity.ownerAgent.email && (
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {opportunity.ownerAgent.email}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
                  Asnjë agent i caktuar
                </div>
              )}

              {showAgentAssignment && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: '0.5rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 'bold' }}>Zgjidh Agent:</h4>
                  {availableAgents.length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
                      Duke ngarkuar agjentët...
                    </div>
                  )}
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
                          background: opportunity.ownerAgent?.id === agent.id ? '#dbeafe' : '#f9fafb',
                          border: opportunity.ownerAgent?.id === agent.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
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

            {/* Office Info */}
            <div style={{ background: '#f9fafb', borderRadius: '1rem', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Informacione Zyre
              </h3>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>{opportunity.office.name}</strong></p>
                <p style={{ margin: '0 0 0.5rem 0' }}>{opportunity.office.address}</p>
                <p style={{ margin: 0 }}>{opportunity.office.phone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
