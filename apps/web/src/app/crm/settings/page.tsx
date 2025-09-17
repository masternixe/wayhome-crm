'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Cog6ToothIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  TagIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { formatUserRole } from '@/lib/utils';
import CRMHeader from '@/components/crm/CRMHeader';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  officeId?: string;
}

interface SystemSettings {
  commissionSaleRate: number;
  commissionRentRate: number;
  eurToAllRate: number;
  allToEurRate: number;
  maxBiddingSlots: number;
  biddingSlotDurationDays: number;
}

interface Badge {
  id: string;
  name: string;
  color: string;
  description: string;
}

interface Office {
  id: string;
  name: string;
  city: string;
  address: string;
  phone?: string;
  email?: string;
  agentCount: number;
  propertyCount: number;
}

export default function CRMSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SystemSettings>({
    commissionSaleRate: 0.03,
    commissionRentRate: 0.5,
    eurToAllRate: 97.3,
    allToEurRate: 1/97.3,
    maxBiddingSlots: 10,
    biddingSlotDurationDays: 30
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [badges, setBadges] = useState<Badge[]>([
    { id: '1', name: 'Luxury', color: '#7c3aed', description: 'High-end properties' },
    { id: '2', name: 'New', color: '#059669', description: 'Recently listed' },
    { id: '3', name: 'Exclusive', color: '#dc2626', description: 'Exclusive listings' },
    { id: '4', name: 'Sea View', color: '#2563eb', description: 'Properties with sea view' },
    { id: '5', name: 'Garden', color: '#16a34a', description: 'Properties with garden' }
  ]);
  const [offices, setOffices] = useState<Office[]>([
    {
      id: '1',
      name: 'Wayhome Tirana',
      city: 'Tirana',
      address: 'Rruga "Dëshmorët e 4 Shkurtit", Nr. 12',
      phone: '+355 4 2234567',
      email: 'tirana@wayhome.com',
      agentCount: 8,
      propertyCount: 32
    },
    {
      id: '2',
      name: 'Wayhome Durrës',
      city: 'Durrës',
      address: 'Rruga "Taulantia", Nr. 45',
      phone: '+355 52 234567',
      email: 'durres@wayhome.com',
      agentCount: 5,
      propertyCount: 18
    }
  ]);
  const [newBadge, setNewBadge] = useState({ name: '', color: '#2563eb', description: '' });
  const [showNewBadgeForm, setShowNewBadgeForm] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      fetchSettings();
    } else {
      window.location.href = '/crm';
    }
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Fetch system settings from API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Map API settings to state
          const apiSettings = data.data;
          setSettings({
            commissionSaleRate: apiSettings.COMMISSION_SALE_RATE || 0.03,
            commissionRentRate: apiSettings.COMMISSION_RENT_RATE || 0.5,
            eurToAllRate: apiSettings.EUR_TO_ALL_RATE || 97.3,
            allToEurRate: apiSettings.ALL_TO_EUR_RATE || (1/97.3),
            maxBiddingSlots: apiSettings.MAX_BIDDING_SLOTS || 10,
            biddingSlotDurationDays: apiSettings.BIDDING_SLOT_DURATION_DAYS || 30
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Update ALL_TO_EUR_RATE automatically when EUR_TO_ALL_RATE changes
      const updatedSettings = {
        ...settings,
        allToEurRate: 1 / settings.eurToAllRate
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          EUR_TO_ALL_RATE: updatedSettings.eurToAllRate,
          ALL_TO_EUR_RATE: updatedSettings.allToEurRate,
          COMMISSION_SALE_RATE: updatedSettings.commissionSaleRate,
          COMMISSION_RENT_RATE: updatedSettings.commissionRentRate,
          MAX_BIDDING_SLOTS: updatedSettings.maxBiddingSlots,
          BIDDING_SLOT_DURATION_DAYS: updatedSettings.biddingSlotDurationDays
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(updatedSettings);
          
          // Trigger currency rate update event for frontend
          window.dispatchEvent(new CustomEvent('exchange-rate-updated', { 
            detail: { 
              eurToAll: updatedSettings.eurToAllRate,
              allToEur: updatedSettings.allToEurRate
            } 
          }));
          
          alert('✅ Cilësimet u ruajtën me sukses!');
        } else {
          throw new Error(data.message || 'Failed to save settings');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('❌ Gabim gjatë ruajtjes së cilësimeve');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBadge = (e: React.FormEvent) => {
    e.preventDefault();
    const badge: Badge = {
      id: Date.now().toString(),
      ...newBadge
    };
    setBadges(prev => [...prev, badge]);
    setNewBadge({ name: '', color: '#2563eb', description: '' });
    setShowNewBadgeForm(false);
    alert('Badge u shtua me sukses!');
  };

  const handleDeleteBadge = (badgeId: string) => {
    if (confirm('Jeni të sigurt që doni ta fshini këtë badge?')) {
      setBadges(prev => prev.filter(b => b.id !== badgeId));
      alert('Badge u fshi me sukses!');
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const isAdmin = user.role === 'OFFICE_ADMIN' || user.role === 'SUPER_ADMIN';
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  if (!isAdmin) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
        <h2>Qasje e Ndaluar</h2>
        <p>Vetëm administratorët mund të qasen në cilësimet</p>
        <Link href="/crm/dashboard" style={{ color: '#2563eb' }}>Kthehu në dashboard</Link>
      </div>
    );
  }

  const tabs = [
    { id: 'general', name: 'Të Përgjithshme', icon: Cog6ToothIcon },
    { id: 'commission', name: 'Komisionet', icon: CurrencyDollarIcon },
    { id: 'badges', name: 'Badges', icon: TagIcon },
    ...(isSuperAdmin ? [{ id: 'offices', name: 'Zyrat', icon: BuildingOfficeIcon }] : []),
  ];

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="settings" user={user} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
            Cilësimet e Sistemit
          </h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Menaxhoni konfigurimin e sistemit CRM
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
          {/* Settings Navigation */}
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'fit-content' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      width: '100%',
                      padding: '0.75rem',
                      background: activeTab === tab.id ? '#f0f9ff' : 'transparent',
                      color: activeTab === tab.id ? '#2563eb' : '#6b7280',
                      border: activeTab === tab.id ? '1px solid #dbeafe' : '1px solid transparent',
                      borderRadius: '0.5rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: activeTab === tab.id ? '500' : '400',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Icon style={{ width: '1.25rem', height: '1.25rem' }} />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Settings Content */}
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {/* General Settings */}
            {activeTab === 'general' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                  Cilësimet e Përgjithshme
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem', color: '#374151' }}>
                      💱 Këmbimi i Monedhave
                    </h3>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                        1 EUR = ? ALL
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="50"
                        max="150"
                        value={settings.eurToAllRate}
                        onChange={(e) => {
                          const rate = parseFloat(e.target.value);
                          setSettings(prev => ({ 
                            ...prev, 
                            eurToAllRate: rate,
                            allToEurRate: 1 / rate
                          }));
                        }}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '0.5rem',
                          fontSize: '1rem'
                        }}
                        disabled={!isSuperAdmin}
                      />
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>
                        Shkruani sa Lek është 1 Euro (p.sh. 97.3)
                      </p>
                    </div>

                    {/* Real-time conversion examples */}
                    <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '0.75rem', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.75rem', color: '#1e40af' }}>
                        🔄 Shembuj Konvertimi
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>€1,000</span>
                          <span>{(1000 * settings.eurToAllRate).toLocaleString()} ALL</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>€50,000</span>
                          <span>{(50000 * settings.eurToAllRate).toLocaleString()} ALL</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>€150,000</span>
                          <span>{(150000 * settings.eurToAllRate).toLocaleString()} ALL</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
                      1 ALL = €{settings.allToEurRate.toFixed(4)}
                    </div>
                    
                    {!isSuperAdmin && (
                      <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>
                        🔒 Vetëm Super Admin mund ta ndryshojë kursin e këmbimit
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem', color: '#374151' }}>
                      Cilësimet e Promovimit
                    </h3>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                        Maksimumi i Slot-eve të Promovimit
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="20"
                        value={settings.maxBiddingSlots}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxBiddingSlots: parseInt(e.target.value) }))}
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                      />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                        Kohëzgjatja e Slot-it (ditë)
                      </label>
                      <input
                        type="number"
                        min="7"
                        max="90"
                        value={settings.biddingSlotDurationDays}
                        onChange={(e) => setSettings(prev => ({ ...prev, biddingSlotDurationDays: parseInt(e.target.value) }))}
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                      />
                    </div>
                  </div>
                </div>

                {isSuperAdmin && (
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    style={{ 
                      background: saving ? '#9ca3af' : '#2563eb', 
                      color: 'white', 
                      padding: '0.75rem 1.5rem', 
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      marginTop: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {saving && (
                      <ArrowPathIcon 
                        style={{ 
                          width: '1rem', 
                          height: '1rem',
                          animation: 'spin 1s linear infinite'
                        }} 
                      />
                    )}
                    {saving ? 'Duke ruajtur...' : 'Ruaj Ndryshimet'}
                  </button>
                )}
              </div>
            )}

            {/* Commission Settings */}
            {activeTab === 'commission' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                  Politika e Komisioneve
                </h2>

                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem', color: '#1e40af' }}>
                      ℹ️ Si Kalkulohen Komisionet
                    </h3>
                    <ul style={{ color: '#6b7280', fontSize: '0.875rem', paddingLeft: '1.25rem', margin: 0 }}>
                      <li>Shitje: {(settings.commissionSaleRate * 100)}% e çmimit të shitjes</li>
                      <li>Qira: {(settings.commissionRentRate * 100)}% e qirasë mujore</li>
                      <li>Bashkëpunim: ndarje sipas përqindjes së caktuar</li>
                    </ul>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                        Komisioni për Shitje (%)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          max="0.1"
                          value={settings.commissionSaleRate}
                          onChange={(e) => setSettings(prev => ({ ...prev, commissionSaleRate: parseFloat(e.target.value) }))}
                          style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                          disabled={!isSuperAdmin}
                        />
                        <span style={{ 
                          position: 'absolute', 
                          right: '0.75rem', 
                          top: '50%', 
                          transform: 'translateY(-50%)',
                          color: '#6b7280',
                          fontSize: '0.875rem'
                        }}>
                          {(settings.commissionSaleRate * 100).toFixed(1)}%
                        </span>
                      </div>
                      {!isSuperAdmin && (
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>
                          Vetëm Super Admin mund ta ndryshojë
                        </p>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                        Komisioni për Qira (%)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={settings.commissionRentRate}
                          onChange={(e) => setSettings(prev => ({ ...prev, commissionRentRate: parseFloat(e.target.value) }))}
                          style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                          disabled={!isSuperAdmin}
                        />
                        <span style={{ 
                          position: 'absolute', 
                          right: '0.75rem', 
                          top: '50%', 
                          transform: 'translateY(-50%)',
                          color: '#6b7280',
                          fontSize: '0.875rem'
                        }}>
                          {(settings.commissionRentRate * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Commission Examples */}
                  <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '1rem', color: '#374151' }}>
                      🧮 Shembuj Komisioni
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ padding: '1rem', background: 'white', borderRadius: '0.5rem' }}>
                        <h5 style={{ fontWeight: '500', color: '#1f2937', marginBottom: '0.5rem' }}>Shitje €100,000</h5>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                          Komisioni: €{(100000 * settings.commissionSaleRate).toLocaleString()}
                        </p>
                      </div>
                      <div style={{ padding: '1rem', background: 'white', borderRadius: '0.5rem' }}>
                        <h5 style={{ fontWeight: '500', color: '#1f2937', marginBottom: '0.5rem' }}>Qira €800/muaj</h5>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                          Komisioni: €{(800 * settings.commissionRentRate).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {isSuperAdmin && (
                  <button
                    onClick={handleSaveSettings}
                    style={{ 
                      background: '#2563eb', 
                      color: 'white', 
                      padding: '0.75rem 1.5rem', 
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      marginTop: '1rem'
                    }}
                  >
                    Ruaj Politikën e Komisioneve
                  </button>
                )}
              </div>
            )}

            {/* Badge Management */}
            {activeTab === 'badges' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                    Menaxhimi i Badge-ave
                  </h2>
                  <button
                    onClick={() => setShowNewBadgeForm(true)}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: '#2563eb', 
                      color: 'white', 
                      padding: '0.5rem 1rem', 
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                    Badge i Ri
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  {badges.map((badge) => (
                    <div key={badge.id} style={{ 
                      background: '#f9fafb', 
                      padding: '1rem', 
                      borderRadius: '0.75rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                        <span style={{ 
                          background: badge.color, 
                          color: 'white', 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '1rem', 
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          {badge.name}
                        </span>
                        <button
                          onClick={() => handleDeleteBadge(badge.id)}
                          style={{ 
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '0.25rem'
                          }}
                        >
                          <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                        {badge.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* New Badge Form */}
                {showNewBadgeForm && (
                  <div style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    background: 'rgba(0,0,0,0.5)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    zIndex: 1000
                  }}>
                    <div style={{ 
                      background: 'white', 
                      borderRadius: '1rem', 
                      padding: '2rem', 
                      maxWidth: '400px', 
                      width: '90%'
                    }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                        Badge i Ri
                      </h3>
                      
                      <form onSubmit={handleAddBadge} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                            Emri
                          </label>
                          <input
                            type="text"
                            value={newBadge.name}
                            onChange={(e) => setNewBadge(prev => ({ ...prev, name: e.target.value }))}
                            required
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                            Ngjyra
                          </label>
                          <input
                            type="color"
                            value={newBadge.color}
                            onChange={(e) => setNewBadge(prev => ({ ...prev, color: e.target.value }))}
                            style={{ width: '100%', height: '3rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                            Përshkrimi
                          </label>
                          <textarea
                            value={newBadge.description}
                            onChange={(e) => setNewBadge(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', resize: 'vertical' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button
                            type="button"
                            onClick={() => setShowNewBadgeForm(false)}
                            style={{ 
                              flex: 1,
                              background: '#f3f4f6', 
                              color: '#374151', 
                              padding: '0.75rem', 
                              border: '1px solid #d1d5db', 
                              borderRadius: '0.5rem',
                              cursor: 'pointer'
                            }}
                          >
                            Anulo
                          </button>
                          <button
                            type="submit"
                            style={{ 
                              flex: 1,
                              background: '#2563eb', 
                              color: 'white', 
                              padding: '0.75rem', 
                              border: 'none', 
                              borderRadius: '0.5rem',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            Shto Badge
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Office Management (Super Admin Only) */}
            {activeTab === 'offices' && isSuperAdmin && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                    Menaxhimi i Zyrave
                  </h2>
                  <Link
                    href="/crm/offices/new"
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: '#2563eb', 
                      color: 'white', 
                      padding: '0.5rem 1rem', 
                      borderRadius: '0.5rem', 
                      textDecoration: 'none',
                      fontSize: '0.875rem'
                    }}
                  >
                    <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                    Zyrë e Re
                  </Link>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                  {offices.map((office) => (
                    <div key={office.id} style={{ 
                      background: '#f9fafb', 
                      padding: '1.5rem', 
                      borderRadius: '1rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
                            {office.name}
                          </h3>
                          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                            {office.city}
                          </p>
                        </div>
                        <Link
                          href={`/crm/offices/${office.id}/edit`}
                          style={{ 
                            background: '#f0f9ff', 
                            color: '#2563eb', 
                            padding: '0.5rem', 
                            borderRadius: '0.5rem',
                            textDecoration: 'none'
                          }}
                        >
                          <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                        </Link>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', margin: '0 0 0.25rem 0' }}>
                          📍 {office.address}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', margin: '0 0 0.25rem 0' }}>
                          📞 {office.phone}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                          ✉️ {office.email}
                        </p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'white', borderRadius: '0.5rem' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>
                            {office.agentCount}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Agjentë</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'white', borderRadius: '0.5rem' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                            {office.propertyCount}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Prona</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
