'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  HomeIcon,
  CurrencyDollarIcon,
  StarIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  UserPlusIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { notifyError, notifySuccess, flashSuccess, flashError } from '@/lib/notify';
import CRMHeader from '@/components/crm/CRMHeader';

import ClientAssignmentModal from '@/components/crm/ClientAssignmentModal';

interface Property {
  id: string;
  title: string;
  description: string;
  listingType?: 'SALE' | 'RENT';
  type: string;
  city: string;
  zona: string;
  address: string;
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  siperfaqeMin: number;
  siperfaqeMax: number;
  ashensor: boolean;
  badges: string[];
  featured: boolean;
  status: string;
  yearBuilt?: number;
  parkingSpaces?: number;
  balcony: boolean;
  garden: boolean;
  gallery: string[];
  virtualTourUrl?: string;
  createdAt: string;
  updatedAt: string;
  agentOwner: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
    email: string;
  };
  collaboratingAgent?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  office: {
    id: string;
    name: string;
    city: string;
    address?: string;
    phone?: string;
  };
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
    preferredCurrency?: string;
  };
  documents?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    showInFrontend: boolean;
    uploadedAt: string;
  }>;
  priceHistory?: Array<{
    id: string;
    oldPrice: number;
    newPrice: number;
    currency: string;
    createdAt: string;
  }>;
  views?: Array<{
    id: string;
    viewedBy?: string;
    createdAt: string;
  }>;
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

// Helper functions
const getPropertyTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    'APARTMENT': 'Apartament',
    'HOUSE': 'Shtëpi',
    'VILLA': 'Vilë',
    'DUPLEX': 'Dupleks',
    'AMBIENT': 'Ambient',
    'COMMERCIAL': 'Komercial',
    'OFFICE': 'Zyrë',
    'LAND': 'Tokë'
  };
  return types[type] || type;
};

const getListingTypeLabel = (listingType: string) => {
  const types: Record<string, string> = {
    'SALE': 'Shitje',
    'RENT': 'Qera'
  };
  return types[listingType] || listingType;
};

const getListingTypeColor = (listingType: string) => {
  const colors: Record<string, {bg: string, text: string}> = {
    'SALE': { bg: '#ecfdf5', text: '#059669' }, // Green for sale
    'RENT': { bg: '#eff6ff', text: '#2563eb' }  // Blue for rent
  };
  return colors[listingType] || { bg: '#f3f4f6', text: '#6b7280' };
};

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      window.location.href = '/crm';
      return;
    }

    fetchProperty();
  }, [params.id]);

  const fetchProperty = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Fetch property and comments in parallel
      const [propertyResponse, commentsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/comments/PROPERTY/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (propertyResponse.ok) {
        const propertyData = await propertyResponse.json();
        if (propertyData.success) {
          let property = propertyData.data;
          
          // Add comments if the comments request was successful
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            if (commentsData.success) {
              property.comments = commentsData.data.comments;
            }
          } else {
            // If comments request fails, just set empty array
            property.comments = [];
          }
          
          setProperty(property);
        }
      } else {
        throw new Error('Property not found');
      }
    } catch (error) {
      console.error('Failed to fetch property:', error);
      notifyError('❌ Gabim gjatë ngarkimit të pronës');
      // Mock data fallback
      setProperty({
        id: params.id,
        title: 'Apartament 2+1 me pamje nga deti',
        description: 'Apartament i shkëlqyer me pamje panoramike të detit dhe qytetit. I mobiluar plotësisht me pajisje moderne dhe të gjitha komoditeteve. Ndodhet në një nga zonat më të kërkuara të Durrësit, vetëm disa metra nga plazhi.',
        type: 'APARTMENT',
        city: 'Durrës',
        zona: 'Plazhi',
        address: 'Rruga "Taulantia", Nr. 45, Durrës',
        price: 120000,
        currency: 'EUR',
        bedrooms: 2,
        bathrooms: 1,
        siperfaqeMin: 80,
        siperfaqeMax: 85,
        ashensor: true,
        badges: ['New', 'Sea View', 'Furnished'],
        featured: true,
        status: 'LISTED',
        yearBuilt: 2022,
        parkingSpaces: 1,
        balcony: true,
        garden: false,
        gallery: [],
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-18T14:20:00Z',
        agentOwner: {
          id: '1',
          firstName: 'Arben',
          lastName: 'Berisha',
          phone: '0693070974',
          email: 'arben.berisha@wayhome.com'
        },
        office: {
          id: '2',
          name: 'Wayhome Durrës',
          city: 'Durrës',
          address: 'Rruga "Taulantia", Nr. 45, Durrës',
          phone: '+355 52 234567'
        },
        client: {
          id: '1',
          firstName: 'Fatjona',
          lastName: 'Krasniqi',
          mobile: '0693070974',
          email: 'fatjona.krasniqi@email.com',
          preferredCurrency: 'EUR'
        },
        documents: [
          {
            id: '1',
            name: 'Certifikata e Pronësisë.pdf',
            url: '/documents/ownership-certificate.pdf',
            type: 'application/pdf',
            size: 2048576,
            showInFrontend: true,
            uploadedAt: '2024-01-15T10:30:00Z'
          },
          {
            id: '2',
            name: 'Planimetria e Apartamentit.pdf',
            url: '/documents/floor-plan.pdf',
            type: 'application/pdf',
            size: 1024768,
            showInFrontend: true,
            uploadedAt: '2024-01-16T14:20:00Z'
          },
          {
            id: '3',
            name: 'Kontrata e Blerjes Origjinale.pdf',
            url: '/documents/original-purchase-contract.pdf',
            type: 'application/pdf',
            size: 3072000,
            showInFrontend: false,
            uploadedAt: '2024-01-17T09:15:00Z'
          }
        ],
        priceHistory: [
          {
            id: '1',
            oldPrice: 125000,
            newPrice: 120000,
            currency: 'EUR',
            createdAt: '2024-01-16T10:00:00Z'
          }
        ],
        views: [
          { id: '1', viewedBy: 'client1', createdAt: '2024-01-18T14:20:00Z' },
          { id: '2', createdAt: '2024-01-18T12:15:00Z' },
          { id: '3', createdAt: '2024-01-17T16:30:00Z' }
        ],
        comments: [
          {
            id: '1',
            body: 'Klienti ka shfaqur interesim të fortë për këtë pronë.',
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
          entityType: 'PROPERTY',
          entityId: params.id,
        }),
      });

      if (response.ok) {
        notifySuccess('✅ Komenti u shtua me sukses!');
        setNewComment('');
        setShowCommentForm(false);
        fetchProperty(); // Refresh the property data to show the new comment
      } else {
        const errorData = await response.json();
        notifyError(`❌ Gabim: ${errorData.message || 'Nuk mund të shtohet komenti'}`);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      notifyError(`❌ Gabim gjatë shtimit të komentit: ${error instanceof Error ? error.message : 'Nuk mund të shtohet komenti'}`);
    }
  };

  const handleClientAssignment = async (client: any) => {
    try {
      // In real app, would update via API
      if (property) {
        setProperty({ ...property, client });
      }
      
      if (client) {
        notifySuccess(`✅ Klienti ${client.firstName} ${client.lastName} u caktua me sukses! (Demo mode)`);
      } else {
        notifySuccess('✅ Klienti u hoq nga prona! (Demo mode)');
      }
    } catch (error) {
      notifyError('❌ Gabim gjatë caktimit të klientit');
    }
  };



  const handleDeleteProperty = async () => {
    if (!confirm('Jeni të sigurt që doni ta fshini këtë pronë? Ky veprim nuk mund të anullohet.')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        flashSuccess('✅ Prona u fshi me sukses!');
        window.location.href = '/crm/properties';
      } else {
        const errorData = await response.json();
        flashError(`❌ ${errorData.message || 'Gabim gjatë fshirjes së pronës'}`);
      }
    } catch (error) {
      console.error('Delete property error:', error);
      flashError(`❌ Gabim gjatë fshirjes së pronës: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Duke ngarkuar detajet e pronës...</p>
      </div>
    );
  }

  if (!property || !user) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
        <h2>Prona nuk u gjet</h2>
        <Link href="/crm/properties" style={{ color: '#2563eb', textDecoration: 'none' }}>
          ← Kthehu te pronat
        </Link>
      </div>
    );
  }

  const canEdit = user.role === 'SUPER_ADMIN' || user.role === 'OFFICE_ADMIN' || user.id === property.agentOwner.id;
  const canDelete = user.role === 'SUPER_ADMIN' || user.role === 'OFFICE_ADMIN' || user.id === property.agentOwner.id;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="properties" user={user} />
      
      {/* Breadcrumb & Actions */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link 
              href="/crm/properties" 
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
              Kthehu te pronat
            </Link>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowClientModal(true)}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: property.client ? '#8b5cf6' : '#2563eb', 
                  color: 'white', 
                  padding: '0.5rem 1rem', 
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                <UserPlusIcon style={{ width: '1rem', height: '1rem' }} />
                {property.client ? 'Ndrysho Klientin' : 'Cakto Klient'}
              </button>

              {canEdit && (
                <Link
                  href={`/crm/properties/${property.id}/edit`}
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
                  onClick={handleDeleteProperty}
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
            {/* Property Header */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
                    {property.title}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', marginBottom: '1rem' }}>
                    <MapPinIcon style={{ width: '1rem', height: '1rem' }} />
                    <span>{property.address}</span>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2563eb', marginBottom: '0.25rem' }}>
                    {property.currency === 'EUR' 
                      ? `€${property.price.toLocaleString()}`
                      : `${property.price.toLocaleString()} ALL`
                    }
                  </div>
                  <div style={{ 
                    background: property.status === 'LISTED' ? '#dcfce7' : '#fef3c7', 
                    color: property.status === 'LISTED' ? '#166534' : '#92400e', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    {property.status}
                  </div>
                  {property.featured && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <StarIcon style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Badges */}
              {property.badges.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {property.badges.map((badge, index) => (
                    <span key={index} style={{ 
                      background: '#dbeafe', 
                      color: '#1e40af', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              <p style={{ color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
                {property.description}
              </p>
            </div>

            {/* Property Details */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                Detajet e Pronës
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center', padding: '1rem', background: getListingTypeColor(property.listingType || 'SALE').bg, borderRadius: '0.75rem', border: `2px solid ${getListingTypeColor(property.listingType || 'SALE').text}` }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{property.listingType === 'RENT' ? '🏠' : '💰'}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: getListingTypeColor(property.listingType || 'SALE').text }}>{getListingTypeLabel(property.listingType || 'SALE')}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Lloji i Listimit</div>
                </div>
                
                <div style={{ textAlign: 'center', padding: '1rem', background: '#f0f9ff', borderRadius: '0.75rem', border: '2px solid #0369a1' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0369a1' }}>{getPropertyTypeLabel(property.type)}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Lloji i Pronës</div>
                </div>
                
                <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛏️</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{property.bedrooms}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Dhoma Gjumi</div>
                </div>
                
                <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚿</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{property.bathrooms}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Banjo</div>
                </div>
                
                <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📐</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{property.siperfaqeMin}-{property.siperfaqeMax}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>m² Sipërfaqe</div>
                </div>
                
                {property.yearBuilt && (
                  <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏗️</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{property.yearBuilt}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Viti Ndërtimit</div>
                  </div>
                )}
              </div>

              {/* Features */}
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                  Veçoritë
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {property.ashensor && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', color: '#065f46', padding: '0.5rem 1rem', borderRadius: '1.5rem', fontSize: '0.875rem' }}>
                      🛗 Ashensor
                    </span>
                  )}
                  {property.balcony && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', color: '#065f46', padding: '0.5rem 1rem', borderRadius: '1.5rem', fontSize: '0.875rem' }}>
                      🌅 Balkon
                    </span>
                  )}
                  {property.garden && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', color: '#065f46', padding: '0.5rem 1rem', borderRadius: '1.5rem', fontSize: '0.875rem' }}>
                      🌳 Kopsht
                    </span>
                  )}
                  {property.parkingSpaces && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', color: '#065f46', padding: '0.5rem 1rem', borderRadius: '1.5rem', fontSize: '0.875rem' }}>
                      🚗 {property.parkingSpaces} Parking
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            {/* Client Info */}
            {property.client && (
              <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                  Informacione Klienti
                </h2>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: '4rem', 
                    height: '4rem', 
                    background: '#dbeafe', 
                    color: '#2563eb',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    👤
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
                      {property.client.firstName} {property.client.lastName}
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <PhoneIcon style={{ width: '1rem', height: '1rem' }} />
                        <a href={`tel:${property.client.mobile}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                          {property.client.mobile}
                        </a>
                      </div>
                      {property.client.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <EnvelopeIcon style={{ width: '1rem', height: '1rem' }} />
                          <a href={`mailto:${property.client.email}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                            {property.client.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {property.client.preferredCurrency && (
                      <div style={{ 
                        padding: '0.25rem 0.75rem',
                        background: '#f0fdf4',
                        color: '#059669',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {property.client.preferredCurrency}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Documents List (Read-only) */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                📄 Dokumentet
              </h3>
              
              {property.documents && property.documents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {property.documents.map((doc: any) => (
                    <div key={doc.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      background: '#f9fafb',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <DocumentIcon style={{ width: '1.25rem', height: '1.25rem', color: '#2563eb' }} />
                        <div>
                          <div style={{ fontWeight: '500', color: '#1f2937' }}>{doc.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {doc.type} • {(doc.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#2563eb',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        Shiko
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <DocumentIcon style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', color: '#d1d5db' }} />
                  <p style={{ margin: 0 }}>Asnjë dokument i ngarkuar</p>
                  <p style={{ fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
                    Dokumentet mund të ngarkohen gjatë editimit të pronës
                  </p>
                </div>
              )}
            </div>

            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginTop: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  Aktiviteti dhe Komentet
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

              {/* Comments */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {property.comments && property.comments.length > 0 ? (
                  property.comments.map((comment) => (
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
                    {property.agentOwner.firstName} {property.agentOwner.lastName}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    Agjent i Licencuar
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a
                  href={`tel:${property.agentOwner.phone}`}
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
                  {property.agentOwner.phone}
                </a>
                <a
                  href={`mailto:${property.agentOwner.email}`}
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
              </div>

              {/* Collaborating Agent */}
              {property.collaboratingAgent && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#fef3c7', borderRadius: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#92400e' }}>
                    🤝 Agjent Bashkëpunëtor
                  </h4>
                  <p style={{ fontWeight: '500', color: '#374151', margin: 0 }}>
                    {property.collaboratingAgent.firstName} {property.collaboratingAgent.lastName}
                  </p>
                </div>
              )}
            </div>



            {/* Office Info */}
            <div style={{ background: '#f9fafb', borderRadius: '1rem', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Informacione Zyre
              </h3>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>{property.office.name}</strong></p>
                <p style={{ margin: '0 0 0.5rem 0' }}>{property.office.address}</p>
                <p style={{ margin: 0 }}>{property.office.phone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Assignment Modal */}
      <ClientAssignmentModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onAssign={handleClientAssignment}
        currentClient={property.client}
        propertyTitle={property.title}
      />
    </div>
  );
}
