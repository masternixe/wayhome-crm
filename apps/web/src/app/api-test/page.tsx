'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function APITestPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runAPITests = async () => {
    setLoading(true);
    setTestResults([]);
    
    const tests = [
      {
        name: 'Health Check',
        endpoint: '/health',
        method: 'GET',
        auth: false
      },
      {
        name: 'Public Properties',
        endpoint: '/api/v1/public/properties',
        method: 'GET',
        auth: false
      },
      {
        name: 'Search Suggestions',
        endpoint: '/api/v1/search/suggestions?q=Tirana&type=city',
        method: 'GET',
        auth: false
      },
      {
        name: 'Login Test',
        endpoint: '/api/v1/auth/login',
        method: 'POST',
        auth: false,
        body: {
          email: 'admin@wayhome.com',
          password: 'password123'
        }
      }
    ];

    for (const test of tests) {
      try {
        const url = test.endpoint.startsWith('/api') 
          ? `${process.env.NEXT_PUBLIC_API_URL}${test.endpoint.replace('/api/v1', '')}`
          : `http://localhost:4001${test.endpoint}`;

        const options: RequestInit = {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
          },
        };

        if (test.body) {
          options.body = JSON.stringify(test.body);
        }

        const response = await fetch(url, options);
        const data = await response.json();

        setTestResults(prev => [...prev, {
          name: test.name,
          status: response.ok ? 'Success' : 'Failed',
          statusCode: response.status,
          data: data,
          endpoint: url
        }]);
      } catch (error) {
        setTestResults(prev => [...prev, {
          name: test.name,
          status: 'Error',
          statusCode: 0,
          data: { error: error.message },
          endpoint: test.endpoint
        }]);
      }
    }
    
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
            🧪 API Test Dashboard
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            Test the Wayhome CRM API endpoints to verify functionality
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <button
              onClick={runAPITests}
              disabled={loading}
              style={{ 
                background: loading ? '#9ca3af' : '#2563eb', 
                color: 'white', 
                padding: '1rem 2rem', 
                border: 'none', 
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '🔄 Running Tests...' : '▶️ Run API Tests'}
            </button>
            
            <Link
              href="/"
              style={{ 
                background: '#f3f4f6', 
                color: '#374151', 
                padding: '1rem 2rem', 
                borderRadius: '0.75rem', 
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                border: '1px solid #d1d5db'
              }}
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* API Endpoints Info */}
        <div style={{ 
          background: 'white', 
          borderRadius: '1rem', 
          padding: '2rem', 
          marginBottom: '2rem', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
            📡 Available Endpoints
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
              <h3 style={{ fontWeight: '500', color: '#1f2937', marginBottom: '0.5rem' }}>Public Endpoints</h3>
              <ul style={{ fontSize: '0.875rem', color: '#6b7280', paddingLeft: '1rem', margin: 0 }}>
                <li>GET /health - System health</li>
                <li>GET /api/v1/public/properties - Property listings</li>
                <li>GET /api/v1/search/suggestions - Search autocomplete</li>
                <li>GET /api/v1/public/featured-slots - Promoted properties</li>
              </ul>
            </div>
            
            <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '0.75rem' }}>
              <h3 style={{ fontWeight: '500', color: '#1f2937', marginBottom: '0.5rem' }}>Auth Endpoints</h3>
              <ul style={{ fontSize: '0.875rem', color: '#6b7280', paddingLeft: '1rem', margin: 0 }}>
                <li>POST /api/v1/auth/login - User login</li>
                <li>POST /api/v1/auth/register - User registration</li>
                <li>POST /api/v1/auth/refresh - Token refresh</li>
                <li>GET /api/v1/auth/me - User profile</li>
              </ul>
            </div>
            
            <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '0.75rem' }}>
              <h3 style={{ fontWeight: '500', color: '#1f2937', marginBottom: '0.5rem' }}>CRM Endpoints</h3>
              <ul style={{ fontSize: '0.875rem', color: '#6b7280', paddingLeft: '1rem', margin: 0 }}>
                <li>GET /api/v1/properties - Property management</li>
                <li>GET /api/v1/leads - Lead management</li>
                <li>GET /api/v1/search - Global search</li>
                <li>GET /api/v1/leaderboard - Points leaderboard</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div style={{ 
            background: 'white', 
            borderRadius: '1rem', 
            padding: '2rem', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
              📊 Test Results
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {testResults.map((result, index) => (
                <div key={index} style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.75rem', 
                  padding: '1rem',
                  background: result.status === 'Success' ? '#f0fdf4' : '#fef2f2'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontWeight: '500', color: '#1f2937', margin: 0 }}>
                      {result.status === 'Success' ? '✅' : '❌'} {result.name}
                    </h3>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: result.status === 'Success' ? '#059669' : '#dc2626',
                      fontWeight: '500'
                    }}>
                      {result.statusCode} {result.status}
                    </span>
                  </div>
                  
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontFamily: 'monospace' }}>
                    {result.endpoint}
                  </p>
                  
                  <details style={{ marginTop: '0.5rem' }}>
                    <summary style={{ cursor: 'pointer', fontSize: '0.875rem', color: '#6b7280' }}>
                      View Response
                    </summary>
                    <pre style={{ 
                      background: '#f9fafb', 
                      padding: '1rem', 
                      borderRadius: '0.5rem', 
                      fontSize: '0.75rem',
                      overflow: 'auto',
                      margin: '0.5rem 0 0 0'
                    }}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Database Info */}
        <div style={{ 
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
          color: 'white', 
          borderRadius: '1rem', 
          padding: '2rem', 
          marginTop: '2rem',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', margin: '0 0 1rem 0' }}>
            🗄️ Database Content
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>50</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Properties</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>30</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Leads</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>20</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Opportunities</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>15</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Transactions</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>10</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Users</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>20</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Clients</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
