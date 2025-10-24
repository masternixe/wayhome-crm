'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function CRMLoginPage() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.replace('/crm/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(credentials.email, credentials.password);
      
      if (success) {
        // AuthContext will handle the redirect
        console.log('✅ Login successful');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '1.5rem', 
        padding: '3rem', 
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '4rem', 
            height: '4rem', 
            background: '#2563eb', 
            borderRadius: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            fontSize: '2rem'
          }}>
            🏠
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
            Wayhome CRM
          </h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Hyni në sistemin e brendshëm</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
              Email
            </label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '2px solid #e5e7eb', 
                borderRadius: '0.75rem', 
                fontSize: '1rem',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
              Password
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '2px solid #e5e7eb', 
                borderRadius: '0.75rem', 
                fontSize: '1rem',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ 
              width: '100%',
              background: loading ? '#9ca3af' : '#2563eb', 
              color: 'white', 
              padding: '0.875rem', 
              border: 'none', 
              borderRadius: '0.75rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Duke hyrë...' : 'Hyr në CRM'}
          </button>
        </form>


        {/* Links */}
        <div style={{ textAlign: 'center' }}>
          <Link href="/" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem' }}>
            ← Kthehu në faqen kryesore
          </Link>
        </div>

        {/* API Status */}
        <div style={{ textAlign: 'center', marginTop: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>API Status:</p>
          <p style={{ fontSize: '0.75rem', color: '#059669', margin: 0 }}>
            ✅ Backend: http://localhost:4001 | 📊 Health: /health | 📚 Docs: /api-docs
          </p>
        </div>
      </div>
    </div>
  );
}
