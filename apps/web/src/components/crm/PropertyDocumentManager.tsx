'use client';

import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  TrashIcon,
  DocumentIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { notifyError, notifySuccess } from '@/lib/notify';

interface PropertyDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface PropertyDocumentManagerProps {
  documents: PropertyDocument[];
  onDocumentsChange: (documents: PropertyDocument[]) => void;
  canEdit?: boolean;
  propertyId?: string;
}

export default function PropertyDocumentManager({ 
  documents, 
  onDocumentsChange, 
  canEdit = true,
  propertyId 
}: PropertyDocumentManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [localDocuments, setLocalDocuments] = useState(documents);

  // Update local documents when props change
  useEffect(() => {
    setLocalDocuments(documents);
  }, [documents]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('access_token');

      // Create single FormData containing all files
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));
      formData.append('type', 'property_document');
      if (propertyId) {
        formData.append('propertyId', propertyId);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Upload failed');
      }

      const uploadResult = await response.json();
      if (!uploadResult.success || !Array.isArray(uploadResult.data)) {
        throw new Error(uploadResult.message || 'Upload failed');
      }

      const uploadedDocs: PropertyDocument[] = uploadResult.data.map((d: any) => ({
        id: d.id,
        name: d.originalName || d.name || 'document',
        url: d.url,
        type: d.type || '',
        size: d.size || 0,
        uploadedAt: d.uploadedAt || new Date().toISOString(),
      }));

      const updatedDocs = [...localDocuments, ...uploadedDocs];
      setLocalDocuments(updatedDocs);
      onDocumentsChange(updatedDocs);

      notifySuccess(`✅ U ngarkuan ${uploadedDocs.length} dokumente me sukses!`);
    } catch (error) {
      console.error('Document upload error:', error);
      notifyError('❌ Gabim gjatë ngarkimit të dokumenteve');
    } finally {
      setUploading(false);
      // Reset file input
      if (event?.target) {
        (event.target as HTMLInputElement).value = '';
      }
    }
  };



  const handleDownloadDocument = async (e: React.MouseEvent, doc: PropertyDocument) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem('access_token');
      const url = doc.url.startsWith('http') ? doc.url : `${process.env.NEXT_PUBLIC_API_URL}/uploads/documents/${doc.url.split('/').pop()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = doc.name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        alert('❌ Gabim gjatë shkarkimit të dokumentit');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('❌ Gabim gjatë shkarkimit të dokumentit');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (confirm('Jeni të sigurt që doni ta fshini këtë dokument?')) {
      try {
        const token = localStorage.getItem('access_token');
        const doc = localDocuments.find(d => d.id === docId);
        
        if (doc) {
          // Try to delete from server
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/document/${doc.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        }
        
        // Remove from local state regardless of server response
        const updatedDocs = localDocuments.filter(doc => doc.id !== docId);
        setLocalDocuments(updatedDocs);
        onDocumentsChange(updatedDocs);
        notifySuccess('✅ Dokumenti u fshi me sukses!');
      } catch (error) {
        console.error('Error deleting document:', error);
        // Still remove from local state
        const updatedDocs = localDocuments.filter(doc => doc.id !== docId);
        setLocalDocuments(updatedDocs);
        onDocumentsChange(updatedDocs);
        notifySuccess('✅ Dokumenti u fshi nga lista!');
      }
    }
  };

  const handleNameChange = (docId: string, newName: string) => {
    const updatedDocs = localDocuments.map(doc => 
      doc.id === docId 
        ? { ...doc, name: newName }
        : doc
    );
    setLocalDocuments(updatedDocs);
    onDocumentsChange(updatedDocs);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (!type) return '📎';
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    return '📎';
  };

  return (
    <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
          Dokumentet e Pronës
        </h2>
        
        {canEdit && (
          <div style={{ position: 'relative' }}>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ 
                position: 'absolute', 
                opacity: 0, 
                width: '100%', 
                height: '100%', 
                cursor: 'pointer',
                zIndex: 1
              }}
            />
            <button
              disabled={uploading}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: uploading ? '#9ca3af' : '#2563eb', 
                color: 'white', 
                padding: '0.5rem 1rem', 
                border: 'none',
                borderRadius: '0.5rem',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                position: 'relative',
                zIndex: 0
              }}
            >
              {uploading ? '⏳' : <ArrowUpTrayIcon style={{ width: '1rem', height: '1rem' }} />}
              {uploading ? 'Duke ngarkuar...' : 'Ngarko Dokumente'}
            </button>
          </div>
        )}
      </div>

      {localDocuments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <DocumentIcon style={{ width: '4rem', height: '4rem', color: '#d1d5db', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#1f2937' }}>Asnjë dokument</h3>
          <p style={{ margin: 0 }}>
            {canEdit ? 'Ngarkoni dokumentet e parë për këtë pronë.' : 'Nuk ka dokumente të ngarkuara për këtë pronë.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {localDocuments.map((doc) => (
            <div 
              key={doc.id} 
              style={{ 
                display: 'grid',
                gridTemplateColumns: canEdit ? '40px 1fr 100px 160px' : '40px 1fr 100px',
                gap: '1rem',
                alignItems: 'center',
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb'
              }}
            >
              {/* File Icon */}
              <div style={{ fontSize: '1.5rem', textAlign: 'center' }}>
                {getFileIcon(doc.type)}
              </div>

              {/* File Name (Editable) */}
              <div>
                {canEdit ? (
                  <input
                    type="text"
                    value={doc.name}
                    onChange={(e) => handleNameChange(doc.id, e.target.value)}
                    style={{ 
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  />
                ) : (
                  <div style={{ fontWeight: '500', color: '#1f2937' }}>
                    {doc.name}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                </div>
              </div>

              {/* File Size */}
              <div style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
                {formatFileSize(doc.size)}
              </div>



              {/* Actions */}
              {canEdit && (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <a
                    href={doc.url.startsWith('http') ? doc.url : `${process.env.NEXT_PUBLIC_API_URL}/uploads/documents/${doc.url.split('/').pop()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2rem',
                      height: '2rem',
                      background: '#f0f9ff',
                      color: '#2563eb',
                      borderRadius: '0.375rem',
                      textDecoration: 'none'
                    }}
                    title="Shiko dokumentin"
                  >
                    <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                  </a>

                  <button
                    onClick={(e) => handleDownloadDocument(e, doc)}
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2rem',
                      height: '2rem',
                      background: '#f0fdf4',
                      color: '#059669',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer'
                    }}
                    title="Shkarko dokumentin"
                  >
                    <ArrowDownTrayIcon style={{ width: '1rem', height: '1rem' }} />
                  </button>
                  
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteDocument(doc.id); }}
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2rem',
                      height: '2rem',
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer'
                    }}
                    title="Fshi dokumentin"
                  >
                    <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Instructions */}
      {canEdit && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: '#f0f9ff', 
          borderRadius: '0.75rem',
          border: '1px solid #bfdbfe'
        }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
            💡 Udhëzime për ngarkimin
          </h4>
          <ul style={{ fontSize: '0.75rem', color: '#374151', margin: 0, paddingLeft: '1rem' }}>
            <li>Formatet e pranuara: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF</li>
            <li>Madhësia maksimale: 10MB për dokument</li>
            <li>Mund të ngarkoni disa dokumente njëkohësisht</li>
            <li>Përdorni butonin e syrit për të kontrolluar dukshmërinë në frontend</li>
          </ul>
        </div>
      )}
    </div>
  );
}
