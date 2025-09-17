'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  DocumentArrowUpIcon,
  DocumentIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import CRMHeader from '@/components/crm/CRMHeader';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/apiService';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  officeId?: string;
}

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ImportLead {
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  industry?: string;
  leadSource?: string;
  description?: string;
  rikontakt?: string;
  assignedToId?: string;
  status?: 'valid' | 'error' | 'warning';
  errors?: string[];
  warnings?: string[];
  rowIndex?: number;
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    errors: string[];
  }>;
}

const leadSources = ['Website', 'Facebook', 'Instagram', 'Google Ads', 'Referral', 'Walk-in', 'Phone Call', 'Email Campaign'];
const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Construction', 'Retail', 'Hospitality', 'Real Estate', 'Other'];

function LeadsImportContent() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportLead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [defaultAssignee, setDefaultAssignee] = useState<string>('');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await apiService.getUsers(new URLSearchParams({ role: 'AGENT,MANAGER,OFFICE_ADMIN,SUPER_ADMIN' }));
      if (response.success && Array.isArray(response.data)) {
        setAgents(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(selectedFile.type) && 
        !selectedFile.name.toLowerCase().endsWith('.csv') &&
        !selectedFile.name.toLowerCase().endsWith('.xlsx') &&
        !selectedFile.name.toLowerCase().endsWith('.xls')) {
      alert('❌ Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('❌ File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    setLoading(true);
    try {
      const text = await file.text();
      let data: any[] = [];

      if (file.name.toLowerCase().endsWith('.csv')) {
        // Parse CSV
        data = parseCSV(text);
      } else {
        // For Excel files, we'll need to use a library
        // For now, show message to convert to CSV
        alert('📝 Excel files (.xlsx, .xls) are not yet supported. Please convert to CSV format and try again.');
        setFile(null);
        setLoading(false);
        return;
      }

      const validatedData = validateAndMapData(data);
      setParsedData(validatedData);
      setCurrentStep('preview');
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('❌ Error parsing file. Please check the format and try again.');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('File must contain at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }

    return data;
  };

  const validateAndMapData = (data: any[]): ImportLead[] => {
    return data.map((row, index) => {
      const lead: ImportLead = {
        firstName: row.firstName || row['First Name'] || row.fname || '',
        lastName: row.lastName || row['Last Name'] || row.lname || '',
        mobile: row.mobile || row.phone || row.Mobile || row.Phone || '',
        email: row.email || row.Email || '',
        industry: row.industry || row.Industry || '',
        leadSource: row.leadSource || row['Lead Source'] || row.source || '',
        description: row.description || row.Description || row.notes || '',
        rikontakt: row.rikontakt || row.callback || row.Callback || '',
        assignedToId: defaultAssignee,
        status: 'valid',
        errors: [],
        warnings: [],
        rowIndex: index + 2 // +2 because we skip header and arrays are 0-indexed
      };

      // Validate required fields
      if (!lead.firstName.trim()) {
        lead.errors!.push('First Name is required');
      }
      if (!lead.lastName.trim()) {
        lead.errors!.push('Last Name is required');
      }
      if (!lead.mobile.trim()) {
        lead.errors!.push('Mobile number is required');
      }

      // Validate mobile format (basic)
      if (lead.mobile && !/^[+]?[\d\s-()]+$/.test(lead.mobile)) {
        lead.warnings!.push('Mobile number format may be invalid');
      }

      // Validate email format
      if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
        lead.warnings!.push('Email format may be invalid');
      }

      // Validate industry
      if (lead.industry && !industries.includes(lead.industry)) {
        lead.warnings!.push(`Industry "${lead.industry}" is not in predefined list`);
      }

      // Validate lead source
      if (lead.leadSource && !leadSources.includes(lead.leadSource)) {
        lead.warnings!.push(`Lead source "${lead.leadSource}" is not in predefined list`);
      }

      // Set status based on validation
      if (lead.errors!.length > 0) {
        lead.status = 'error';
      } else if (lead.warnings!.length > 0) {
        lead.status = 'warning';
      }

      return lead;
    });
  };

  const handleImport = async () => {
    if (!parsedData.length) return;

    // Filter out leads with errors
    const validLeads = parsedData.filter(lead => lead.status !== 'error');
    
    if (validLeads.length === 0) {
      alert('❌ No valid leads to import. Please fix the errors and try again.');
      return;
    }

    if (validLeads.length !== parsedData.length) {
      const confirm = window.confirm(
        `⚠️ ${parsedData.length - validLeads.length} leads have errors and will be skipped. Continue with ${validLeads.length} valid leads?`
      );
      if (!confirm) return;
    }

    setImporting(true);
    
    try {
      const results: ImportResult = {
        total: validLeads.length,
        successful: 0,
        failed: 0,
        errors: []
      };

      // Import leads in batches
      const batchSize = 10;
      for (let i = 0; i < validLeads.length; i += batchSize) {
        const batch = validLeads.slice(i, i + batchSize);
        
        for (const lead of batch) {
          try {
            const leadData = {
              firstName: lead.firstName,
              lastName: lead.lastName,
              mobile: lead.mobile,
              email: lead.email || undefined,
              industry: lead.industry || undefined,
              leadSource: lead.leadSource || 'Import',
              description: lead.description || undefined,
              rikontakt: lead.rikontakt || undefined,
              assignedToId: lead.assignedToId || undefined
            };

            const response = await apiService.createLead(leadData);
            
            if (response.success) {
              results.successful++;
            } else {
              results.failed++;
              results.errors.push({
                row: lead.rowIndex!,
                errors: [response.message || 'Unknown error']
              });
            }
          } catch (error) {
            results.failed++;
            results.errors.push({
              row: lead.rowIndex!,
              errors: [error instanceof Error ? error.message : 'Network error']
            });
          }
        }
        
        // Small delay between batches to avoid overwhelming the server
        if (i + batchSize < validLeads.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setImportResult(results);
      setCurrentStep('result');
      
    } catch (error) {
      console.error('Import error:', error);
      alert('❌ Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setParsedData([]);
    setImportResult(null);
    setCurrentStep('upload');
    setDefaultAssignee('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircleIcon style={{ width: '1rem', height: '1rem', color: '#059669' }} />;
      case 'warning':
        return <ExclamationTriangleIcon style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />;
      case 'error':
        return <XCircleIcon style={{ width: '1rem', height: '1rem', color: '#ef4444' }} />;
      default:
        return null;
    }
  };

  const validCount = parsedData.filter(lead => lead.status === 'valid').length;
  const warningCount = parsedData.filter(lead => lead.status === 'warning').length;
  const errorCount = parsedData.filter(lead => lead.status === 'error').length;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
      <CRMHeader currentPage="leads" user={user} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Link
            href="/crm/leads"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              color: '#2563eb', 
              textDecoration: 'none',
              fontSize: '0.875rem'
            }}
          >
            <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
            Kthehu te leads
          </Link>

          <div style={{ marginLeft: 'auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
              Import Leads
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Import leads nga CSV ose Excel files
            </p>
          </div>
        </div>

        {/* Steps Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', padding: '1rem', background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: currentStep === 'upload' ? 1 : 0.5 }}>
            <div style={{ 
              width: '2rem', 
              height: '2rem', 
              background: currentStep === 'upload' ? '#2563eb' : '#e5e7eb', 
              color: currentStep === 'upload' ? 'white' : '#6b7280',
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              1
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Upload File</span>
          </div>

          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: currentStep === 'preview' ? 1 : 0.5 }}>
            <div style={{ 
              width: '2rem', 
              height: '2rem', 
              background: currentStep === 'preview' ? '#2563eb' : '#e5e7eb', 
              color: currentStep === 'preview' ? 'white' : '#6b7280',
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              2
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Preview & Validate</span>
          </div>

          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: currentStep === 'result' ? 1 : 0.5 }}>
            <div style={{ 
              width: '2rem', 
              height: '2rem', 
              background: currentStep === 'result' ? '#2563eb' : '#e5e7eb', 
              color: currentStep === 'result' ? 'white' : '#6b7280',
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              3
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Import Results</span>
          </div>
        </div>

        {/* Content based on current step */}
        {currentStep === 'upload' && (
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
              Ngarko CSV File
            </h2>

            {/* File Format Instructions */}
            <div style={{ background: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '0.75rem', padding: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <InformationCircleIcon style={{ width: '1.25rem', height: '1.25rem', color: '#2563eb' }} />
                  <span style={{ fontWeight: '500', color: '#1e40af' }}>File Format Requirements</span>
                </div>
                <a
                  href="/sample-leads.csv"
                  download="sample-leads.csv"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    background: '#2563eb',
                    color: 'white',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    textDecoration: 'none',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  <DocumentIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                  Sample CSV
                </a>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#1e40af', lineHeight: '1.5' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}>Your CSV file should include the following columns:</p>
                <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                  <li><strong>firstName</strong> (required) - First name of the lead</li>
                  <li><strong>lastName</strong> (required) - Last name of the lead</li>
                  <li><strong>mobile</strong> (required) - Mobile phone number</li>
                  <li><strong>email</strong> (optional) - Email address</li>
                  <li><strong>industry</strong> (optional) - Industry type</li>
                  <li><strong>leadSource</strong> (optional) - How the lead was acquired</li>
                  <li><strong>description</strong> (optional) - Additional notes</li>
                  <li><strong>rikontakt</strong> (optional) - Callback date (YYYY-MM-DD)</li>
                </ul>
              </div>
            </div>

            {/* File Upload Area */}
            <div style={{ 
              border: file ? '2px solid #059669' : '2px dashed #d1d5db', 
              borderRadius: '1rem', 
              padding: '3rem', 
              textAlign: 'center',
              background: file ? '#f0fdf4' : '#fafafa',
              transition: 'all 0.2s'
            }}>
              {file ? (
                <div>
                  <DocumentIcon style={{ width: '3rem', height: '3rem', color: '#059669', margin: '0 auto 1rem auto' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#059669', margin: '0 0 0.5rem 0' }}>
                    File uploaded successfully!
                  </h3>
                  <p style={{ color: '#6b7280', margin: '0 0 1rem 0' }}>
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                  {loading && (
                    <div style={{ color: '#2563eb', fontSize: '0.875rem' }}>
                      🔄 Parsing file...
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <CloudArrowUpIcon style={{ width: '3rem', height: '3rem', color: '#6b7280', margin: '0 auto 1rem auto' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
                    Upload your CSV file
                  </h3>
                  <p style={{ color: '#6b7280', margin: '0 0 1rem 0' }}>
                    Select a CSV file with your leads data (max 10MB)
                  </p>
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#2563eb',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '0.875rem'
                  }}>
                    <DocumentArrowUpIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    Choose File
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              )}
            </div>

            {file && !loading && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  onClick={() => setFile(null)}
                  style={{
                    background: '#f3f4f6',
                    color: '#374151',
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Choose Different File
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === 'preview' && (
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
                  Preview & Validate Data
                </h2>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  Review the parsed data and fix any errors before importing
                </p>
              </div>
            </div>

            {/* Validation Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>{validCount}</div>
                <div style={{ fontSize: '0.875rem', color: '#059669' }}>Valid Leads</div>
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fed7aa', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{warningCount}</div>
                <div style={{ fontSize: '0.875rem', color: '#f59e0b' }}>Warnings</div>
              </div>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{errorCount}</div>
                <div style={{ fontSize: '0.875rem', color: '#ef4444' }}>Errors</div>
              </div>
            </div>

            {/* Default Assignment */}
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1rem', marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                Default Assignee (Optional)
              </label>
              <select
                value={defaultAssignee}
                onChange={(e) => {
                  setDefaultAssignee(e.target.value);
                  // Update all leads with new assignee
                  setParsedData(prev => prev.map(lead => ({ ...lead, assignedToId: e.target.value })));
                }}
                style={{ 
                  width: '100%', 
                  maxWidth: '300px',
                  padding: '0.5rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.875rem' 
                }}
              >
                <option value="">Leave Unassigned</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.firstName} {agent.lastName} ({agent.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Data Preview Table */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '2rem' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '40px 1fr 150px 120px 120px 100px 1fr', 
                gap: '1rem',
                padding: '1rem',
                background: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151'
              }}>
                <div>Status</div>
                <div>Name</div>
                <div>Mobile</div>
                <div>Email</div>
                <div>Industry</div>
                <div>Source</div>
                <div>Issues</div>
              </div>

              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {parsedData.slice(0, 50).map((lead, index) => (
                  <div key={index} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '40px 1fr 150px 120px 120px 100px 1fr', 
                    gap: '1rem',
                    padding: '1rem',
                    borderBottom: '1px solid #f3f4f6',
                    fontSize: '0.875rem',
                    alignItems: 'center'
                  }}>
                    <div>{getStatusIcon(lead.status!)}</div>
                    <div>
                      <div style={{ fontWeight: '500' }}>{lead.firstName} {lead.lastName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Row {lead.rowIndex}</div>
                    </div>
                    <div>{lead.mobile}</div>
                    <div style={{ fontSize: '0.75rem' }}>{lead.email || '-'}</div>
                    <div style={{ fontSize: '0.75rem' }}>{lead.industry || '-'}</div>
                    <div style={{ fontSize: '0.75rem' }}>{lead.leadSource || '-'}</div>
                    <div>
                      {lead.errors!.length > 0 && (
                        <div style={{ color: '#ef4444', fontSize: '0.75rem' }}>
                          {lead.errors!.map((error, i) => (
                            <div key={i}>• {error}</div>
                          ))}
                        </div>
                      )}
                      {lead.warnings!.length > 0 && (
                        <div style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                          {lead.warnings!.map((warning, i) => (
                            <div key={i}>• {warning}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {parsedData.length > 50 && (
                <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                  Showing first 50 of {parsedData.length} leads
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setCurrentStep('upload')}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Back to Upload
              </button>
              
              <button
                onClick={handleImport}
                disabled={importing || validCount === 0}
                style={{
                  background: importing || validCount === 0 ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: importing || validCount === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                {importing ? '⏳ Importing...' : `Import ${validCount} Valid Leads`}
              </button>
            </div>
          </div>
        )}

        {currentStep === 'result' && importResult && (
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1f2937' }}>
              Import Results
            </h2>

            {/* Results Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>{importResult.successful}</div>
                <div style={{ fontSize: '0.875rem', color: '#059669' }}>Successfully Imported</div>
              </div>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{importResult.failed}</div>
                <div style={{ fontSize: '0.875rem', color: '#ef4444' }}>Failed</div>
              </div>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#374151' }}>{importResult.total}</div>
                <div style={{ fontSize: '0.875rem', color: '#374151' }}>Total Processed</div>
              </div>
            </div>

            {/* Error Details */}
            {importResult.errors.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#ef4444', marginBottom: '1rem' }}>
                  Import Errors
                </h3>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '1rem' }}>
                  {importResult.errors.map((error, index) => (
                    <div key={index} style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      <strong>Row {error.row}:</strong> {error.errors.join(', ')}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Message */}
            {importResult.successful > 0 && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.75rem', padding: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669' }}>
                  <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                  <span style={{ fontWeight: '500' }}>
                    Import completed successfully! {importResult.successful} leads have been added to your CRM.
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={resetImport}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Import More Leads
              </button>
              
              <Link
                href="/crm/leads"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#2563eb',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                View All Leads
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeadsImportPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OFFICE_ADMIN', 'MANAGER']}>
      <LeadsImportContent />
    </ProtectedRoute>
  );
}
