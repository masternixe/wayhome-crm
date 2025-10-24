'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PhotoIcon, PlusIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { flashSuccess, flashError } from '@/lib/notify';
import CRMHeader from '@/components/crm/CRMHeader';
import PropertyDocumentManager from '@/components/crm/PropertyDocumentManager';
import ImageUploadGallery from '@/components/crm/ImageUploadGallery';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  officeId?: string;
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

const listingTypes = [
  { value: 'SALE', label: 'Shitje' },
  { value: 'RENT', label: 'Qira' }
];

const availableBadges = ['New', 'Luxury', 'Exclusive', 'Sea View', 'Garden', 'Pool', 'Central', 'Furnished', 'Investment'];

export default function NewPropertyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [agents, setAgents] = useState<User[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'APARTMENT',
    listingType: 'SALE',
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
    agentOwnerId: '',
    collaboratingAgentId: '',
    clientId: ''
  });
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      window.location.href = '/crm';
    }
    fetchAgents();
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Clients API response:', result); // Debug log
        
        // Handle different response structures
        let clientsData = [];
        if (result.success && result.data) {
          // If it's a paginated response with clients array
          clientsData = result.data.clients || result.data || [];
        } else if (result.data) {
          clientsData = result.data;
        } else if (Array.isArray(result)) {
          clientsData = result;
        }
        
        console.log('Processed clients data:', clientsData); // Debug log
        setClients(Array.isArray(clientsData) ? clientsData : []);
      } else {
        console.error('Failed to fetch clients - response not ok:', response.status);
        setClients([]);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      setClients([]);
    }
  };

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?role=AGENT,MANAGER`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        // Filter out soft deleted agents (status !== 'ACTIVE')
        const activeAgents = (result.data || []).filter((agent: User) => agent.status === 'ACTIVE');
        setAgents(activeAgents);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.city || !formData.zona || !formData.address) {
        alert('❌ Plotësoni të gjitha fushat e detyrueshme.');
        setLoading(false);
        return;
      }

      // Ensure numeric fields are valid and add missing required fields
      const cleanedFormData = {
        ...formData,
        listingType: 'SALE', // Add missing required field
        price: isNaN(formData.price) ? 50000 : formData.price,
        bedrooms: isNaN(formData.bedrooms) ? 1 : formData.bedrooms,
        bathrooms: isNaN(formData.bathrooms) ? 1 : formData.bathrooms,
        siperfaqeMin: isNaN(formData.siperfaqeMin) ? 50 : formData.siperfaqeMin,
        siperfaqeMax: isNaN(formData.siperfaqeMax) ? 50 : formData.siperfaqeMax,
        yearBuilt: isNaN(formData.yearBuilt) ? new Date().getFullYear() : Math.min(formData.yearBuilt, new Date().getFullYear()),
        parkingSpaces: isNaN(formData.parkingSpaces) ? 0 : formData.parkingSpaces,
        // Fix gallery URLs by encoding spaces and special characters
        gallery: formData.gallery.map(url => encodeURI(url.replace(/\s+/g, '%20'))),
        // Clean virtual tour URL
        virtualTourUrl: formData.virtualTourUrl?.trim() || undefined,
        // Agent assignments
        agentOwnerId: formData.agentOwnerId?.trim() || undefined,
        collaboratingAgentId: formData.collaboratingAgentId?.trim() || undefined,
        // Client assignment
        clientId: formData.clientId?.trim() || undefined,
      };

      console.log('Submitting property data:', cleanedFormData);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedFormData),
      });

      if (response.ok) {
        const data = await response.json();
        alert('✅ Prona u krijua me sukses!');
        window.location.href = '/crm/properties';
      } else {
        const errorData = await response.json();
        console.error('❌ Server response:', errorData);
        alert(`❌ Gabim: ${errorData.message || 'Nuk mund të krijohet prona'}\n\nDetajet: ${JSON.stringify(errorData.errors || {}, null, 2)}`);
      }
    } catch (error) {
      console.error('Error creating property:', error);
      flashError(`❌ Gabim gjatë krijimit të pronës: ${error instanceof Error ? error.message : 'Nuk mund të krijohet prona'}`);
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


  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="properties" user={user} />
      
      {/* Breadcrumb */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
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
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {/* Form Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
              Shto Pronë të Re
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Plotësoni të dhënat e pronës për ta shtuar në sistem
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
                    Shitje ose Qira *
                  </label>
                  <select
                    value={formData.listingType}
                    onChange={(e) => handleInputChange('listingType', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  >
                    {listingTypes.map(type => (
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

            {/* Agent Assignment */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              {/* Primary Agent */}
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Agjenti Kryesor *
                </label>
                <select
                  value={formData.agentOwnerId}
                  onChange={(e) => handleInputChange('agentOwnerId', e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  required
                >
                  <option value="">Zgjidh Agjentin...</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.firstName} {agent.lastName} ({agent.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Collaborating Agent */}
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Agjenti Bashkëpunues (Opsional)
                </label>
                <select
                  value={formData.collaboratingAgentId}
                  onChange={(e) => handleInputChange('collaboratingAgentId', e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                >
                  <option value="">Zgjidh Agjentin...</option>
                  {agents.filter(agent => agent.id !== formData.agentOwnerId).map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.firstName} {agent.lastName} ({agent.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Client Assignment */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                Pronari (Opsional)
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => handleInputChange('clientId', e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
              >
                <option value="">Zgjidh Pronarin...</option>
                {Array.isArray(clients) && clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.firstName} {client.lastName} - {client.mobile || 'N/A'}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Mund të lini bosh dhe ta caktoni më vonë
              </p>
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
              />
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '1rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
              <Link
                href="/crm/properties"
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
                {loading ? '⏳ Duke ruajtur...' : '✅ Krijo Pronën'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
