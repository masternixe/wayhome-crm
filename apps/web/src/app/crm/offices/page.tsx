'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CRMHeader from '@/components/crm/CRMHeader';
import apiService from '@/services/apiService';
import { notify } from '@/lib/notify';
import { getOfficeDisplayName } from '@/lib/officeDisplay';

interface Office {
  id: string;
  name: string;
  city: string;
  address: string;
  phone?: string;
  email: string;
  createdAt: string;
  _count: {
    users: number;
    properties: number;
    leads: number;
    clients: number;
    transactions: number;
  };
}

export default function OfficesManagementPage() {
  const { user } = useAuth();
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewOfficeForm, setShowNewOfficeForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
  const [newOffice, setNewOffice] = useState({
    name: '',
    city: '',
    address: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/offices');
      if (response.success) {
        setOffices(response.data);
      }
    } catch (error) {
      notify('Failed to fetch offices', 'error');
      console.error('Failed to fetch offices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newOffice.name || !newOffice.city || !newOffice.address || !newOffice.email) {
      notify('Please fill in all required fields', 'error');
      return;
    }

    setCreating(true);
    try {
      const response = await apiService.post('/offices', newOffice);
      if (response.success) {
        notify('Office created successfully!', 'success');
        setShowNewOfficeForm(false);
        setNewOffice({ name: '', city: '', address: '', phone: '', email: '' });
        fetchOffices();
      }
    } catch (error) {
      notify('Failed to create office', 'error');
      console.error('Failed to create office:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingOffice) return;

    setCreating(true);
    try {
      const response = await apiService.patch(`/offices/${editingOffice.id}`, {
        name: editingOffice.name,
        city: editingOffice.city,
        address: editingOffice.address,
        phone: editingOffice.phone,
        email: editingOffice.email,
      });
      if (response.success) {
        notify('Office updated successfully!', 'success');
        setEditingOffice(null);
        fetchOffices();
      }
    } catch (error) {
      notify('Failed to update office', 'error');
      console.error('Failed to update office:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteOffice = async (officeId: string) => {
    if (!confirm('Are you sure you want to delete this office? This action cannot be undone and will only work if the office has no users or properties.')) {
      return;
    }

    try {
      const response = await apiService.delete(`/offices/${officeId}`);
      if (response.success) {
        notify('Office deleted successfully!', 'success');
        fetchOffices();
      }
    } catch (error: any) {
      notify(error.response?.data?.message || 'Failed to delete office', 'error');
      console.error('Failed to delete office:', error);
    }
  };

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Access Denied</h2>
        <p>Only Super Admins can manage offices.</p>
        <Link href="/crm" style={{ color: '#2563eb', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
      <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
        <CRMHeader />
        
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
                Menaxho Zyrat
              </h1>
              <p style={{ color: '#6b7280', margin: 0 }}>
                Krijo dhe menaxho zyrat e kompanisë
              </p>
            </div>
            <button
              onClick={() => setShowNewOfficeForm(true)}
              style={{
                background: '#2563eb',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>+</span>
              Zyrë e Re
            </button>
          </div>

          {/* Stats Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Total Offices</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{offices.length}</p>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Total Users</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                {offices.reduce((sum, office) => sum + office._count.users, 0)}
              </p>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Total Properties</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                {offices.reduce((sum, office) => sum + office._count.properties, 0)}
              </p>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Total Leads</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                {offices.reduce((sum, office) => sum + office._count.leads, 0)}
              </p>
            </div>
          </div>

          {/* Offices List */}
          {loading ? (
            <div style={{ background: 'white', padding: '3rem', borderRadius: '0.75rem', textAlign: 'center' }}>
              <p style={{ color: '#6b7280' }}>Loading offices...</p>
            </div>
          ) : offices.length === 0 ? (
            <div style={{ background: 'white', padding: '3rem', borderRadius: '0.75rem', textAlign: 'center' }}>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>No offices found</p>
              <button
                onClick={() => setShowNewOfficeForm(true)}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Create Your First Office
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {offices.map((office) => (
                <div
                  key={office.id}
                  style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
                        {getOfficeDisplayName(office)}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        <p style={{ margin: 0 }}>📍 {office.address}, {office.city}</p>
                        <p style={{ margin: 0 }}>📧 {office.email}</p>
                        {office.phone && <p style={{ margin: 0 }}>📞 {office.phone}</p>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setEditingOffice(office)}
                        style={{
                          background: '#f3f4f6',
                          color: '#374151',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteOffice(office.id)}
                        style={{
                          background: '#fef2f2',
                          color: '#dc2626',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                    <div>
                      <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>Users</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{office._count.users}</p>
                    </div>
                    <div>
                      <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>Properties</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{office._count.properties}</p>
                    </div>
                    <div>
                      <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>Leads</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{office._count.leads}</p>
                    </div>
                    <div>
                      <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>Clients</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{office._count.clients}</p>
                    </div>
                    <div>
                      <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>Deals</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{office._count.transactions}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Office Form Modal */}
        {showNewOfficeForm && (
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
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{ 
              background: 'white', 
              borderRadius: '1rem', 
              padding: '2rem', 
              maxWidth: '500px', 
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  Create New Office
                </h3>
                <button
                  onClick={() => setShowNewOfficeForm(false)}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    fontSize: '1.5rem', 
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateOffice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Office Name *
                  </label>
                  <input
                    type="text"
                    value={newOffice.name}
                    onChange={(e) => setNewOffice(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="e.g. Wayhome Vlorë"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    value={newOffice.city}
                    onChange={(e) => setNewOffice(prev => ({ ...prev, city: e.target.value }))}
                    required
                    placeholder="e.g. Vlorë"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Address *
                  </label>
                  <input
                    type="text"
                    value={newOffice.address}
                    onChange={(e) => setNewOffice(prev => ({ ...prev, address: e.target.value }))}
                    required
                    placeholder="e.g. Rruga Pavarësia, Nr. 123"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Phone
                  </label>
                  <input
                    type="text"
                    value={newOffice.phone}
                    onChange={(e) => setNewOffice(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. +355 33 123456"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newOffice.email}
                    onChange={(e) => setNewOffice(prev => ({ ...prev, email: e.target.value }))}
                    required
                    placeholder="e.g. vlore@wayhome.com"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowNewOfficeForm(false)}
                    style={{
                      flex: 1,
                      background: '#f3f4f6',
                      color: '#374151',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    style={{
                      flex: 1,
                      background: creating ? '#9ca3af' : '#2563eb',
                      color: 'white',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: creating ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    {creating ? 'Creating...' : 'Create Office'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Office Form Modal */}
        {editingOffice && (
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
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{ 
              background: 'white', 
              borderRadius: '1rem', 
              padding: '2rem', 
              maxWidth: '500px', 
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  Edit Office
                </h3>
                <button
                  onClick={() => setEditingOffice(null)}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    fontSize: '1.5rem', 
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateOffice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Office Name *
                  </label>
                  <input
                    type="text"
                    value={editingOffice.name}
                    onChange={(e) => setEditingOffice(prev => prev ? { ...prev, name: e.target.value } : null)}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    value={editingOffice.city}
                    onChange={(e) => setEditingOffice(prev => prev ? { ...prev, city: e.target.value } : null)}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Address *
                  </label>
                  <input
                    type="text"
                    value={editingOffice.address}
                    onChange={(e) => setEditingOffice(prev => prev ? { ...prev, address: e.target.value } : null)}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editingOffice.phone || ''}
                    onChange={(e) => setEditingOffice(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editingOffice.email}
                    onChange={(e) => setEditingOffice(prev => prev ? { ...prev, email: e.target.value } : null)}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setEditingOffice(null)}
                    style={{
                      flex: 1,
                      background: '#f3f4f6',
                      color: '#374151',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    style={{
                      flex: 1,
                      background: creating ? '#9ca3af' : '#2563eb',
                      color: 'white',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: creating ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    {creating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

