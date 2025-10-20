'use client';

import { useState, useEffect } from 'react';
import CRMHeader from '@/components/crm/CRMHeader';
import { PhotoIcon, CurrencyDollarIcon, CogIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface SystemSettings {
  EUR_TO_ALL_RATE: number;
  ALL_TO_EUR_RATE: number;
  COMMISSION_SALE_RATE: number;
  COMMISSION_RENT_RATE: number;
  BIDDING_SLOT_DURATION_DAYS: number;
  MAX_BIDDING_SLOTS: number;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // System settings state
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    EUR_TO_ALL_RATE: 97.3,
    ALL_TO_EUR_RATE: 1 / 97.3,
    COMMISSION_SALE_RATE: 0.03,
    COMMISSION_RENT_RATE: 0.5,
    BIDDING_SLOT_DURATION_DAYS: 30,
    MAX_BIDDING_SLOTS: 10
  });
  
  // General settings state
  const [settings, setSettings] = useState({
    siteName: '',
    siteDescription: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    facebookUrl: '',
    instagramUrl: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Only super admins can access settings
      if (parsedUser.role !== 'SUPER_ADMIN') {
        window.location.href = '/crm';
        return;
      }
    } else {
      window.location.href = '/crm';
      return;
    }

    // Fetch all settings
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Fetch general settings
      const settingsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (settingsResponse.ok) {
        const result = await settingsResponse.json();
        if (result.success && result.data) {
          setBackgroundImage(result.data.homepageBackgroundImage || '');
          setSettings(prev => ({
            ...prev,
            siteName: result.data.siteName || '',
            siteDescription: result.data.siteDescription || '',
            contactEmail: result.data.contactEmail || '',
            contactPhone: result.data.contactPhone || '',
            address: result.data.address || '',
            facebookUrl: result.data.facebookUrl || '',
            instagramUrl: result.data.instagramUrl || ''
          }));
        }
      }

      // Fetch system settings (exchange rates, commissions, etc.)
      const systemResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/system-settings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (systemResponse.ok) {
        const systemResult = await systemResponse.json();
        if (systemResult.success && systemResult.data) {
          setSystemSettings(prev => ({
            ...prev,
            ...systemResult.data
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('❌ Please select an image file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('❌ Image size must be less than 10MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/background-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.url) {
          setBackgroundImage(result.data.url);
          alert('✅ Background image updated successfully!');
          
          // Notify other components that background image was updated
          window.dispatchEvent(new CustomEvent('background-image-updated'));
        } else {
          throw new Error(result.message || 'Upload failed');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Background upload error:', error);
      alert(`❌ Failed to upload background: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSystemSettingsChange = (key: keyof SystemSettings, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    setSystemSettings(prev => ({
      ...prev,
      [key]: numValue
    }));
  };

  const handleGeneralSettingsChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSystemSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/system-settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(systemSettings),
      });

      if (response.ok) {
        alert('✅ System settings updated successfully!');
        // Trigger exchange rate update event
        window.dispatchEvent(new CustomEvent('exchange-rate-updated'));
      } else {
        throw new Error('Failed to save system settings');
      }
    } catch (error) {
      console.error('Save system settings error:', error);
      alert('❌ Failed to save system settings');
    } finally {
      setSaving(false);
    }
  };

  const saveGeneralSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert('✅ General settings updated successfully!');
      } else {
        throw new Error('Failed to save general settings');
      }
    } catch (error) {
      console.error('Save general settings error:', error);
      alert('❌ Failed to save general settings');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="settings" user={user} />
      
      <div style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1f2937' }}>
            🔧 Cilësimet e Sistemit
          </h1>

          {/* System Settings - Exchange Rates & Commissions */}
          <div style={{ 
            background: 'white', 
            borderRadius: '0.75rem', 
            padding: '2rem', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <CurrencyDollarIcon style={{ width: '1.5rem', height: '1.5rem', marginRight: '0.5rem', color: '#2563eb' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
                💱 Kurset e Këmbimit & Komisionet
              </h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  EUR → ALL Kursi
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={systemSettings.EUR_TO_ALL_RATE}
                  onChange={(e) => handleSystemSettingsChange('EUR_TO_ALL_RATE', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  ALL → EUR Kursi
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={systemSettings.ALL_TO_EUR_RATE}
                  onChange={(e) => handleSystemSettingsChange('ALL_TO_EUR_RATE', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Komisioni Shitjes (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={systemSettings.COMMISSION_SALE_RATE}
                  onChange={(e) => handleSystemSettingsChange('COMMISSION_SALE_RATE', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Aktual: {(systemSettings.COMMISSION_SALE_RATE * 100).toFixed(2)}%
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Komisioni Qirasë (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={systemSettings.COMMISSION_RENT_RATE}
                  onChange={(e) => handleSystemSettingsChange('COMMISSION_RENT_RATE', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Aktual: {(systemSettings.COMMISSION_RENT_RATE * 100).toFixed(2)}%
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Kohëzgjatja e Slot-it (ditë)
                </label>
                <input
                  type="number"
                  min="1"
                  value={systemSettings.BIDDING_SLOT_DURATION_DAYS}
                  onChange={(e) => handleSystemSettingsChange('BIDDING_SLOT_DURATION_DAYS', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Maksimumi i Slot-eve
                </label>
                <input
                  type="number"
                  min="1"
                  value={systemSettings.MAX_BIDDING_SLOTS}
                  onChange={(e) => handleSystemSettingsChange('MAX_BIDDING_SLOTS', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            <button
              onClick={saveSystemSettings}
              disabled={saving}
              style={{
                marginTop: '1.5rem',
                background: saving ? '#9ca3af' : '#2563eb',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? '⏳ Duke ruajtur...' : '💾 Ruaj Cilësimet e Sistemit'}
            </button>
          </div>

          {/* General Settings */}
          <div style={{ 
            background: 'white', 
            borderRadius: '0.75rem', 
            padding: '2rem', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <CogIcon style={{ width: '1.5rem', height: '1.5rem', marginRight: '0.5rem', color: '#2563eb' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
                ⚙️ Cilësimet e Përgjithshme
              </h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Emri i Faqes
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleGeneralSettingsChange('siteName', e.target.value)}
                  placeholder="WayHome Real Estate"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Email Kontakti
                </label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => handleGeneralSettingsChange('contactEmail', e.target.value)}
                  placeholder="info@wayhome.al"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Telefoni
                </label>
                <input
                  type="text"
                  value={settings.contactPhone}
                  onChange={(e) => handleGeneralSettingsChange('contactPhone', e.target.value)}
                  placeholder="+355 68 504 0201"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Adresa
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => handleGeneralSettingsChange('address', e.target.value)}
                  placeholder="Rruga, Kristo Luarasi ,Lake View Kulla D"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={settings.facebookUrl}
                  onChange={(e) => handleGeneralSettingsChange('facebookUrl', e.target.value)}
                  placeholder="https://www.facebook.com/wayhome.al/"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={settings.instagramUrl}
                  onChange={(e) => handleGeneralSettingsChange('instagramUrl', e.target.value)}
                  placeholder="https://www.instagram.com/wayhome.al/"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Përshkrimi i Faqes
              </label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => handleGeneralSettingsChange('siteDescription', e.target.value)}
                placeholder="Agjencia më e mirë e pasurive të paluajtshme në Shqipëri..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <button
              onClick={saveGeneralSettings}
              disabled={saving}
              style={{
                marginTop: '1.5rem',
                background: saving ? '#9ca3af' : '#10b981',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? '⏳ Duke ruajtur...' : '💾 Ruaj Cilësimet e Përgjithshme'}
            </button>
          </div>

          {/* Homepage Background Image */}
          <div style={{ 
            background: 'white', 
            borderRadius: '0.75rem', 
            padding: '2rem', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <PhotoIcon style={{ width: '1.5rem', height: '1.5rem', marginRight: '0.5rem', color: '#2563eb' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
                📸 Imazhi i Sfondit të Faqes Kryesore
              </h2>
            </div>
            
            {backgroundImage && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Imazhi aktual:
                </p>
                <div style={{ 
                  width: '300px', 
                  height: '200px', 
                  borderRadius: '0.5rem', 
                  overflow: 'hidden',
                  border: '2px solid #e5e7eb'
                }}>
                  <img 
                    src={backgroundImage} 
                    alt="Background preview" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }} 
                  />
                </div>
              </div>
            )}

            <div style={{ 
              border: '2px dashed #d1d5db', 
              borderRadius: '0.75rem', 
              padding: '3rem', 
              textAlign: 'center',
              background: '#f9fafb'
            }}>
              <PhotoIcon style={{ 
                width: '3rem', 
                height: '3rem', 
                margin: '0 auto 1rem', 
                color: '#9ca3af' 
              }} />
              
              <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                Ngarko imazh të ri sfondi
              </h3>
              
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                PNG, JPG, JPEG deri në 10MB. Rekomandohet 1920x1080px ose më të mëdha.
              </p>
              
              <label style={{ 
                display: 'inline-block',
                background: uploading ? '#9ca3af' : '#2563eb',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                {uploading ? '⏳ Duke ngarkuar...' : '📁 Zgjidh Imazhin'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}