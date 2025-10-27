'use client';

import { useState, useEffect } from 'react';
import { CurrencyToggle } from '@/components/ui/currency-toggle';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  officeId?: string;
}

interface CRMHeaderProps {
  currentPage?: string;
  user?: User | null;
}

const formatUserRole = (role: string) => {
  switch (role) {
    case 'SUPER_ADMIN': return 'Super Admin';
    case 'OFFICE_ADMIN': return 'Office Admin';
    case 'MANAGER': return 'Manager';
    case 'AGENT': return 'Agent';
    default: return role;
  }
};

export default function CRMHeader({ currentPage, user: propUser }: CRMHeaderProps) {
  const [user, setUser] = useState<User | null>(propUser || null);
  const [showSalesDropdown, setShowSalesDropdown] = useState(false);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const { logout } = useAuth();

  useEffect(() => {
    if (!propUser) {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  }, [propUser]);

  const isManager = user?.role === 'MANAGER';
  const isAdmin = user?.role === 'OFFICE_ADMIN' || user?.role === 'SUPER_ADMIN';

  const navItems = [
    { href: '/crm/dashboard', label: 'Dashboard', key: 'dashboard' },
    { href: '/crm/properties', label: 'Pronat', key: 'properties' },
    { href: '/crm/clients', label: 'Pronarët', key: 'clients' },
    { href: '/crm/agents', label: 'Agjentët', key: 'agents' },
  ];

  const salesPipelineItems = [
    { href: '/crm/leads', label: 'Leads', key: 'leads', icon: '🎯' },
    { href: '/crm/opportunities', label: 'Opportunities', key: 'opportunities', icon: '💡' },
    { href: '/crm/transactions', label: 'Transaksionet', key: 'transactions', icon: '💰' },
  ];

  const isSalesPageActive = ['leads', 'opportunities', 'transactions'].includes(currentPage || '');

  // Dropdown handlers with delay
  const handleMouseEnter = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
    setShowSalesDropdown(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowSalesDropdown(false);
    }, 150); // 150ms delay before hiding
    setHideTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [hideTimeout]);

  // Add conditional nav items
  if (isManager || isAdmin) {
    navItems.push({ href: '/crm/analytics', label: 'Analytics', key: 'analytics' });
  }

  if (user?.role === 'SUPER_ADMIN') {
    navItems.push({ href: '/crm/offices', label: 'Zyrat', key: 'offices' });
    navItems.push({ href: '/crm/settings', label: 'Cilësimet', key: 'settings' });
  }

  return (
    <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 0' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link href="/crm/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
              <img 
                src="/logo.jpg" 
                alt="Wayhome Logo" 
                style={{ height: '2rem', width: 'auto' }}
              />
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Wayhome CRM</h1>
            </Link>
            
            <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              {navItems.map((item) => {
                const isActive = currentPage === item.key;
                return (
                  <Link 
                    key={item.key}
                    href={item.href} 
                    style={{ 
                      color: isActive ? '#2563eb' : '#6b7280', 
                      textDecoration: 'none',
                      fontWeight: isActive ? '500' : 'normal',
                      borderBottom: isActive ? '2px solid #2563eb' : 'none',
                      paddingBottom: isActive ? '0.25rem' : '0'
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Sales Pipeline Dropdown */}
              <div 
                style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: isSalesPageActive ? '#2563eb' : '#6b7280',
                    textDecoration: 'none',
                    fontWeight: isSalesPageActive ? '500' : 'normal',
                    borderBottom: isSalesPageActive ? '2px solid #2563eb' : 'none',
                    paddingBottom: isSalesPageActive ? '0.25rem' : '0',
                    cursor: 'pointer',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    transition: 'all 0.2s ease',
                    background: showSalesDropdown ? '#f3f4f6' : 'transparent'
                  }}
                >
                  <span>Sales Pipeline</span>
                  <ChevronDownIcon 
                    style={{ 
                      width: '1rem', 
                      height: '1rem',
                      transform: showSalesDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }} 
                  />
                </div>

                {/* Dropdown Menu */}
                {showSalesDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '0',
                      paddingTop: '0.5rem', // This creates hover-safe area
                      zIndex: 50
                    }}
                  >
                    <div
                      style={{
                        background: 'white',
                        borderRadius: '0.75rem',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        border: '1px solid #e5e7eb',
                        padding: '0.5rem',
                        minWidth: '200px'
                      }}
                    >
                    {salesPipelineItems.map((item) => {
                      const isActive = currentPage === item.key;
                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            textDecoration: 'none',
                            color: isActive ? '#2563eb' : '#374151',
                            background: isActive ? '#eff6ff' : 'transparent',
                            fontWeight: isActive ? '500' : 'normal',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = '#f9fafb';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = 'transparent';
                            }
                          }}
                        >
                          <span style={{ fontSize: '1.125rem' }}>{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <CurrencyToggle />
            {user && (
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {user.firstName} {user.lastName} ({formatUserRole(user.role)})
              </span>
            )}
            <button
              onClick={() => {
                const confirmed = confirm('A jeni të sigurt që doni të dilni nga sistemi?');
                if (confirmed) {
                  logout();
                }
              }}
              style={{ 
                background: '#ef4444', 
                color: 'white', 
                padding: '0.5rem 1rem', 
                borderRadius: '0.5rem', 
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem' 
              }}
            >
              Dil
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
