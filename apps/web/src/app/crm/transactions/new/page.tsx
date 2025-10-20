'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPriceWithPreference } from '@/lib/currency';
import CRMHeader from '@/components/crm/CRMHeader';
import { CheckIcon, CurrencyDollarIcon, HomeIcon } from '@heroicons/react/24/outline';
import { flashError, flashSuccess } from '@/lib/notify';

interface User { id: string; firstName: string; lastName: string; role: string; officeId?: string }
interface Option { id: string; label: string }

export default function NewTransactionPage() {
  const [user, setUser] = useState<User | null>(null);
  const currencyPref = useCurrency();
  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState<Option[]>([]);
  const [clients, setClients] = useState<Option[]>([]);
  const [agents, setAgents] = useState<Option[]>([]);

  const [form, setForm] = useState({
    type: 'SALE',
    propertyId: '',
    clientId: '',
    primaryAgentId: '',
    collaboratingAgentId: '',
    splitRatio: 0.5,
    grossAmount: '' as unknown as number | '',
    commissionAmount: '' as unknown as number | '',
    currency: 'EUR',
    closeDate: '',
    contractNumber: '',
    notes: '',
  });

  // Calculate commission splits for preview (automatic calculation)
  const getCommissionPreview = () => {
    const commission = Number(form.commissionAmount) || 0;
    if (commission <= 0) return null;
    
    const superAdminShare = commission * 0.5;
    const remainingCommission = commission * 0.5;
    
    if (form.collaboratingAgentId) {
      return {
        superAdmin: superAdminShare,
        primaryAgent: remainingCommission * 0.5,
        collaboratingAgent: remainingCommission * 0.5,
      };
    } else {
      return {
        superAdmin: superAdminShare,
        primaryAgent: remainingCommission,
        collaboratingAgent: 0,
      };
    }
  };

  // Init user
  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) {
      window.location.href = '/crm';
      return;
    }
    const parsed = JSON.parse(u);
    setUser(parsed);
  }, []);

  // Load selects
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('access_token');
        // Properties
        const pRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties?limit=100&status=LISTED`, { headers: { Authorization: `Bearer ${token}` } });
        const pJson = await pRes.json();
        const pOpts: Option[] = (pJson?.data?.items || pJson?.data?.properties || []).map((p: any) => ({ id: p.id, label: `${p.title} - ${p.city}` }));
        setProperties(pOpts);
        // Clients
        const cRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients?limit=100`, { headers: { Authorization: `Bearer ${token}` } });
        const cJson = await cRes.json();
        const cOpts: Option[] = (cJson?.data?.items || cJson?.data?.clients || []).map((c: any) => ({ id: c.id, label: `${c.firstName} ${c.lastName}` }));
        setClients(cOpts);
        // Agents
        const aRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?role=AGENT,MANAGER`, { headers: { Authorization: `Bearer ${token}` } });
        const aJson = await aRes.json();
        const aOpts: Option[] = (aJson?.data || aJson)?.map((u: any) => ({ id: u.id, label: `${u.firstName} ${u.lastName}` }));
        setAgents(aOpts);
      } catch (e) {
        console.error('Failed to load form options', e);
      }
    };
    load();
  }, []);

  const canSubmit = useMemo(() => {
    return !!(form.type && form.propertyId && form.clientId && form.primaryAgentId && Number(form.grossAmount) > 0 && Number(form.commissionAmount) > 0);
  }, [form]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const payload: any = {
        type: form.type,
        propertyId: form.propertyId,
        clientId: form.clientId,
        primaryAgentId: form.primaryAgentId,
        splitRatio: Number(form.splitRatio),
        grossAmount: Number(form.grossAmount),
        commissionAmount: Number(form.commissionAmount),
        currency: form.currency,
      };
      if (form.collaboratingAgentId) payload.collaboratingAgentId = form.collaboratingAgentId;
      if (form.closeDate) payload.closeDate = form.closeDate;
      if (form.contractNumber) payload.contractNumber = form.contractNumber.trim();
      if (form.notes) payload.notes = form.notes.trim();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message || 'Failed to create transaction');
      }
      flashSuccess('✅ Transaksioni u krijua me sukses!');
      window.location.href = `/crm/transactions/${json.data.id}`;
    } catch (err: any) {
      console.error('Create transaction error:', err);
      flashError(`❌ Gabim: ${err?.message || 'Shtimi i transaksionit dështoi'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f9fafb' }}>
      <CRMHeader currentPage="transactions" user={user} />
      <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Transaksion i Ri</h1>
          <Link href="/crm/transactions">
            Shko tek lista
          </Link>
        </div>

        <form onSubmit={onSubmit} style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Lloji</label>
              <select value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }}>
                <option value="SALE">Shitje</option>
                <option value="RENT">Qira</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Prona</label>
              <select value={form.propertyId} onChange={e => setForm(prev => ({ ...prev, propertyId: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }}>
                <option value="">Zgjidh pronën</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Klienti</label>
              <select value={form.clientId} onChange={e => setForm(prev => ({ ...prev, clientId: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }}>
                <option value="">Zgjidh klientin</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Agjenti Kryesor</label>
              <select value={form.primaryAgentId} onChange={e => setForm(prev => ({ ...prev, primaryAgentId: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }}>
                <option value="">Zgjidh agjentin</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Agjenti Bashkëpunëtor (opsional)</label>
              <select value={form.collaboratingAgentId} onChange={e => setForm(prev => ({ ...prev, collaboratingAgentId: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }}>
                <option value="">Asnjë</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Shuma Bruto</label>
              <input type="number" value={form.grossAmount as any} onChange={e => setForm(prev => ({ ...prev, grossAmount: e.target.value === '' ? '' as any : Number(e.target.value) }))} placeholder="p.sh. 120000" style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Komisioni Total</label>
              <input type="number" value={form.commissionAmount as any} onChange={e => setForm(prev => ({ ...prev, commissionAmount: e.target.value === '' ? '' as any : Number(e.target.value) }))} placeholder="p.sh. 6000" style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Valuta</label>
              <select value={form.currency} onChange={e => setForm(prev => ({ ...prev, currency: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }}>
                <option value="EUR">EUR</option>
                <option value="ALL">ALL</option>
              </select>
            </div>
          </div>

          {/* Commission Preview */}
          {getCommissionPreview() && (
            <div style={{ background: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: 8, padding: '1rem', marginTop: '1rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0c4a6e', marginBottom: '0.75rem', margin: '0 0 0.75rem 0' }}>
                📊 Ndarja Automatike e Komisionit
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: form.collaboratingAgentId ? '1fr 1fr 1fr' : '1fr 1fr', gap: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '0.5rem', background: 'white', borderRadius: 6, border: '1px solid #0ea5e9' }}>
                  <div style={{ fontSize: '0.75rem', color: '#0c4a6e', fontWeight: '500' }}>Super Admin (50%)</div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0c4a6e' }}>
                    €{getCommissionPreview()?.superAdmin.toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.5rem', background: 'white', borderRadius: 6, border: '1px solid #16a34a' }}>
                  <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '500' }}>
                    Agjenti Kryesor ({form.collaboratingAgentId ? '25%' : '50%'})
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#166534' }}>
                    €{getCommissionPreview()?.primaryAgent.toFixed(2)}
                  </div>
                </div>
                {form.collaboratingAgentId && (
                  <div style={{ textAlign: 'center', padding: '0.5rem', background: 'white', borderRadius: 6, border: '1px solid #7c3aed' }}>
                    <div style={{ fontSize: '0.75rem', color: '#581c87', fontWeight: '500' }}>Bashkëpunëtori (25%)</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#581c87' }}>
                      €{getCommissionPreview()?.collaboratingAgent.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', textAlign: 'center' }}>
                Komisionet llogariten automatikisht nga sistemi
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Data e Mbylljes (ops.)</label>
              <input type="date" value={form.closeDate} onChange={e => setForm(prev => ({ ...prev, closeDate: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Nr. Kontratës (ops.)</label>
              <input type="text" value={form.contractNumber} onChange={e => setForm(prev => ({ ...prev, contractNumber: e.target.value }))} placeholder="p.sh. CN-2025-001" style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Shënime (ops.)</label>
              <input type="text" value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Shënime..." style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Link href="/crm/transactions">Anulo</Link>
            <button type="submit" disabled={!canSubmit || submitting} style={{ background: submitting || !canSubmit ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '0.75rem 1.25rem', cursor: submitting || !canSubmit ? 'not-allowed' : 'pointer' }}>
              {submitting ? 'Duke krijuar...' : 'Krijo Transaksion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


