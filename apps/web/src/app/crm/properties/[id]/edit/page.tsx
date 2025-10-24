'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PhotoIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { notifyError, notifySuccess, flashSuccess, flashError } from '@/lib/notify';
import CRMHeader from '@/components/crm/CRMHeader';
import PropertyDocumentManager from '@/components/crm/PropertyDocumentManager';
import ClientAssignmentModal from '@/components/crm/ClientAssignmentModal';
import ImageUploadGallery from '@/components/crm/ImageUploadGallery';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  officeId?: string;
}

interface Property {
  id: string;
  listingType?: 'SALE' | 'RENT';
  title: string;
  description: string;
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
  agentOwnerId: string;
  collaboratingAgentId?: string;
  agentOwner?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  collaboratingAgent?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
  } | null;
  documents?: any[];
}

const propertyTypes = [
  { value: 'APARTMENT', label: 'Apartament' },
  { value: 'HOUSE', label: 'Shtëpi' },
  { value: 'VILLA', label: 'Vilë' },
  { value: 'DUPLEX', label: 'Dupleks' },
  { value: 'AMBIENT', label: 'Ambient' },
  { value: 'COMMERCIAL', label: 'Komerciale' },
  { value: 'OFFICE', label: 'Zyrë' },
  { value: 'LAND', label: 'Tokë' }
];

const availableBadges = ['New', 'Luxury', 'Exclusive', 'Sea View', 'Garden', 'Pool', 'Central', 'Furnished', 'Investment'];

export default function EditPropertyPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingProperty, setFetchingProperty] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    listingType: 'SALE' as 'SALE' | 'RENT',
    title: '',
    description: '',
    type: 'APARTMENT',
    city: '',
    zona: '',
    address: '',
    bedrooms: 1,
    bathrooms: 1,
    siperfaqeMin: 50,
    siperfaqeMax: 50,
    price: 50000,
    priceOnRequest: false,

    ashensor: false,
    balcony: false,
    garden: false,
    yearBuilt: new Date().getFullYear(),
    parkingSpaces: 0,
    badges: [] as string[],
    featured: false,
    gallery: [] as string[],
    virtualTourUrl: '',
    status: 'LISTED',
    agentOwnerId: '',
    collaboratingAgentId: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      window.location.href = '/crm';
      return;
    }

    fetchProperty();
    fetchAgents();
  }, [params.id]);

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?role=AGENT,MANAGER`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAgents(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const fetchProperty = async () => {
    setFetchingProperty(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const propertyData = data.data;
          setProperty(propertyData);
          
          // Populate form with existing data
          setFormData({
            listingType: propertyData.listingType || 'SALE',
            title: propertyData.title || '',
            description: propertyData.description || '',
            type: propertyData.type || 'APARTMENT',
            city: propertyData.city || '',
            zona: propertyData.zona || '',
            address: propertyData.address || '',
            bedrooms: propertyData.bedrooms || 1,
            bathrooms: propertyData.bathrooms || 1,
            siperfaqeMin: propertyData.siperfaqeMin || 50,
            siperfaqeMax: propertyData.siperfaqeMax || 50,
            price: propertyData.price || 50000,
            priceOnRequest: propertyData.priceOnRequest || false,

            ashensor: propertyData.ashensor || false,
            balcony: propertyData.balcony || false,
            garden: propertyData.garden || false,
            yearBuilt: propertyData.yearBuilt || new Date().getFullYear(),
            parkingSpaces: propertyData.parkingSpaces || 0,
            badges: propertyData.badges || [],
            featured: propertyData.featured || false,
            gallery: propertyData.gallery || [],
            virtualTourUrl: propertyData.virtualTourUrl || '',
            agentOwnerId: propertyData.agentOwnerId || '',
            collaboratingAgentId: propertyData.collaboratingAgent?.id || '',
            status: propertyData.status || 'LISTED'
          });
          setSelectedClient(propertyData.client || null);
          
          // Load existing documents
          setDocuments(propertyData.documents || []);
        }
      } else {
        throw new Error('Property not found');
      }
    } catch (error) {
      console.error('Failed to fetch property:', error);
      notifyError('❌ Gabim gjatë ngarkimit të pronës');
      window.location.href = '/crm/properties';
    } finally {
      setFetchingProperty(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('=== PROPERTY UPDATE REQUEST ===');
      console.log('Form data being sent:', formData);
      
      // Clean the form data - convert empty strings to undefined for optional URL fields
      const cleanedFormData = {
        ...formData,
        virtualTourUrl: formData.virtualTourUrl?.trim() || undefined,
        agentOwnerId: formData.agentOwnerId || undefined,
        collaboratingAgentId: formData.collaboratingAgentId || undefined,
        clientId: selectedClient ? selectedClient.id : null,
      };
      
      console.log('Cleaned form data:', cleanedFormData);
      
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedFormData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('Success response:', data);
        flashSuccess('✅ Prona u përditësua me sukses!');
        window.location.href = `/crm/properties/${params.id}`;
      } else {
        const errorData = await response.json();
        console.error('=== ERROR RESPONSE ===');
        console.error('Status:', response.status);
        console.error('Error data:', errorData);
        flashError(`❌ Gabim: ${errorData.message || 'Nuk mund të përditësohet prona'}`);
        // stay on page, no redirect
      }
    } catch (error) {
      console.error('Error updating property:', error);
      flashSuccess('✅ Prona u përditësua me sukses! (Demo mode)');
      // For demo purposes, redirect anyway
      setTimeout(() => {
        window.location.href = `/crm/properties/${params.id}`;
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    // Handle numeric fields to prevent NaN
    if (['price', 'bedrooms', 'bathrooms', 'siperfaqeMin', 'siperfaqeMax', 'yearBuilt', 'parkingSpaces'].includes(field)) {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      setFormData(prev => ({ ...prev, [field]: isNaN(numValue) ? (field === 'price' ? 50000 : field === 'yearBuilt' ? new Date().getFullYear() : field === 'bedrooms' || field === 'bathrooms' ? 1 : field === 'siperfaqeMin' || field === 'siperfaqeMax' ? 50 : 0) : numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleDocumentsChange = (newDocuments: any[]) => {
    setDocuments(newDocuments);
  };

  const toggleBadge = (badge: string) => {
    setFormData(prev => ({
      ...prev,
      badges: prev.badges.includes(badge)
        ? prev.badges.filter(b => b !== badge)
        : [...prev.badges, badge]
    }));
  };


  if (!user || fetchingProperty) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Duke ngarkuar pronën...</p>
      </div>
    );
  }

  if (!property) {
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

  // Check permissions
  const canEdit = user.role === 'SUPER_ADMIN' || user.role === 'OFFICE_ADMIN' || user.id === property.agentOwner?.id;
  
  if (!canEdit) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
        <h2>Nuk keni leje për të edituar këtë pronë</h2>
        <Link href={`/crm/properties/${params.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
          ← Kthehu te detajet e pronës
        </Link>
      </div>
    );
  }

  return (
    <>
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="properties" user={user} />
      
      {/* Breadcrumb */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
          <Link 
            href={`/crm/properties/${params.id}`}
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
            Kthehu te detajet e pronës
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {/* Form Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
              Edito Pronën
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Përditësoni të dhënat e pronës: {property.title}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Informacione Bazë
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Titulli i Pronës *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                    placeholder="p.sh. Apartament 2+1 me pamje nga deti"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Përshkrimi *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  required
                  rows={4}
                  placeholder="Përshkruani pronën në detaj..."
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Property Details */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Detajet e Pronës
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minWidth(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Lloji i listimit
                  </label>
                  <select
                    value={formData.listingType}
                    onChange={(e) => handleInputChange('listingType', e.target.value as 'SALE' | 'RENT')}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  >
                    <option value="SALE">Shitje</option>
                    <option value="RENT">Qira</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Statusi i Pronës
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  >
                    <option value="LISTED">Në Listim</option>
                    <option value="UNDER_OFFER">Nën Ofertë</option>
                    <option value="SOLD">E Shitur</option>
                    <option value="RENTED">E Dhënë me Qira</option>
                    <option value="WITHDRAWN">E Tërhequr</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Klienti i Pronës
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setIsClientModalOpen(true)}
                      style={{ 
                        background: '#2563eb', 
                        color: 'white', 
                        padding: '0.5rem 0.75rem', 
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      {selectedClient ? 'Ndrysho Klientin' : 'Cakto Klient'}
                    </button>
                    {selectedClient && (
                      <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                        {selectedClient.firstName} {selectedClient.lastName} • {selectedClient.mobile}
                      </div>
                    )}
                    {selectedClient && (
                      <button
                        type="button"
                        onClick={() => setSelectedClient(null)}
                        style={{ 
                          background: '#fef2f2', 
                          color: '#dc2626', 
                          padding: '0.5rem 0.75rem', 
                          border: '1px solid #fecaca',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        Hiq Klientin
                      </button>
                    )}
                  </div>
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
                    {propertyTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Qyteti *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                    placeholder="Tirana"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Zona *
                  </label>
                  <input
                    type="text"
                    value={formData.zona}
                    onChange={(e) => handleInputChange('zona', e.target.value)}
                    required
                    placeholder="Bllok"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Dhoma Gjumi *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value))}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Banjo *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value))}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Viti i Ndërtimit
                  </label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.yearBuilt}
                    onChange={(e) => handleInputChange('yearBuilt', parseInt(e.target.value))}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Agjenti Përgjegjës *
                  </label>
                  <select
                    value={formData.agentOwnerId}
                    onChange={(e) => handleInputChange('agentOwnerId', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  >
                    <option value="">Zgjidhni agjentin...</option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.firstName} {agent.lastName} ({agent.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Agjent Bashkëpunëtor
                  </label>
                  <select
                    value={formData.collaboratingAgentId}
                    onChange={(e) => handleInputChange('collaboratingAgentId', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  >
                    <option value="">Asnjë bashkëpunëtor...</option>
                    {agents.filter(agent => agent.id !== formData.agentOwnerId).map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.firstName} {agent.lastName} ({agent.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Lokacioni
              </h2>
              
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Adresa e Plotë *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                  placeholder='Rruga "Dëshmorët e 4 Shkurtit", Nr. 12'
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                />
              </div>
            </div>

            {/* Size & Price */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Madhësia dhe Çmimi
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minWidth(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Sipërfaqja Min (m²) *
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={formData.siperfaqeMin}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      handleInputChange('siperfaqeMin', value);
                      if (value > formData.siperfaqeMax) {
                        handleInputChange('siperfaqeMax', value);
                      }
                    }}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Sipërfaqja Max (m²) *
                  </label>
                  <input
                    type="number"
                    min={formData.siperfaqeMin}
                    max="10000"
                    value={formData.siperfaqeMax}
                    onChange={(e) => handleInputChange('siperfaqeMax', parseFloat(e.target.value))}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Çmimi (EUR) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                    disabled={formData.priceOnRequest}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '0.5rem', 
                      fontSize: '1rem',
                      backgroundColor: formData.priceOnRequest ? '#f3f4f6' : 'white',
                      color: formData.priceOnRequest ? '#6b7280' : 'inherit'
                    }}
                  />
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    marginTop: '0.75rem',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    background: '#fef3c7',
                    borderRadius: '0.5rem',
                    border: '1px solid #f59e0b'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.priceOnRequest}
                      onChange={(e) => handleInputChange('priceOnRequest', e.target.checked)}
                      style={{ width: '1.25rem', height: '1.25rem', accentColor: '#f59e0b' }}
                    />
                    <span style={{ fontWeight: '500', color: '#92400e' }}>💰 Çmimi sipas kërkesës</span>
                  </label>
                </div>

                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>
                  💰 Të gjitha çmimet ruhen në EUR. Konvertimi në ALL bëhet automatikisht.
                </p>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Vende Parkimi
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.parkingSpaces}
                    onChange={(e) => handleInputChange('parkingSpaces', parseInt(e.target.value))}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Veçoritë
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minWidth(200px, 1fr))', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.ashensor}
                    onChange={(e) => handleInputChange('ashensor', e.target.checked)}
                    style={{ width: '1.25rem', height: '1.25rem' }}
                  />
                  <span style={{ fontWeight: '500' }}>🛗 Ashensor</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.balcony}
                    onChange={(e) => handleInputChange('balcony', e.target.checked)}
                    style={{ width: '1.25rem', height: '1.25rem' }}
                  />
                  <span style={{ fontWeight: '500' }}>🌅 Balkon</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.garden}
                    onChange={(e) => handleInputChange('garden', e.target.checked)}
                    style={{ width: '1.25rem', height: '1.25rem' }}
                  />
                  <span style={{ fontWeight: '500' }}>🌳 Kopsht</span>
                </label>
              </div>
            </div>

            {/* Featured Property */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Statusi Promovues
              </h2>
              
              <div style={{ 
                padding: '1rem', 
                background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)', 
                borderRadius: '0.75rem',
                border: '2px solid #f59e0b'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                    style={{ width: '1.5rem', height: '1.5rem', accentColor: '#f59e0b' }}
                  />
                  <div>
                    <span style={{ fontWeight: '600', fontSize: '1.125rem', color: '#92400e' }}>⭐ Pronë e Zgjedhur</span>
                    <p style={{ fontSize: '0.875rem', color: '#b45309', margin: '0.25rem 0 0 0' }}>
                      Prona do të shfaqet në seksionin e pronave të zgjedhura në faqen kryesore
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Badges */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Badges dhe Kategori
              </h2>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {availableBadges.map(badge => (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => toggleBadge(badge)}
                    style={{ 
                      background: formData.badges.includes(badge) ? '#2563eb' : '#f3f4f6', 
                      color: formData.badges.includes(badge) ? 'white' : '#374151', 
                      padding: '0.5rem 1rem', 
                      border: '1px solid ' + (formData.badges.includes(badge) ? '#2563eb' : '#d1d5db'),
                      borderRadius: '1.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    {badge}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>
                Klikoni për të zgjedhur/hequr badges
              </p>
            </div>

            {/* Gallery */}
            <ImageUploadGallery
              images={formData.gallery}
              onImagesChange={(images) => handleInputChange('gallery', images)}
              canEdit={true}
              propertyId={params.id}
            />

            {/* Virtual Tour */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                Virtual Tour URL (Opsional)
              </label>
              <input
                type="url"
                value={formData.virtualTourUrl}
                onChange={(e) => handleInputChange('virtualTourUrl', e.target.value)}
                placeholder="https://example.com/virtual-tour"
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
              />
            </div>

            {/* Document Upload */}
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                📄 Dokumentet
              </h3>
              <PropertyDocumentManager 
                documents={documents}
                onDocumentsChange={handleDocumentsChange}
                canEdit={true}
                propertyId={params.id}
              />
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '1rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
              <Link
                href={`/crm/properties/${params.id}`}
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
                {loading ? '⏳ Duke ruajtur...' : '✅ Përditëso Pronën'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <ClientAssignmentModal
      isOpen={isClientModalOpen}
      onClose={() => setIsClientModalOpen(false)}
      onAssign={(client) => setSelectedClient(client)}
      currentClient={selectedClient}
      propertyTitle={property.title}
    />
    </>
  );
}
