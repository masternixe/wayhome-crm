'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PhotoIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { flashSuccess, flashError } from '@/lib/notify';
import CRMHeader from '@/components/crm/CRMHeader';
import PropertyDocumentManager from '@/components/crm/PropertyDocumentManager';
import ImageUploadGallery from '@/components/crm/ImageUploadGallery';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  officeId?: string;
}

const propertyTypes = [
  { value: 'APARTMENT', label: 'Apartament' },
  { value: 'HOUSE', label: 'Shtëpi' },
  { value: 'VILLA', label: 'Vilë' },
  { value: 'COMMERCIAL', label: 'Komerciale' },
  { value: 'OFFICE', label: 'Zyrë' },
  { value: 'LAND', label: 'Tokë' }
];

const availableBadges = ['New', 'Luxury', 'Exclusive', 'Sea View', 'Garden', 'Pool', 'Central', 'Furnished', 'Investment'];

export default function NewPropertyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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

    ashensor: false,
    balcony: false,
    garden: false,
    yearBuilt: new Date().getFullYear(),
    parkingSpaces: 0,
    badges: [] as string[],
    featured: false,
    gallery: [] as string[],
    virtualTourUrl: '',
    collaboratingAgentId: ''
  });
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      window.location.href = '/crm';
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        flashSuccess('✅ Prona u krijua me sukses!');
        window.location.href = '/crm/properties';
      } else {
        const errorData = await response.json();
        flashError(`❌ Gabim: ${errorData.message || 'Nuk mund të krijohet prona'}`);
      }
    } catch (error) {
      console.error('Error creating property:', error);
      flashError(`❌ Gabim gjatë krijimit të pronës: ${error instanceof Error ? error.message : 'Nuk mund të krijohet prona'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
                    min="1000"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
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
