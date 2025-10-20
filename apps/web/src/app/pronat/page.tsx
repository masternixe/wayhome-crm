'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, FunnelIcon, MapPinIcon, HomeIcon, CurrencyEuroIcon, XMarkIcon, AdjustmentsHorizontalIcon, HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { generatePropertySlug } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPriceWithPreference } from '@/lib/currency';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import Image from 'next/image';

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
  agent?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
  };
  office?: {
    id: string;
    name: string;
  };
}

const propertyTypes = [
  { value: '', label: 'Të gjitha' },
  { value: 'APARTMENT', label: 'Apartament' },
  { value: 'HOUSE', label: 'Shtëpi' },
  { value: 'VILLA', label: 'Vilë' },
  { value: 'DUPLEX', label: 'Dupleks' },
  { value: 'AMBIENT', label: 'Ambient' },
  { value: 'COMMERCIAL', label: 'Komerciale' },
  { value: 'OFFICE', label: 'Zyrë' },
];

const cities = ['', 'Tirana', 'Durrës', 'Vlorë', 'Shkodër', 'Korçë', 'Fier', 'Elbasan'];

export default function PronatPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const currency = useCurrency();
  const [filters, setFilters] = useState({
    q: '',
    listingType: '',
    type: '',
    city: '',
    zona: '',
    priceMin: '',
    priceMax: '',
    bedrooms: '',
    ashensor: false,
    featured: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Show all properties regardless of status
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '' && value !== false) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/properties?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 API Response:', data);
      
      if (data.success && data.data && Array.isArray(data.data)) {
        setProperties(data.data);
      } else {
        console.warn('No properties found or invalid response format:', data);
        setProperties([]);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      q: '',
      listingType: '',
      type: '',
      city: '',
      zona: '',
      priceMin: '',
      priceMax: '',
      bedrooms: '',
      ashensor: false,
      featured: false,
    });
  };

  const toggleFavorite = (propertyId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(propertyId)) {
        newFavorites.delete(propertyId);
      } else {
        newFavorites.add(propertyId);
      }
      return newFavorites;
    });
  };

  const getPropertyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'APARTMENT': 'Apartament',
      'HOUSE': 'Shtëpi',
      'VILLA': 'Vilë',
      'COMMERCIAL': 'Komercial',
      'OFFICE': 'Zyrë',
      'LAND': 'Tokë'
    };
    return types[type] || type;
  };

  const getListingTypeLabel = (listingType: string) => {
    const types: Record<string, string> = {
      'SALE': 'Shitje',
      'RENT': 'Qera'
    };
    return types[listingType] || listingType;
  };

  const getListingTypeBadge = (listingType: string) => {
    const badges: Record<string, { bg: string, text: string, icon: string }> = {
      'SALE': { bg: 'bg-green-100', text: 'text-green-800', icon: '💰' },
      'RENT': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🏠' }
    };
    return badges[listingType] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '🏢' };
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'EUR') {
      return `€${price.toLocaleString()}`;
    } else if (currency === 'ALL') {
      return `${price.toLocaleString()} ALL`;
    }
    return `${price.toLocaleString()} ${currency}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      {/* Page Header */}
      <section className="relative bg-gradient-to-br from-orange-900 via-orange-800 to-red-900 text-white py-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Pronat e{' '}
              <span className="bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent">
                Disponueshme
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 max-w-3xl mx-auto">
              Gjeni pronën perfekte nga koleksioni ynë i gjerë i verifikuar
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl p-6 md:p-8 shadow-xl mb-8 border border-gray-100"
        >
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Kërkoni për pronë, adresë, ose zona..."
                value={filters.q}
                onChange={(e) => handleFilterChange('q', e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 transition-colors duration-200 text-lg"
              />
            </div>
            
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                showFilters 
                  ? 'bg-orange-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              Filtrat
              {showFilters && <XMarkIcon className="w-4 h-4" />}
            </motion.button>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Lloji i pronës</label>
                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-0"
                    >
                      {propertyTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Qera / Shitje</label>
                    <select
                      value={filters.listingType}
                      onChange={(e) => handleFilterChange('listingType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-0"
                    >
                      <option value="">Të gjitha</option>
                      <option value="SALE">Shitje</option>
                      <option value="RENT">Qera</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Qyteti</label>
                    <select
                      value={filters.city}
                      onChange={(e) => handleFilterChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-0"
                    >
                      <option value="">Të gjitha</option>
                      {cities.slice(1).map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Çmimi Min (€)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.priceMin}
                      onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Çmimi Max (€)</label>
                    <input
                      type="number"
                      placeholder="1000000"
                      value={filters.priceMax}
                      onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Dhomat</label>
                    <select
                      value={filters.bedrooms}
                      onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-0"
                    >
                      <option value="">Çdo numër</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                    </select>
                  </div>

                  <div className="flex items-end gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.ashensor}
                        onChange={(e) => handleFilterChange('ashensor', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Ashensor</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.featured}
                        onChange={(e) => handleFilterChange('featured', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Të zgjedhura</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter Actions */}
          <div className="flex justify-between items-center mt-6">
            <p className="text-gray-600 font-medium">
              {loading ? 'Duke kërkuar...' : `${properties.length} prona të gjetur`}
            </p>
            <motion.button
              onClick={clearFilters}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Pastro filtrat
            </motion.button>
          </div>
        </motion.div>

        {/* Properties Grid */}
        <div ref={ref}>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                  <div className="h-64 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                    <div className="h-8 bg-gray-200 rounded mb-4 w-1/2"></div>
                    <div className="flex gap-4">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {Array.isArray(properties) && properties.map((property, index) => (
                <motion.div
                  key={property.id}
                  variants={itemVariants}
                  whileHover={{ y: -10, transition: { duration: 0.3 } }}
                  className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  {/* Property Image */}
                  <div className="relative h-64 overflow-hidden">
                    {property.gallery && property.gallery.length > 0 ? (
                      <Image
                        src={property.gallery[0]}
                        alt={property.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <HomeIcon className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Listing Type Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getListingTypeBadge(property.listingType || 'SALE').bg} ${getListingTypeBadge(property.listingType || 'SALE').text} shadow-sm`}>
                        <span>{getListingTypeBadge(property.listingType || 'SALE').icon}</span>
                        {getListingTypeLabel(property.listingType || 'SALE')}
                      </span>
                    </div>

                    {/* Favorite Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleFavorite(property.id)}
                      className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200"
                    >
                      {favorites.has(property.id) ? (
                        <HeartSolid className="w-5 h-5 text-red-500" />
                      ) : (
                        <HeartOutline className="w-5 h-5 text-gray-600" />
                      )}
                    </motion.button>


                    {/* Featured Badge */}
                    {property.featured && (
                      <div className="absolute bottom-4 left-4">
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-sm font-medium">
                          ⭐ E zgjedhur
                        </span>
                      </div>
                    )}

                    {/* Badges */}
                    {property.badges.length > 0 && (
                      <div className="absolute bottom-4 right-4 flex gap-1 flex-wrap">
                        {property.badges.slice(0, 2).map((badge, badgeIndex) => (
                          <span key={badgeIndex} className="bg-black/70 text-white px-2 py-1 rounded text-xs">
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Property Details */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors duration-200 line-clamp-2">
                      {property.title}
                    </h3>
                    
                    <div className="flex items-center text-gray-600 mb-3">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      <span className="text-sm">
                        {property.zona ? `${property.zona}, ${property.city}` : property.city}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {property.description}
                    </p>

                    {/* Property Features */}
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-4">
                        {property.siperfaqeMin && (
                          <span className="flex items-center">
                            <HomeIcon className="w-4 h-4 mr-1" />
                            {property.siperfaqeMin}-{property.siperfaqeMax}m²
                          </span>
                        )}
                        {property.bedrooms && (
                          <span className="flex items-center">
                            🛏️ {property.bedrooms}
                          </span>
                        )}
                        {property.bathrooms && (
                          <span className="flex items-center">
                            🚿 {property.bathrooms}
                          </span>
                        )}
                      </div>
                      {property.ashensor && <span>🛗</span>}
                    </div>

                    {/* Price and Action */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-2xl font-bold text-orange-600">
                        <CurrencyEuroIcon className="w-6 h-6 mr-1" />
                        {property.priceOnRequest ? 'Çmimi sipas kërkesës' : formatPrice(property.price, property.currency)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {property.status === 'SOLD' && (
                          <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                            ✅ E SHITUR
                          </span>
                        )}
                        {property.status === 'RENTED' && (
                          <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                            🏠 E DHËNË ME QIRA
                          </span>
                        )}
                        {property.status === 'UNDER_OFFER' && (
                          <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-bold">
                            💰 NËN OFERTË
                          </span>
                        )}
                        <Link href={`/pronat/${generatePropertySlug(property.id, property.title)}`}>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            Detajet →
                          </motion.button>
                        </Link>
                      </div>
                    </div>

                    {/* Agent Info */}
                    {property.agent && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Agjent: {property.agent.firstName} {property.agent.lastName}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* No Results */}
        {!loading && properties.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Nuk u gjetën prona
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Provoni të ndryshoni filtrat ose kriteret e kërkimit për të gjetur pronat që ju interesojnë
            </p>
            <motion.button
              onClick={clearFilters}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Pastro filtrat
            </motion.button>
          </motion.div>
        )}
      </div>

      <PublicFooter />
    </div>
  );
}