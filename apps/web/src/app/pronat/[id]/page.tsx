'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ArrowLeftIcon, MapPinIcon, HomeIcon, CurrencyEuroIcon, PhoneIcon, EnvelopeIcon, ShareIcon, HeartIcon as HeartOutline, ChevronLeftIcon, ChevronRightIcon, XMarkIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, StarIcon } from '@heroicons/react/24/solid';
import { extractIdFromSlug, generatePropertySlug } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPriceWithPreference } from '@/lib/currency';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';

interface Property {
  id: string;
  title: string;
  description: string;
  listingType: 'SALE' | 'RENT';
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
  yearBuilt?: number;
  parkingSpaces?: number;
  balcony: boolean;
  garden: boolean;
  virtualTourUrl?: string;
  agentOwner?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
    email?: string;
  };
  collaboratingAgent?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
    email?: string;
  };
  office?: {
    id: string;
    name: string;
    city: string;
    address?: string;
    phone?: string;
  };
}

// Helper functions
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

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const currency = useCurrency();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: 'Përshëndetje! Jam i/e interesuar për pronën tuaj dhe do të doja të dija më shumë detaje.'
  });

  useEffect(() => {
    fetchProperty();
  }, [params.id]);

  const fetchProperty = async () => {
    setLoading(true);
    try {
      // Extract the actual property ID from slug
      const propertyId = extractIdFromSlug(params.id);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/properties/${propertyId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('🏠 Property data received:', data.data);
        setProperty(data.data);
      } else {
        throw new Error('Property not found');
      }
    } catch (error) {
      console.error('Failed to fetch property:', error);
      setProperty(null);
    } finally {
      setLoading(false);
    }
  };

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Here you would normally send the inquiry to your API
      // For now, we'll just show a success message
      alert('Faleminderit për interesimin! Agjenti do t\'ju kontaktojë së shpejti.');
      setInquiryForm(prev => ({ ...prev, name: '', email: '', phone: '' }));
    } catch (error) {
      alert('Ka ndodhur një gabim. Ju lutemi provoni përsëri.');
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const shareProperty = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title,
        text: property?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Linku u kopjua në clipboard!');
    }
  };

  const nextImage = () => {
    if (property?.gallery) {
      setCurrentImageIndex((prev) => (prev + 1) % property.gallery.length);
    }
  };

  const prevImage = () => {
    if (property?.gallery) {
      setCurrentImageIndex((prev) => (prev - 1 + property.gallery.length) % property.gallery.length);
    }
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

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'EUR') {
      return `€${price.toLocaleString()}`;
    } else if (currency === 'ALL') {
      return `${price.toLocaleString()} ALL`;
    }
    return `${price.toLocaleString()} ${currency}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PublicHeader />
        <div className="container mx-auto px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-6"
            />
            <p className="text-xl text-gray-600">Duke ngarkuar detajet e pronës...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PublicHeader />
        <div className="container mx-auto px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="text-8xl mb-6">❌</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Prona nuk u gjet</h2>
            <p className="text-gray-600 mb-8">Prona që po kërkoni nuk ekziston ose është hequr nga listimi.</p>
            <Link href="/pronat">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                ← Kthehu te pronat
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      <div className="container mx-auto px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Link 
            href="/pronat" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Kthehu te pronat
          </Link>
        </motion.div>

        {/* Status Alert */}
        {(property.status === 'SOLD' || property.status === 'RENTED' || property.status === 'UNDER_OFFER') && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`p-6 rounded-2xl mb-8 text-center ${
              property.status === 'SOLD' ? 'bg-red-50 border-2 border-red-200' :
              property.status === 'RENTED' ? 'bg-blue-50 border-2 border-blue-200' :
              'bg-orange-50 border-2 border-orange-200'
            }`}
          >
            <div className="text-4xl mb-4">
              {property.status === 'SOLD' ? '🎉' : property.status === 'RENTED' ? '🏠' : '💰'}
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${
              property.status === 'SOLD' ? 'text-red-700' :
              property.status === 'RENTED' ? 'text-blue-700' :
              'text-orange-700'
            }`}>
              {property.status === 'SOLD' ? 'Kjo Pronë është E SHITUR!' :
               property.status === 'RENTED' ? 'Kjo Pronë është E DHËNË ME QIRA!' :
               'Kjo Pronë është NËN OFERTË!'}
            </h2>
            <p className="text-gray-600">
              {property.status === 'SOLD' ? 'Prona është shitur, por mund të shihni detajet për referim.' :
               property.status === 'RENTED' ? 'Prona është dhënë me qira, por mund të shihni detajet për referim.' :
               'Prona është nën ofertë, por ende mund të kontaktoni agjentin.'}
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Property Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
                {property.gallery && property.gallery.length > 0 ? (
                  <>
                    <Image
                      src={property.gallery[currentImageIndex]}
                      alt={property.title}
                      fill
                      className="object-cover"
                    />
                    
                    {/* Image Navigation */}
                    {property.gallery.length > 1 && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors duration-200"
                        >
                          <ChevronLeftIcon className="w-6 h-6" />
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors duration-200"
                        >
                          <ChevronRightIcon className="w-6 h-6" />
                        </motion.button>
                        
                        {/* Image Indicators */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                          {property.gallery.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                index === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <HomeIcon className="w-24 h-24 text-gray-400" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white ${property.listingType === 'RENT' ? 'bg-blue-600' : 'bg-green-600'}`}>
                    <span>{getListingTypeBadge(property.listingType || 'SALE').icon}</span>
                    {getListingTypeLabel(property.listingType || 'SALE')}
                  </span>
                  <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {getPropertyTypeLabel(property.type)}
                  </span>
                  {property.featured && (
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-sm font-medium">
                      ⭐ E zgjedhur
                    </span>
                  )}
                  {property.status === 'SOLD' && (
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      ✅ E SHITUR
                    </span>
                  )}
                  {property.status === 'RENTED' && (
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      🏠 E DHËNË ME QIRA
                    </span>
                  )}
                  {property.status === 'UNDER_OFFER' && (
                    <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      💰 NËN OFERTË
                    </span>
                  )}
                  {property.badges.map((badge, index) => (
                    <span key={index} className="bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {badge}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleFavorite}
                    className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200"
                  >
                    {isFavorite ? (
                      <HeartSolid className="w-5 h-5 text-red-500" />
                    ) : (
                      <HeartOutline className="w-5 h-5 text-gray-600" />
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={shareProperty}
                    className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200"
                  >
                    <ShareIcon className="w-5 h-5 text-gray-600" />
                  </motion.button>
                </div>

                {/* Click to Expand */}
                {property.gallery && property.gallery.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setShowImageModal(true)}
                    className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black/80 transition-colors duration-200"
                  >
                    Shiko të gjitha ({property.gallery.length})
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Property Details */}
            <motion.div
              ref={ref}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-gray-100"
            >
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    {property.title}
                  </h1>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getListingTypeBadge(property.listingType || 'SALE').bg} ${getListingTypeBadge(property.listingType || 'SALE').text} shadow-sm`}>
                    <span>{getListingTypeBadge(property.listingType || 'SALE').icon}</span>
                    {getListingTypeLabel(property.listingType || 'SALE')}
                  </span>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="w-5 h-5 mr-2" />
                    <span className="text-lg">{property.address}</span>
                  </div>
                  <div className="flex items-center text-gray-500 text-sm ml-7">
                    📍 {property.city} • {property.zona}
                  </div>
                </div>

              <div className="flex items-center text-4xl md:text-5xl font-bold text-orange-600 mb-8">
                <CurrencyEuroIcon className="w-8 h-8 mr-2" />
                {property.priceOnRequest ? 'Çmimi sipas kërkesës' : formatPriceWithPreference(property.price, property.currency as 'EUR' | 'ALL', currency)}
              </div>
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors duration-200 border-2 border-blue-200"
                >
                  <div className="text-3xl mb-2">🏢</div>
                  <div className="text-2xl font-bold text-blue-700">{getPropertyTypeLabel(property.type)}</div>
                  <div className="text-sm text-gray-600">Lloji i pronës</div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="text-3xl mb-2">🛏️</div>
                  <div className="text-2xl font-bold text-gray-900">{property.bedrooms}</div>
                  <div className="text-sm text-gray-600">Dhoma gjumi</div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="text-3xl mb-2">🚿</div>
                  <div className="text-2xl font-bold text-gray-900">{property.bathrooms}</div>
                  <div className="text-sm text-gray-600">Banjo</div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="text-3xl mb-2">📐</div>
                  <div className="text-2xl font-bold text-gray-900">{property.siperfaqeMin}-{property.siperfaqeMax}</div>
                  <div className="text-sm text-gray-600">m² sipërfaqe</div>
                </motion.div>
                
                {property.yearBuilt && (
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="text-3xl mb-2">🏗️</div>
                    <div className="text-2xl font-bold text-gray-900">{property.yearBuilt}</div>
                    <div className="text-sm text-gray-600">Viti i ndërtimit</div>
                  </motion.div>
                )}
              </div>

              {/* Additional Features */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Veçoritë</h3>
                <div className="flex flex-wrap gap-3">
                  {property.ashensor && (
                    <motion.span 
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium"
                    >
                      🛗 Ashensor
                    </motion.span>
                  )}
                  {property.balcony && (
                    <motion.span 
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium"
                    >
                      🌅 Balkon
                    </motion.span>
                  )}
                  {property.garden && (
                    <motion.span 
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium"
                    >
                      🌳 Kopsht
                    </motion.span>
                  )}
                  {property.parkingSpaces && (
                    <motion.span 
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium"
                    >
                      🚗 {property.parkingSpaces} Parking
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Property Information Grid */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Informacione të Detajuara</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Lloji i Listimit:</span>
                      <span className="font-semibold text-gray-900">
                        {property.listingType === 'SALE' ? 'Për Shitje' : 'Për Qira'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Qyteti:</span>
                      <span className="font-semibold text-gray-900">{property.city}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Zona:</span>
                      <span className="font-semibold text-gray-900">{property.zona}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Sipërfaqja:</span>
                      <span className="font-semibold text-gray-900">
                        {property.siperfaqeMin === property.siperfaqeMax 
                          ? `${property.siperfaqeMin} m²`
                          : `${property.siperfaqeMin} - ${property.siperfaqeMax} m²`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Dhoma Gjumi:</span>
                      <span className="font-semibold text-gray-900">{property.bedrooms}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Banjo:</span>
                      <span className="font-semibold text-gray-900">{property.bathrooms}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {property.yearBuilt && (
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-gray-600">Viti i Ndërtimit:</span>
                        <span className="font-semibold text-gray-900">{property.yearBuilt}</span>
                      </div>
                    )}
                    {property.parkingSpaces && (
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-gray-600">Vende Parkimi:</span>
                        <span className="font-semibold text-gray-900">{property.parkingSpaces}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Ashensor:</span>
                      <span className="font-semibold text-gray-900">
                        {property.ashensor ? '✅ Po' : '❌ Jo'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Balkon:</span>
                      <span className="font-semibold text-gray-900">
                        {property.balcony ? '✅ Po' : '❌ Jo'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Kopsht:</span>
                      <span className="font-semibold text-gray-900">
                        {property.garden ? '✅ Po' : '❌ Jo'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Statusi:</span>
                      <span className="font-semibold text-green-600">
                        {property.status === 'LISTED' ? 'Në Listim' : property.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Virtual Tour */}
              {property.virtualTourUrl && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Tur Virtual</h3>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">🏠</div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Shiko Turin Virtual</h4>
                        <p className="text-gray-600 mb-4">Eksploro pronën nga shtëpia jote me turin tonë virtual 360°</p>
                        <motion.a
                          href={property.virtualTourUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                        >
                          🎥 Hap Turin Virtual
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </motion.a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Përshkrimi</h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                    {property.description || 'Nuk ka përshkrim të disponueshëm për këtë pronë.'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Card */}
            {property.agentOwner && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">Agjenti Përgjegjës</h3>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {property.agentOwner.firstName[0]}{property.agentOwner.lastName[0]}
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">
                      {property.agentOwner.firstName} {property.agentOwner.lastName}
                    </h4>
                    <p className="text-gray-600">Agjent i Licencuar</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">4.9 (32 vlerësime)</span>
                </div>

                <div className="space-y-3">
                  <motion.a
                    href={`tel:${property.agentOwner.phone}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 bg-orange-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-orange-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    <PhoneIcon className="w-5 h-5" />
                    {property.agentOwner.phone}
                  </motion.a>
                  
                  <motion.a
                    href={`mailto:${property.agentOwner.email}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-200 border border-gray-200"
                  >
                    <EnvelopeIcon className="w-5 h-5" />
                    Dërgo Email
                  </motion.a>
                </div>
              </motion.div>
            )}

            {/* Collaborating Agent Card */}
            {property.collaboratingAgent && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">Agjenti Bashkëpunues</h3>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {property.collaboratingAgent.firstName[0]}{property.collaboratingAgent.lastName[0]}
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">
                      {property.collaboratingAgent.firstName} {property.collaboratingAgent.lastName}
                    </h4>
                    <p className="text-gray-600">Agjent Bashkëpunues</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {property.collaboratingAgent.phone && (
                    <motion.a
                      href={`tel:${property.collaboratingAgent.phone}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                    >
                      <PhoneIcon className="w-5 h-5" />
                      {property.collaboratingAgent.phone}
                    </motion.a>
                  )}
                  
                  {property.collaboratingAgent.email && (
                    <motion.a
                      href={`mailto:${property.collaboratingAgent.email}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-200 border border-gray-200"
                    >
                      <EnvelopeIcon className="w-5 h-5" />
                      Dërgo Email
                    </motion.a>
                  )}
                </div>
              </motion.div>
            )}

            {/* Inquiry Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">Interesim për Pronën</h3>
              
              <form onSubmit={handleInquiry} className="space-y-4">
                                  <input
                    type="text"
                    placeholder="Emri juaj"
                    value={inquiryForm.name}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:ring-0 transition-colors duration-200"
                  />
                
                                  <input
                    type="email"
                    placeholder="Email"
                    value={inquiryForm.email}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:ring-0 transition-colors duration-200"
                  />
                
                                  <input
                    type="tel"
                    placeholder="Telefoni"
                    value={inquiryForm.phone}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:ring-0 transition-colors duration-200"
                  />
                
                                  <textarea
                    placeholder="Mesazhi juaj..."
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:ring-0 transition-colors duration-200 resize-none"
                  />
                
                                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                  Dërgo Kërkesën
                </motion.button>
              </form>
            </motion.div>

            {/* Office Info */}
            {property.office && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-200"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Informacione Zyre</h3>
                <div className="space-y-2 text-gray-600">
                  <p><strong className="text-gray-900">{property.office.name}</strong></p>
                  <p>{property.office.address}</p>
                  <p>{property.office.phone}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && property?.gallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={property.gallery[currentImageIndex]}
                alt={property.title}
                width={800}
                height={600}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors duration-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              
              {property.gallery.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors duration-200"
                  >
                    <ChevronLeftIcon className="w-6 h-6" />
                  </button>
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors duration-200"
                  >
                    <ChevronRightIcon className="w-6 h-6" />
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PublicFooter />
    </div>
  );
}