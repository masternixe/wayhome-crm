'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, UserGroupIcon, HomeIcon } from '@heroicons/react/24/outline';

interface Office {
  id: string;
  name: string;
  city: string;
  address: string;
  phone?: string;
  email?: string;
  agentCount: number;
  propertyCount: number;
  totalSales: number;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email: string;
  };
}

export default function ZyratPage() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    setLoading(true);
    try {
      // TODO: Fetch offices from API
      console.log('Offices should be fetched from API - no mock data available');
      setOffices([]);
    } catch (error) {
      console.error('Failed to fetch offices:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0 }}>
      {/* Header */}
      <header style={{ background: '#2563eb', color: 'white', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white', textDecoration: 'none' }}>
              <div style={{ width: '2rem', height: '2rem', background: 'white', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🏠
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Wayhome</h1>
            </Link>
          </div>
          <nav style={{ display: 'flex', gap: '2rem' }}>
            <Link href="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
            <Link href="/pronat" style={{ color: 'white', textDecoration: 'none' }}>Pronat</Link>
            <Link href="/agjentet" style={{ color: 'white', textDecoration: 'none' }}>Agjentët</Link>
            <Link href="/zyrat" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>Zyrat</Link>
          </nav>
        </div>
      </header>

      {/* Page Header */}
      <section style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)', color: 'white', padding: '3rem 1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem', margin: '0 0 1rem 0' }}>
            Zyrat Tona
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, margin: 0 }}>
            Gjeni zyrën më të afërt dhe vizitoni ekipin tonë profesional
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Office Stats Overview */}
        <div style={{ 
          background: 'white', 
          borderRadius: '1rem', 
          padding: '2rem', 
          marginBottom: '3rem', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937', textAlign: 'center' }}>
            Statistikat e Përgjithshme
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
                {offices.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Zyra Aktive</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
                {offices.reduce((sum, office) => sum + office.agentCount, 0)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Agjentë Totalë</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏠</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
                {offices.reduce((sum, office) => sum + office.propertyCount, 0)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Prona Aktive</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '0.75rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
                {offices.reduce((sum, office) => sum + office.totalSales, 0)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Shitje Totale</div>
            </div>
          </div>
        </div>

        {/* Offices Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            {[...Array(2)].map((_, i) => (
              <div key={i} style={{ background: '#f3f4f6', borderRadius: '1rem', height: '400px', animation: 'pulse 2s infinite' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            {offices.map((office) => (
              <div key={office.id} style={{ 
                background: 'white', 
                borderRadius: '1.5rem', 
                overflow: 'hidden', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
              }}
              >
                {/* Office Header */}
                <div style={{ 
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
                  color: 'white', 
                  padding: '2rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', margin: '0 0 0.5rem 0' }}>
                    {office.name}
                  </h3>
                  <p style={{ opacity: 0.9, margin: 0 }}>{office.city}</p>
                </div>

                <div style={{ padding: '2rem' }}>
                  {/* Contact Info */}
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <MapPinIcon style={{ width: '1.25rem', height: '1.25rem', color: '#2563eb' }} />
                      <span style={{ color: '#374151' }}>{office.address}</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <PhoneIcon style={{ width: '1.25rem', height: '1.25rem', color: '#2563eb' }} />
                      <a href={`tel:${office.phone}`} style={{ color: '#374151', textDecoration: 'none' }}>
                        {office.phone}
                      </a>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <EnvelopeIcon style={{ width: '1.25rem', height: '1.25rem', color: '#2563eb' }} />
                      <a href={`mailto:${office.email}`} style={{ color: '#374151', textDecoration: 'none' }}>
                        {office.email}
                      </a>
                    </div>
                  </div>

                  {/* Office Stats */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '1rem', 
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '0.75rem'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                        {office.agentCount}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Agjentë</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                        {office.propertyCount}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Prona</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                        {office.totalSales}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Shitje</div>
                    </div>
                  </div>

                  {/* Manager Info */}
                  {office.manager && (
                    <div style={{ 
                      background: '#f0f9ff', 
                      padding: '1rem', 
                      borderRadius: '0.75rem', 
                      marginBottom: '1.5rem',
                      border: '1px solid #e0f2fe'
                    }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#0c4a6e' }}>
                        Menaxher Zyre
                      </h4>
                      <p style={{ fontWeight: '500', color: '#374151', marginBottom: '0.25rem', margin: '0 0 0.25rem 0' }}>
                        {office.manager.firstName} {office.manager.lastName}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                        {office.manager.email}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link
                      href={`/pronat?city=${office.city}`}
                      style={{ 
                        flex: 1,
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '0.5rem', 
                        background: '#2563eb', 
                        color: 'white', 
                        padding: '0.75rem', 
                        borderRadius: '0.75rem', 
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      <HomeIcon style={{ width: '1rem', height: '1rem' }} />
                      Shiko Pronat
                    </Link>
                    <Link
                      href={`/agjentet?city=${office.city}`}
                      style={{ 
                        flex: 1,
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '0.5rem', 
                        background: '#f3f4f6', 
                        color: '#374151', 
                        padding: '0.75rem', 
                        borderRadius: '0.75rem', 
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        border: '1px solid #d1d5db'
                      }}
                    >
                      <UserGroupIcon style={{ width: '1rem', height: '1rem' }} />
                      Agjentët
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Company Info */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)', 
          color: 'white', 
          borderRadius: '1.5rem', 
          padding: '3rem 2rem', 
          marginTop: '4rem',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', margin: '0 0 1rem 0' }}>
            Rreth Wayhome
          </h2>
          
          <p style={{ fontSize: '1.125rem', opacity: 0.9, marginBottom: '2rem', margin: '0 0 2rem 0', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
            Wayhome është kompania më e besueshme e pasurive të patundshme në Shqipëri. 
            Me mbi 10 vjet përvojë në treg, ne kemi ndihmuar mijëra familje të gjejnë shtëpinë e ëndrrave të tyre.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>10+</div>
              <div style={{ opacity: 0.9 }}>Vjet Përvojë</div>
            </div>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>2,500+</div>
              <div style={{ opacity: 0.9 }}>Prona të Shitura</div>
            </div>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>10,000+</div>
              <div style={{ opacity: 0.9 }}>Klientë të Kënaqur</div>
            </div>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>€45M+</div>
              <div style={{ opacity: 0.9 }}>Vlerë e Shitur</div>
            </div>
          </div>
        </div>

        {/* Services Offered */}
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1f2937', textAlign: 'center' }}>
            Shërbimet Tona
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {[
              {
                icon: '🏠',
                title: 'Shitje Pronash',
                description: 'Ndihmojmë në shitjen e pronës tuaj me çmimin më të mirë të mundshëm'
              },
              {
                icon: '🏘️',
                title: 'Qira Pronash',
                description: 'Gjejmë qiramarrësit e duhur për pronën tuaj dhe menaxhojmë kontratën'
              },
              {
                icon: '💰',
                title: 'Vlerësim Prone',
                description: 'Vlerësim profesional i pronës bazuar në tregun aktual'
              },
              {
                icon: '📋',
                title: 'Konsulencë Ligjore',
                description: 'Ndihmë e plotë në aspektin ligjor të transaksionit'
              },
              {
                icon: '🔍',
                title: 'Kërkimi i Pronës',
                description: 'Gjejmë pronën perfekte bazuar në nevojat dhe buxhetin tuaj'
              },
              {
                icon: '📈',
                title: 'Investime',
                description: 'Këshillim për investime të mençura në pasuritë e patundshme'
              }
            ].map((service, index) => (
              <div key={index} style={{ 
                background: 'white', 
                borderRadius: '1rem', 
                padding: '1.5rem', 
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                  {service.icon}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#1f2937' }}>
                  {service.title}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#1f2937', color: 'white', padding: '2rem 1rem', textAlign: 'center', marginTop: '4rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ margin: 0 }}>© 2024 Wayhome. Të gjitha të drejtat e rezervuara.</p>
        </div>
      </footer>
    </div>
  );
}
