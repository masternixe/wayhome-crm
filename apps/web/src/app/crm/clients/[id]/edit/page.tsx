'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import CRMHeader from '@/components/crm/CRMHeader';
import ClientDocumentManager from '@/components/crm/ClientDocumentManager';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface ClientForm {
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  preferredCurrency: 'EUR' | 'ALL';
  notes?: string;
}

export default function ClientEditPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ClientForm>({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    preferredCurrency: 'EUR',
    notes: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      window.location.href = '/crm';
      return;
    }
    loadClient();
  }, [params.id]);

  const loadClient = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to load client');
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      const c = data.data;
      setForm({
        firstName: c.firstName || '',
        lastName: c.lastName || '',
        mobile: c.mobile || '',
        email: c.email || '',
        preferredCurrency: (c.preferredCurrency as 'EUR' | 'ALL') || 'EUR',
        notes: c.notes || '',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Clean payload: convert empty optional fields to undefined to satisfy validation
      const cleaned = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        mobile: form.mobile.trim(),
        email: form.email && form.email.trim() !== '' ? form.email.trim() : undefined,
        preferredCurrency: form.preferredCurrency,
        notes: form.notes && form.notes.trim() !== '' ? form.notes.trim() : undefined,
      };

      const token = localStorage.getItem('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleaned),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to save client');
      }
      alert('✅ Klienti u përditësua me sukses!');
      window.location.href = `/crm/clients/${params.id}`;
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
        <p>Duke ngarkuar klientin...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="clients" user={user} />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <Link href={`/crm/clients/${params.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem' }}>
            <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
            Kthehu te detajet
          </Link>
        </div>

        <form onSubmit={onSave} style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 1.5rem 0' }}>Edito Klientin</h1>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Emri *</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Mbiemri *</label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Telefoni *</label>
              <input
                type="tel"
                required
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Monedha e Preferuar</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="currency" value="EUR" checked={form.preferredCurrency === 'EUR'} onChange={() => setForm({ ...form, preferredCurrency: 'EUR' })} />
                <span>EUR</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="currency" value="ALL" checked={form.preferredCurrency === 'ALL'} onChange={() => setForm({ ...form, preferredCurrency: 'ALL' })} />
                <span>ALL</span>
              </label>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Shënime</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Shënime ose detaje shtesë për klientin..."
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', resize: 'vertical' }}
            />
          </div>

          {/* Client Documents */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            <ClientDocumentManager clientId={params.id} />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => (window.location.href = `/crm/clients/${params.id}`)}
              disabled={saving}
              style={{ flex: 1, background: '#f3f4f6', color: '#374151', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer' }}
            >
              Anulo
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ flex: 2, background: '#2563eb', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '0.5rem', fontWeight: '500', cursor: 'pointer' }}
            >
              {saving ? 'Duke ruajtur...' : 'Ruaj Ndryshimet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


