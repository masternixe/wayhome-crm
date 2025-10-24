'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/20/solid';
import CRMHeader from '@/components/crm/CRMHeader';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AgentForm {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  officeId?: string | null;
  avatar?: string | null;
}

export default function AgentEditPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AgentForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'AGENT',
    status: 'ACTIVE',
    officeId: null,
    avatar: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      window.location.href = '/crm';
      return;
    }
    loadAgent();
  }, [params.id]);

  const loadAgent = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to load agent');
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      const a = data.data;
      setForm({
        firstName: a.firstName || '',
        lastName: a.lastName || '',
        email: a.email || '',
        phone: a.phone || '',
        role: a.role || 'AGENT',
        status: a.status || 'ACTIVE',
        officeId: a.officeId || null,
        avatar: a.avatar || ''
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('❌ Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('❌ Image size must be less than 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      if (result.success && result.data?.url) {
        setForm({ ...form, avatar: result.data.url });
        alert('✅ Avatar uploaded successfully!');
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert(`❌ Failed to upload avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const body: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
        avatar: form.avatar || null,
      };
      // Only admins can change role/status/office; allow UI but backend will enforce
      body.role = form.role;
      body.status = form.status;
      body.officeId = form.officeId;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to save agent');
      }
      alert('✅ Agjenti u përditësua me sukses!');
      window.location.href = `/crm/agents/${params.id}`;
    } catch (e) {
      alert(`❌ Gabim: ${e instanceof Error ? e.message : 'Nuk u ruajt'}`);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Duke ngarkuar agjentin...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="agents" user={user} />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <Link href={`/crm/agents/${params.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem' }}>
            <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
            Kthehu te detajet
          </Link>
        </div>

        <form onSubmit={onSave} style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 1.5rem 0' }}>Ndrysho Agjentin</h1>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Emri *</label>
              <input type="text" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Mbiemri *</label>
              <input type="text" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Email</label>
              <input type="email" disabled value={form.email} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', background: '#f9fafb' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Telefoni</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Roli</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                <option value="AGENT">Agent</option>
                <option value="MANAGER">Manager</option>
                <option value="OFFICE_ADMIN">Office Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Statusi</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AgentForm['status'] })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                <option value="ACTIVE">Aktiv</option>
                <option value="INACTIVE">Joaktiv</option>
                <option value="SUSPENDED">Pezulluar</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Avatar</label>
            
            {/* Current Avatar Preview */}
            {form.avatar && (
              <div style={{ marginBottom: '1rem' }}>
                <img 
                  src={form.avatar} 
                  alt="Current Avatar" 
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    objectFit: 'cover',
                    border: '2px solid #e5e7eb'
                  }} 
                />
              </div>
            )}
            
            {/* File Upload */}
            <input 
              type="file" 
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.5rem', 
                fontSize: '0.875rem',
                marginBottom: '0.5rem'
              }} 
            />
            
            {/* Manual URL Input (fallback) */}
            <input 
              type="url" 
              value={form.avatar || ''} 
              onChange={(e) => setForm({ ...form, avatar: e.target.value })} 
              placeholder="Or enter image URL manually..." 
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.5rem', 
                fontSize: '0.875rem' 
              }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => (window.location.href = `/crm/agents/${params.id}`)} disabled={saving} style={{ flex: 1, background: '#f3f4f6', color: '#374151', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer' }}>
              Anulo
            </button>
            <button type="submit" disabled={saving} style={{ flex: 2, background: '#2563eb', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '0.5rem', fontWeight: '500', cursor: 'pointer' }}>
              {saving ? 'Duke ruajtur...' : 'Ruaj Ndryshimet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


