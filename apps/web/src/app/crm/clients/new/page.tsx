'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import CRMHeader from '@/components/crm/CRMHeader';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  officeId?: string;
}

export default function NewClientPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    preferredCurrency: 'EUR',
    notes: ''
  });

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('✅ Klienti u krijua me sukses!');
        window.location.href = '/crm/clients';
      } else {
        const errorData = await response.json();
        alert(`❌ Gabim: ${errorData.message || 'Nuk mund të krijohet klienti'}`);
      }
    } catch (error) {
      console.error('Error creating client:', error);
      alert(`❌ Gabim gjatë krijimit të klientit: ${error instanceof Error ? error.message : 'Nuk mund të krijohet klienti'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="clients" user={user} />
      
      {/* Breadcrumb */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
          <Link 
            href="/crm/clients" 
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
            Kthehu te klientët
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {/* Form Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
              👤 Klient i Ri
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Regjistroni një klient të ri në sistemin CRM
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Informacione Personale
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Emri *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                    placeholder="Fatjona"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Mbiemri *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                    placeholder="Hoxha"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Telefoni *
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                    required
                    placeholder="0691234567"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Email (Opsional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="fatjona.hoxha@gmail.com"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                Preferencat
              </h2>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Monedha e Preferuar
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', flex: 1 }}>
                    <input
                      type="radio"
                      name="currency"
                      value="EUR"
                      checked={formData.preferredCurrency === 'EUR'}
                      onChange={(e) => handleInputChange('preferredCurrency', e.target.value)}
                      style={{ width: '1rem', height: '1rem' }}
                    />
                    <span style={{ fontWeight: '500' }}>💶 EUR (Euro)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', flex: 1 }}>
                    <input
                      type="radio"
                      name="currency"
                      value="ALL"
                      checked={formData.preferredCurrency === 'ALL'}
                      onChange={(e) => handleInputChange('preferredCurrency', e.target.value)}
                      style={{ width: '1rem', height: '1rem' }}
                    />
                    <span style={{ fontWeight: '500' }}>🇦🇱 ALL (Lek)</span>
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Shënime (Opsional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={4}
                  placeholder="Shënime për klientin, preferencat, historiku, etj..."
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Preview Card */}
            <div style={{ 
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
              padding: '1.5rem', 
              borderRadius: '1rem',
              border: '1px solid #bae6fd',
              marginBottom: '2rem'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '1rem', color: '#0c4a6e' }}>
                👀 Parashikimi i Klientit
              </h3>
              
              <div style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ 
                    width: '2.5rem', 
                    height: '2.5rem', 
                    background: 'linear-gradient(45deg, #dbeafe, #bfdbfe)', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '1.25rem'
                  }}>
                    👤
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.25rem 0' }}>
                      {formData.firstName || 'Emri'} {formData.lastName || 'Mbiemri'}
                    </h4>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Klient i ri • Krijuar sot
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  <span>📞 {formData.mobile || 'Telefoni'}</span>
                  {formData.email && <span>✉️ {formData.email}</span>}
                  <span>💰 {formData.preferredCurrency}</span>
                </div>
                
                {formData.notes && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>SHËNIM:</div>
                    <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}>
                      {formData.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '1rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
              <Link
                href="/crm/clients"
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
                {loading ? '⏳ Duke ruajtur...' : '👤 Krijo Klient'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
