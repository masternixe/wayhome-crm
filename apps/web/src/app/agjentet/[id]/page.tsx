'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PhoneIcon, EnvelopeIcon, BuildingOfficeIcon, MapPinIcon, CurrencyEuroIcon } from '@heroicons/react/24/outline';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { generatePropertySlug } from '@/lib/utils';
import { PriceDisplayLarge } from '@/components/ui/price-display';

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  office?: {
    id: string;
    name: string;
    city: string;
  };
}

interface Property {
  id: string;
  title: string;
  description: string;
  listingType?: 'SALE' | 'RENT';
  type: string;
  city: string;
  zona: string;
  address: string;
  price: number;
  priceOnRequest?: boolean;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  siperfaqeMin: number;
  siperfaqeMax: number;
  ashensor: boolean;
  badges: string[];
  featured: boolean;
  gallery: string[];
  status: string;
}

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  useEffect(() => {
    fetchAgent();
    fetchAgentProperties();
  }, [params.id]);

  const fetchAgent = async () => {
    try {
      // Use public API to get agent info with cache busting
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/agents?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const foundAgent = data.data.find((a: any) => a.id === params.id);
          if (foundAgent) {
            // Check if this is the super admin and transform the display
            const isSuperAdmin = foundAgent.firstName === 'Super' && foundAgent.lastName === 'Admin';
            setAgent({
              id: foundAgent.id,
              firstName: isSuperAdmin ? 'Wayhome Real Estate' : foundAgent.firstName,
              lastName: isSuperAdmin ? 'Zyra' : foundAgent.lastName,
              email: foundAgent.email,
              phone: foundAgent.phone,
              avatar: foundAgent.avatar,
              office: foundAgent.office || (isSuperAdmin ? {
                id: 'default',
                name: 'Wayhome Real Estate Zyra',
                city: 'Tirana'
              } : null),
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch agent:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentProperties = async () => {
    try {
      // Fetch properties owned by this agent using public API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/properties?agentId=${params.id}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setProperties(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch agent properties:', error);
    } finally {
      setPropertiesLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <PublicHeader />
        <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center', minHeight: '50vh' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Duke ngarkuar detajet e agjentit...</p>
        </div>
        <PublicFooter />
      </>
    );
  }

  if (!agent) {
    return (
      <>
        <PublicHeader />
        <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center', minHeight: '50vh' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h2>Agjenti nuk u gjet</h2>
          <Link href="/agjentet" style={{ color: '#2563eb', textDecoration: 'none' }}>
            ← Kthehu te agjentët
          </Link>
        </div>
        <PublicFooter />
      </>
    );
  }

  return (
    <>
      <PublicHeader />
      <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f8fafc', minHeight: '100vh' }}>
        {/* Breadcrumb */}
        <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '1rem 0' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
            <Link 
              href="/agjentet"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                color: '#2563eb', 
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
              Kthehu te agjentët
            </Link>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
          {/* Agent Info */}
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
              {/* Avatar */}
              <div style={{ 
                width: '6rem', 
                height: '6rem', 
                background: agent.avatar ? `url(${agent.avatar})` : '#e5e7eb',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                fontSize: '2rem',
                fontWeight: '500'
              }}>
                {!agent.avatar && `${agent.firstName[0]}${agent.lastName[0]}`}
              </div>

              {/* Agent Details */}
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
                  {agent.firstName} {agent.lastName}
                </h1>
                <p style={{ fontSize: '1.125rem', color: '#6b7280', margin: '0 0 1rem 0' }}>
                  {agent.firstName === 'Wayhome Real Estate' && agent.lastName === 'Zyra' ? 'Përfaqësues i Wayhome Real Estate' : 'Agjent i Pasurive të Patundshme'}
                </p>
                
                {/* Contact Info */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                  {agent.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <PhoneIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
                      <a href={`tel:${agent.phone}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                        {agent.phone}
                      </a>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <EnvelopeIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
                    <a href={`mailto:${agent.email}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                      {agent.email}
                    </a>
                  </div>
                  {agent.office && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BuildingOfficeIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
                      <span style={{ color: '#6b7280' }}>
                        {agent.office.name} - {agent.office.city}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Properties Section */}
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>
              Pronat e {agent.firstName} ({properties.length})
            </h2>

            {propertiesLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ background: '#f3f4f6', borderRadius: '1rem', height: '400px', animation: 'pulse 2s infinite' }} />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏠</div>
                <p>Ky agjent nuk ka prona të publikuara aktualisht.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {properties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/pronat/${generatePropertySlug(property.id, property.title)}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{
                      background: 'white',
                      borderRadius: '1rem',
                      overflow: 'hidden',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      border: '1px solid #e5e7eb',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    }}
                    >
                      {/* Property Image */}
                      <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                        {property.gallery && property.gallery.length > 0 ? (
                          <img
                            src={property.gallery[0]}
                            alt={property.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ 
                            width: '100%', 
                            height: '100%', 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '3rem'
                          }}>
                            🏠
                          </div>
                        )}

                        {/* Property Badges */}
                        <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '0.5rem' }}>
                          <span style={{
                            background: property.listingType === 'SALE' ? '#10b981' : '#3b82f6',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '1rem',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {property.listingType === 'SALE' ? 'Shitje' : 'Qira'}
                          </span>
                          {property.featured && (
                            <span style={{
                              background: '#f59e0b',
                              color: 'white',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '1rem',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              PREMIUM
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Property Info */}
                      <div style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                          {property.title}
                        </h3>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                          <MapPinIcon style={{ width: '1rem', height: '1rem' }} />
                          {property.city} • {property.zona}
                        </div>

                        {/* Price */}
                        <div style={{ marginBottom: '1rem' }}>
                          <PriceDisplayLarge 
                            price={property.price} 
                            priceOnRequest={property.priceOnRequest}
                            showIcon={true}
                            IconComponent={CurrencyEuroIcon}
                            className="text-2xl font-bold text-orange-600 flex items-center gap-1"
                          />
                        </div>

                        {/* Property Features */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          {property.siperfaqeMin && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span>📐</span>
                              <span>{property.siperfaqeMin}-{property.siperfaqeMax}m²</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span>🛏️</span>
                            <span>{property.bedrooms}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span>🚿</span>
                            <span>{property.bathrooms}</span>
                          </div>
                          {property.ashensor && <span>🛗</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
