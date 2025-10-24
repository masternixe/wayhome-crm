'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PencilIcon, 
  EyeIcon,
  TrashIcon,
  StarIcon,
  MapPinIcon,
  HomeIcon,
  CurrencyDollarIcon,
  UserIcon,
  BuildingOfficeIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  TableCellsIcon,
  Squares2X2Icon
} from '@heroicons/react/20/solid';
// Removed useCurrency import - now using PriceDisplay component
import { PriceDisplay } from '@/components/ui/price-display';
import CRMHeader from '@/components/crm/CRMHeader';
import { getOfficeDisplayName } from '@/lib/officeDisplay';

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
  currency: string;
  bedrooms: number;
  bathrooms: number;
  siperfaqeMin: number;
  siperfaqeMax: number;
  ashensor: boolean;
  badges: string[];
  featured: boolean;
  status: string;
  createdAt: string;
  agentOwner: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  collaboratingAgent?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  office: {
    id: string;
    name: string;
  };
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
    preferredCurrency?: string;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  officeId?: string;
}

const propertyTypes = ['APARTMENT', 'HOUSE', 'VILLA', 'DUPLEX', 'AMBIENT', 'COMMERCIAL', 'OFFICE', 'LAND'];
const propertyStatuses = ['LISTED', 'UNDER_OFFER', 'SOLD', 'RENTED', 'WITHDRAWN'];
const listingTypes = ['SALE', 'RENT'];

export default function CRMPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Removed currency hook - now using PriceDisplay component
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [filters, setFilters] = useState({
    q: '',
    listingType: '',
    type: '',
    status: '',
    city: '',
    agentId: '',
    featured: false,
    priceMin: '',
    priceMax: ''
  });

  // Helper functions
  const getPropertyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'APARTMENT': 'Apartament',
      'HOUSE': 'Shtëpi',
      'VILLA': 'Vilë',
      'DUPLEX': 'Dupleks',
      'AMBIENT': 'Ambient',
      'COMMERCIAL': 'Komercial',
      'OFFICE': 'Zyrë',
      'LAND': 'Tokë'
    };
    return types[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      'LISTED': 'E listuar',
      'UNDER_OFFER': 'Në ofertë',
      'SOLD': 'E shitur',
      'RENTED': 'E dhënë me qira',
      'WITHDRAWN': 'E tërhequr'
    };
    return statuses[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, {bg: string, text: string}> = {
      'LISTED': { bg: '#ecfdf5', text: '#059669' },
      'UNDER_OFFER': { bg: '#fef3c7', text: '#d97706' },
      'SOLD': { bg: '#dbeafe', text: '#2563eb' },
      'RENTED': { bg: '#f3e8ff', text: '#7c3aed' },
      'WITHDRAWN': { bg: '#fee2e2', text: '#dc2626' }
    };
    return colors[status] || { bg: '#f3f4f6', text: '#6b7280' };
  };

  const getListingTypeLabel = (listingType: string) => {
    const types: Record<string, string> = {
      'SALE': 'Shitje',
      'RENT': 'Qera'
    };
    return types[listingType] || listingType;
  };

  const getListingTypeColor = (listingType: string) => {
    const colors: Record<string, {bg: string, text: string}> = {
      'SALE': { bg: '#ecfdf5', text: '#059669' }, // Green for sale
      'RENT': { bg: '#eff6ff', text: '#2563eb' }  // Blue for rent
    };
    return colors[listingType] || { bg: '#f3f4f6', text: '#6b7280' };
  };

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      window.location.href = '/crm';
      return;
    }

    fetchProperties();
  }, [filters]);

  const handleDeleteProperty = async (propertyId: string, propertyTitle: string) => {
    if (!confirm(`Jeni të sigurt që doni ta fshini pronën "${propertyTitle}"?\n\nKy veprim nuk mund të anullohet.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('✅ Prona u fshi me sukses!');
        fetchProperties(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`❌ ${errorData.message || 'Gabim gjatë fshirjes së pronës'}`);
      }
    } catch (error) {
      console.error('Delete property error:', error);
      alert(`❌ Gabim gjatë fshirjes së pronës: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          // Handle boolean values specifically
          if (typeof value === 'boolean' && value === false) {
            return; // Skip false boolean values
          }
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProperties(data.data.properties || []);
        }
      } else {
        // Use mock data if API fails
        setProperties([]);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProperty = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleBulkAction = async (action: string) => {
    try {
      if (action === 'delete') {
        // Handle bulk delete - this would call your API
        console.log('Deleting properties:', selectedProperties);
      }
      setSelectedProperties([]);
    } catch (error) {
      alert('Gabim gjatë veprimit bulk');
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f9fafb', minHeight: '100vh' }}>
      <CRMHeader />
      
      <div style={{ padding: '2rem' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
              Menaxhimi i Pronave
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              {loading ? 'Duke ngarkuar...' : `${properties.length} prona gjithsej`}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'white', 
                  color: '#374151', 
                  padding: '0.75rem 1rem', 
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {viewMode === 'cards' ? (
                  <>
                    <TableCellsIcon style={{ width: '1rem', height: '1rem' }} />
                    Tabelë
                  </>
                ) : (
                  <>
                    <Squares2X2Icon style={{ width: '1rem', height: '1rem' }} />
                    Karta
                  </>
                )}
              </button>

              <button
                onClick={() => fetchProperties()}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#f3f4f6', 
                  color: '#374151', 
                  padding: '0.75rem 1rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                <ArrowPathIcon style={{ width: '1rem', height: '1rem' }} />
                Rifresko
              </button>
            </div>
            
            <Link
              href="/crm/properties/new"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#2563eb', 
                color: 'white', 
                padding: '0.75rem 1rem', 
                borderRadius: '0.5rem', 
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <PlusIcon style={{ width: '1rem', height: '1rem' }} />
              Pronë e Re
            </Link>
          </div>
        </div>

        {/* Filters and Actions Bar */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>Filtra dhe Kërkime</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: showFilters ? '#2563eb' : 'white', 
                color: showFilters ? 'white' : '#374151', 
                padding: '0.5rem 1rem', 
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              <AdjustmentsHorizontalIcon style={{ width: '1rem', height: '1rem' }} />
              {showFilters ? 'Fshih Filtrat' : 'Shfaq Filtrat'}
            </button>
          </div>

          {showFilters && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Kërkoni
                </label>
                <input
                  type="text"
                  placeholder="Emri i pronës, adresa..."
                  value={filters.q}
                  onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
                  style={{ 
                    width: '100%', 
                    padding: '0.5rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '0.375rem', 
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Lloji i listimit
                </label>
                <select
                  value={filters.listingType}
                  onChange={(e) => setFilters(prev => ({ ...prev, listingType: e.target.value }))}
                  style={{ 
                    width: '100%', 
                    padding: '0.5rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '0.375rem', 
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Të gjitha</option>
                  {listingTypes.map(t => (
                    <option key={t} value={t}>{t === 'SALE' ? 'Shitje' : 'Qira'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Lloji
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  style={{ 
                    width: '100%', 
                    padding: '0.5rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '0.375rem', 
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Të gjitha</option>
                  {propertyTypes.map(type => (
                    <option key={type} value={type}>{getPropertyTypeLabel(type)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Statusi
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  style={{ 
                    width: '100%', 
                    padding: '0.5rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '0.375rem', 
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Të gjitha</option>
                  {propertyStatuses.map(status => (
                    <option key={status} value={status}>{getStatusLabel(status)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Qyteti
                </label>
                <input
                  type="text"
                  placeholder="Qyteti"
                  value={filters.city}
                  onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                  style={{ 
                    width: '100%', 
                    padding: '0.5rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '0.375rem', 
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={filters.featured}
                    onChange={(e) => setFilters(prev => ({ ...prev, featured: e.target.checked }))}
                  />
                  <span style={{ fontSize: '0.875rem' }}>Vetëm të zgjedhura</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Properties Table/Grid */}
        {viewMode === 'table' ? (
          <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {loading ? (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                <p>Duke ngarkuar pronat...</p>
              </div>
            ) : properties.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏠</div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
                  Nuk ka prona
                </h3>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                  Filloni duke shtuar pronën e parë
                </p>
                <Link
                  href="/crm/properties/new"
                  style={{ 
                    background: '#2563eb', 
                    color: 'white', 
                    padding: '0.75rem 1.5rem', 
                    borderRadius: '0.5rem', 
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                >
                  Shto Pronë të Re
                </Link>
              </div>
            ) : (
              <div style={{ overflow: 'auto' }}>
                {/* Table Header */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40px 1fr 120px 140px 120px 100px 100px 120px 150px 100px 120px', 
                  gap: '1rem',
                  padding: '1rem',
                  background: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedProperties.length === properties.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProperties(properties.map(p => p.id));
                      } else {
                        setSelectedProperties([]);
                      }
                    }}
                  />
                  <span>Prona</span>
                  <span>Listim</span>
                  <span>Pronari</span>
                  <span>Lloji</span>
                  <span>Listim Tip</span>
                  <span>Statusi</span>
                  <span>Çmimi</span>
                  <span>Agjenti</span>
                  <span>Zyrja</span>
                  <span>Veprime</span>
                </div>

                {/* Table Rows */}
                {properties.map((property) => (
                  <div key={property.id} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '40px 1fr 120px 140px 120px 100px 100px 120px 150px 100px 120px', 
                    gap: '1rem',
                    padding: '1rem',
                    borderBottom: '1px solid #f3f4f6',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    background: selectedProperties.includes(property.id) ? '#f0f9ff' : 'white'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedProperties.includes(property.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProperties(prev => [...prev, property.id]);
                        } else {
                          setSelectedProperties(prev => prev.filter(id => id !== property.id));
                        }
                      }}
                    />
                    
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '2.5rem', height: '2.5rem', background: '#f3f4f6', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          🏠
                        </div>
                        <div>
                          <h3 style={{ fontWeight: '500', color: '#1f2937', margin: '0 0 0.25rem 0', lineHeight: '1.2' }}>
                            {property.title}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#6b7280', fontSize: '0.75rem' }}>
                            <MapPinIcon style={{ width: '0.75rem', height: '0.75rem' }} />
                            <span>{property.city}, {property.zona}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Listing type */}
                    <div>
                      <span style={{ 
                        background: property.listingType === 'RENT' ? '#f3e8ff' : '#ecfeff',
                        color: property.listingType === 'RENT' ? '#7c3aed' : '#0891b2',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {property.listingType === 'RENT' ? 'Qira' : 'Shitje'}
                      </span>
                    </div>

                    {/* Client */}
                    <div>
                      {property.client ? (
                        <div>
                          <div style={{ fontWeight: '500', color: '#1f2937', fontSize: '0.875rem' }}>
                            {property.client.firstName} {property.client.lastName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {property.client.mobile}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>-</span>
                      )}
                    </div>
                    
                    <span style={{ color: '#6b7280' }}>{getPropertyTypeLabel(property.type)}</span>
                    
                    <div>
                      <span style={{ 
                        background: getListingTypeColor(property.listingType || 'SALE').bg, 
                        color: getListingTypeColor(property.listingType || 'SALE').text, 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '1rem', 
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {getListingTypeLabel(property.listingType || 'SALE')}
                      </span>
                    </div>
                    
                    <div>
                      <span style={{ 
                        background: getStatusColor(property.status).bg, 
                        color: getStatusColor(property.status).text, 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '1rem', 
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {getStatusLabel(property.status)}
                      </span>
                      {property.featured && (
                        <div style={{ marginTop: '0.25rem' }}>
                          <StarIcon style={{ width: '0.875rem', height: '0.875rem', color: '#f59e0b' }} />
                        </div>
                      )}
                    </div>
                    
                    <PriceDisplay 
                      price={property.price}
                      style={{ fontWeight: '500', color: '#1f2937' }}
                    />
                    
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#1f2937' }}>
                        {property.agentOwner.firstName} {property.agentOwner.lastName}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '0.875rem', color: '#1f2937' }}>
                      {getOfficeDisplayName(property.office)}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link
                        href={`/crm/properties/${property.id}`}
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
                        title="Shiko pronën"
                      >
                        <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                      </Link>
                      <Link
                        href={`/crm/properties/${property.id}/edit`}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '2rem',
                          height: '2rem',
                          background: '#f0fdf4', 
                          color: '#059669', 
                          borderRadius: '0.375rem',
                          textDecoration: 'none'
                        }}
                        title="Ndrysho pronën"
                      >
                        <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                      </Link>
                      
                      {/* Delete Button - Only for admins and property owner */}
                      {(user?.role === 'SUPER_ADMIN' || user?.role === 'OFFICE_ADMIN' || user?.id === property.agentOwner.id) && (
                        <button
                          onClick={() => handleDeleteProperty(property.id, property.title)}
                          style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '2rem',
                            height: '2rem',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer'
                          }}
                          title="Fshi pronën"
                        >
                          <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Cards View */
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {properties.length === 0 ? (
              <div style={{ 
                gridColumn: '1 / -1',
                textAlign: 'center', 
                padding: '4rem 2rem', 
                color: '#6b7280' 
              }}>
                <HomeIcon style={{ width: '4rem', height: '4rem', color: '#d1d5db', margin: '0 auto 1rem auto' }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
                  Asnjë pronë
                </h3>
                <p style={{ fontSize: '1rem', marginBottom: '2rem' }}>
                  Krijoni pronën e parë për të filluar.
                </p>
                <Link
                  href="/crm/properties/new"
                  style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#2563eb', 
                    color: 'white', 
                    padding: '0.75rem 1.5rem', 
                    textDecoration: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                  Shto Pronë të Re
                </Link>
              </div>
            ) : (
              properties.map((property) => (
                <div key={property.id} style={{ 
                  background: 'white', 
                  borderRadius: '1rem', 
                  overflow: 'hidden', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: selectedProperties.includes(property.id) ? '2px solid #2563eb' : '1px solid #e5e7eb',
                  cursor: 'pointer'
                }}>
                  {/* Property Image/Header */}
                  <div style={{ 
                    height: '200px', 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <HomeIcon style={{ width: '4rem', height: '4rem', color: 'white', opacity: 0.8 }} />
                    
                    {/* Featured badge */}
                    {property.featured && (
                      <div style={{ 
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: '#f59e0b',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <StarIcon style={{ width: '0.75rem', height: '0.75rem' }} />
                        E zgjedhur
                      </div>
                    )}

                    {/* Checkbox */}
                    <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                      <input
                        type="checkbox"
                        checked={selectedProperties.includes(property.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setSelectedProperties(prev => [...prev, property.id]);
                          } else {
                            setSelectedProperties(prev => prev.filter(id => id !== property.id));
                          }
                        }}
                        style={{ width: '1.125rem', height: '1.125rem' }}
                      />
                    </div>
                  </div>

                  {/* Property Details */}
                  <div style={{ padding: '1.5rem' }}>
                    {/* Title and Location */}
                    <div style={{ marginBottom: '1rem' }}>
                      <h3 style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 'bold', 
                        color: '#1f2937', 
                        margin: '0 0 0.5rem 0',
                        lineHeight: '1.3'
                      }}>
                        {property.title}
                      </h3>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.25rem', 
                        color: '#6b7280', 
                        fontSize: '0.875rem' 
                      }}>
                        <MapPinIcon style={{ width: '1rem', height: '1rem' }} />
                        <span>{property.city}, {property.zona}</span>
                      </div>
                    </div>

                    {/* Client Info */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                        Pronari:
                      </div>
                      {property.client ? (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          padding: '0.5rem',
                          background: '#f0f9ff',
                          borderRadius: '0.5rem',
                          border: '1px solid #e0f2fe'
                        }}>
                          <UserIcon style={{ width: '1rem', height: '1rem', color: '#2563eb' }} />
                          <div>
                            <div style={{ fontWeight: '500', color: '#1f2937', fontSize: '0.875rem' }}>
                              {property.client.firstName} {property.client.lastName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              {property.client.mobile}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ 
                          padding: '0.5rem',
                          background: '#f9fafb',
                          borderRadius: '0.5rem',
                          border: '1px solid #e5e7eb',
                          color: '#9ca3af',
                          fontSize: '0.875rem',
                          textAlign: 'center'
                        }}>
                          Asnjë klient i caktuar
                        </div>
                      )}
                    </div>

                    {/* Property Info Grid */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Çmimi</div>
                        <PriceDisplay 
                          price={property.price}
                          style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '1.125rem' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Lloji</div>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          background: '#f0f9ff', 
                          color: '#0369a1', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {getPropertyTypeLabel(property.type)}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Listim Tip</div>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          background: getListingTypeColor(property.listingType || 'SALE').bg, 
                          color: getListingTypeColor(property.listingType || 'SALE').text, 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {getListingTypeLabel(property.listingType || 'SALE')}
                        </span>
                      </div>
                    </div>

                    {/* Status and Agent */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Statusi</div>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          background: getStatusColor(property.status).bg, 
                          color: getStatusColor(property.status).text, 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {getStatusLabel(property.status)}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Agjenti</div>
                        <div style={{ fontSize: '0.875rem', color: '#1f2937' }}>
                          {property.agentOwner.firstName} {property.agentOwner.lastName}
                        </div>
                      </div>
                    </div>

                    {/* Badges */}
                    {property.badges && property.badges.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>Karakteristika</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {property.badges.slice(0, 3).map((badge, i) => (
                            <span key={i} style={{ 
                              background: '#dbeafe', 
                              color: '#1e40af', 
                              padding: '0.125rem 0.375rem', 
                              borderRadius: '0.75rem', 
                              fontSize: '0.625rem',
                              fontWeight: '500'
                            }}>
                              {badge}
                            </span>
                          ))}
                          {property.badges.length > 3 && (
                            <span style={{ fontSize: '0.625rem', color: '#6b7280' }}>
                              +{property.badges.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '0.5rem',
                      borderTop: '1px solid #f3f4f6',
                      paddingTop: '1rem'
                    }}>
                      <Link
                        href={`/crm/properties/${property.id}`}
                        style={{ 
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem',
                          background: '#f0f9ff', 
                          color: '#2563eb', 
                          borderRadius: '0.5rem',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                        Shiko
                      </Link>
                      <Link
                        href={`/crm/properties/${property.id}/edit`}
                        style={{ 
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem',
                          background: '#f0fdf4', 
                          color: '#059669', 
                          borderRadius: '0.5rem',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                        Ndrysho
                      </Link>
                      
                      {/* Delete Button - Only for admins and property owner */}
                      {(user?.role === 'SUPER_ADMIN' || user?.role === 'OFFICE_ADMIN' || user?.id === property.agentOwner.id) && (
                        <button
                          onClick={() => handleDeleteProperty(property.id, property.title)}
                          style={{ 
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}
                          title="Fshi pronën"
                        >
                          <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                          Fshi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
