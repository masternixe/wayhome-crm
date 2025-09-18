import React, { useEffect, useRef, useState } from 'react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, DocumentIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { notifyError, notifySuccess } from '@/lib/notify';

interface ClientDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface ClientDocumentManagerProps {
  clientId: string;
}

export default function ClientDocumentManager({ clientId }: ClientDocumentManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Best-effort load by listing from folder is not available; rely on client state if added later
    // For now, keep an empty list until you extend API to list client files from DB
  }, [clientId]);

  const openFileDialog = () => fileInputRef.current?.click();

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleUpload(files);
    }
    event.target.value = '';
  };

  const handleUpload = async (files: FileList) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));
      formData.append('clientId', clientId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/client-documents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to upload documents');
      }
      const result = await response.json();
      if (!result.success || !Array.isArray(result.data)) {
        throw new Error(result.message || 'Upload failed');
      }

      const uploadedDocs: ClientDocument[] = result.data.map((d: any) => ({
        id: d.id,
        name: d.originalName || d.name || 'document',
        url: d.url,
        type: d.type || '',
        size: d.size || 0,
        uploadedAt: d.uploadedAt || new Date().toISOString(),
      }));

      setDocuments((prev) => [...prev, ...uploadedDocs]);
      notifySuccess(`✅ U ngarkuan ${uploadedDocs.length} dokumente klienti!`);
    } catch (e) {
      console.error('Client docs upload error:', e);
      notifyError('❌ Gabim gjatë ngarkimit të dokumenteve të klientit');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: ClientDocument) => {
    try {
      const filename = doc.url.split('/').pop();
      if (!filename) throw new Error('Invalid filename');
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/client-document/${clientId}/${filename}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Delete failed');
      }
      setDocuments((prev) => prev.filter((d) => d.url !== doc.url));
      notifySuccess('✅ Dokumenti u fshi');
    } catch (e) {
      console.error('Delete error:', e);
      notifyError('❌ Gabim gjatë fshirjes së dokumentit');
    }
  };

  const handleDownload = async (doc: ClientDocument) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(doc.url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const dl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = dl;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(dl);
    } catch (e) {
      console.error('Download error:', e);
      notifyError('❌ Gabim gjatë shkarkimit të dokumentit');
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  return (
    <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: 0 }}>📎 Dokumentet e Klientit</h3>
        <div style={{ position: 'relative' }}>
          <input ref={fileInputRef} type="file" multiple onChange={handleFileInput} style={{ display: 'none' }} />
          <button type="button" onClick={openFileDialog} disabled={uploading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: uploading ? '#9ca3af' : '#2563eb', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer' }}>
            {uploading ? '⏳' : <ArrowUpTrayIcon style={{ width: '1rem', height: '1rem' }} />}
            {uploading ? 'Duke ngarkuar...' : 'Ngarko Dokumente'}
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280', border: '1px dashed #e5e7eb', borderRadius: '0.75rem' }}>
          <DocumentIcon style={{ width: '2rem', height: '2rem', color: '#9ca3af' }} />
          <div style={{ marginTop: '0.5rem' }}>Asnjë dokument. Ngarkoni ID, kontrata, etj.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {documents.map((doc) => (
            <div key={doc.url} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 120px 120px', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#fafafa' }}>
              <div style={{ fontSize: '1.25rem', textAlign: 'center' }}>📄</div>
              <div>
                <div style={{ fontWeight: 600, color: '#111827' }}>{doc.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()}</div>
              </div>
              <div className="actions" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <a href={doc.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', background: '#f0f9ff', color: '#2563eb', borderRadius: '0.375rem', textDecoration: 'none' }}>
                  <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                </a>
                <button onClick={() => handleDownload(doc)} type="button" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', background: '#f0fdf4', color: '#059669', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>
                  <ArrowDownTrayIcon style={{ width: '1rem', height: '1rem' }} />
                </button>
                <button onClick={() => handleDelete(doc)} type="button" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>
                  <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#6b7280' }}>
        Formatet: PDF, JPG, PNG, DOC/XLS (10MB max secila)
      </div>
    </div>
  );
}
