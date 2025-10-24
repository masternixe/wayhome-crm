'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MapPinIcon, CurrencyEuroIcon, HomeIcon } from '@heroicons/react/20/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/20/solid';
import { HeartIcon as HeartSolid } from '@heroicons/react/20/solid';
import Image from 'next/image';
import Link from 'next/link';
import { PriceDisplayLarge } from '@/components/ui/price-display';
import { generatePropertySlug } from '@/lib/utils';

interface Property {
  id: string;
  title: string;
  description?: string;
  listingType?: 'SALE' | 'RENT';
  price: number;
  priceOnRequest?: boolean;
  currency: string;
  type: string;
  city: string;
  zona?: string;
  siperfaqeMin?: number;
  siperfaqeMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  images?: string[];
  gallery?: string[];
  featured: boolean;
  status: string;
}

export function FeaturedProperties() {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [regularProperties, setRegularProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    fetchAllProperties();
  }, []);

  const fetchAllProperties = async () => {
    try {
      // Fetch featured properties
      const featuredResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/properties?featured=true&limit=6`);
      
      // Fetch regular properties (non-featured)
      const regularResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/properties?featured=false&limit=6`);
      
      if (featuredResponse.ok) {
        const featuredData = await featuredResponse.json();
        // console.log('🏠 HOMEPAGE API RESPONSE - First property:', featuredData.data?.[0]);
        if (featuredData.success && featuredData.data && Array.isArray(featuredData.data)) {
          setFeaturedProperties(featuredData.data);
        }
      }
      
      if (regularResponse.ok) {
        const regularData = await regularResponse.json();
        if (regularData.success && regularData.data && Array.isArray(regularData.data)) {
          setRegularProperties(regularData.data);
        }
      }
      
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setLoading(false);
    }
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

  // Removed formatPrice - using PriceDisplay component instead



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
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="h-12 bg-gray-200 rounded-lg mx-auto max-w-md mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded-lg mx-auto max-w-lg animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
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
        </div>
      </section>
    );
  }

  const PropertyGrid = ({ properties, title, description }: { properties: Property[], title: React.ReactNode, description: string }) => (
    <div className="mb-20">
        {/* Section Header */}
        <div

          className="text-center mb-16"
        >
          <h2 
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"

          >
          {title}
          </h2>
          <p 
            className="text-xl text-gray-600 max-w-3xl mx-auto"

          >
          {description}
          </p>
        </div>

        {/* Properties Grid */}
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => (
              <Link href={`/pronat/${property.id}`} key={property.id}>
                <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-orange-200">
                  {/* Property Image/Header */}
                <div className="h-48 relative overflow-hidden">
                  {property.gallery && property.gallery.length > 0 ? (
                    <Image 
                      src={property.gallery[0]} 
                      alt={property.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Image 
                      src="https://wayhome.al/wayhome/uploads/image-1752145569939-WhatsApp_Image_2025-07-10_at_13.05.55_bf66cd2e.jpg"
                      alt="Property placeholder"
                      fill
                      className="object-cover"
                    />
                  )}
                    
                    {/* Listing Type Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getListingTypeBadge(property.listingType || 'SALE').bg} ${getListingTypeBadge(property.listingType || 'SALE').text} shadow-sm backdrop-blur-sm`}>
                        <span>{getListingTypeBadge(property.listingType || 'SALE').icon}</span>
                        {getListingTypeLabel(property.listingType || 'SALE')}
                      </span>
                    </div>

                    {/* Featured Badge */}
                    {property.featured && (
                      <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        ⭐ E zgjedhur
                      </div>
                    )}

                    {/* Property Type Badge */}
                    {!property.featured && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-white/90 backdrop-blur-sm text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
                          {getPropertyTypeLabel(property.type)}
                        </span>
                      </div>
                    )}

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(property.id);
                      }}
                      className="absolute bottom-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200 z-10"
                    >
                      {favorites.has(property.id) ? (
                        <HeartSolid className="w-5 h-5 text-red-500" />
                      ) : (
                        <HeartOutline className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                  </div>

                  {/* Property Details */}
                  <div className="p-6">
                    {/* Title and Location */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors duration-200 line-clamp-2">
                        {property.title}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{property.zona ? `${property.zona}, ${property.city}` : property.city}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      {/* {console.log('💰 Price display props:', { price: property.price, priceOnRequest: property.priceOnRequest, title: property.title })} */}
                      <PriceDisplayLarge 
                        price={property.price} 
                        priceOnRequest={property.priceOnRequest}
                        showIcon={true}
                        IconComponent={CurrencyEuroIcon}
                        className="flex items-center gap-1"
                      />
                    </div>

                    {/* Property Features */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      {property.siperfaqeMin && (
                        <span className="flex items-center gap-1">
                          <HomeIcon className="w-4 h-4" />
                          {property.siperfaqeMin}m²
                        </span>
                      )}
                      {property.bedrooms && (
                        <span className="flex items-center gap-1">
                          🛏️ {property.bedrooms}
                        </span>
                      )}
                      {property.bathrooms && (
                        <span className="flex items-center gap-1">
                          🚿 {property.bathrooms}
                        </span>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-center gap-2 text-orange-600 font-medium group-hover:text-orange-700 transition-colors duration-200">
                        <span>Shiko detajet</span>
                        <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">Asnjë pronë e disponueshme në këtë kategori.</p>
        </div>
      )}
    </div>
  );

  return (
    <div ref={ref}>
      {/* Featured Properties Section - Premium Section */}
      {(featuredProperties.length > 0) && (
        <section className="py-20 bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmOTcyMTYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJtMzYgMzQgMC0xNC0yIDAtMCAxNC0xNCAwIDAgMiAxNCAwIDAgMTQgMiAwIDAtMTQgMTQgMCAwLTIgeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          </div>
          
          <div className="container mx-auto px-6 lg:px-8 relative">
            {/* Premium Badge */}
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-full text-lg font-bold shadow-xl">
                ⭐ PREMIUM SELECTION
              </span>
            </div>

            {/* Section Header */}
            <div

              className="text-center mb-12"
            >
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Pronat e{' '}
                <span className="bg-gradient-to-r from-orange-600 via-red-600 to-yellow-600 bg-clip-text text-transparent">
                  Zgjedhura
                </span>
              </h2>
              <p 
                className="text-xl text-gray-700 max-w-4xl mx-auto font-medium mb-6"

              >
                ✨ Zbuloni pronat më të mira të zgjedhura me kujdes nga ekspertët tanë për ju
              </p>
              
              {/* Premium Features */}
              <div 
                className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8"

              >
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-orange-200">
                  <div className="text-3xl mb-3">🏆</div>
                  <h3 className="font-bold text-gray-900 mb-2">Cilësi Premium</h3>
                  <p className="text-sm text-gray-600">Prona të verifikuara dhe të cilësisë së lartë</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-orange-200">
                  <div className="text-3xl mb-3">🎯</div>
                  <h3 className="font-bold text-gray-900 mb-2">Të Rekomanduara</h3>
                  <p className="text-sm text-gray-600">Zgjedhje ekskluzive nga ekspertët tanë</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-orange-200">
                  <div className="text-3xl mb-3">⚡</div>
                  <h3 className="font-bold text-gray-900 mb-2">Shërbim VIP</h3>
                  <p className="text-sm text-gray-600">Prioritet në shërbim dhe mbështetje</p>
                </div>
              </div>
            </div>

            {/* Featured Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/pronat?type=HOUSE">
                <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-xl hover:shadow-2xl">
                  🏠 Shiko Të Gjitha Shtëpitë
                </button>
              </Link>
              <Link href="/pronat?featured=true">
                <button className="bg-transparent border-2 border-orange-500 text-orange-600 px-8 py-4 rounded-xl font-semibold hover:bg-orange-500 hover:text-white transition-all duration-300">
                  ⭐ Vetëm Pronat Premium
                </button>
              </Link>
            </div>

            {/* Featured Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.map((property) => (
                <Link href={`/pronat/${generatePropertySlug(property.id, property.title)}`} key={property.id}>
                  <div className="group bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-orange-100 hover:border-orange-300 relative">
                    {/* Status Badges */}
                    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        ⭐ PREMIUM
                      </div>
                      {property.status === 'SOLD' && (
                        <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                          ✅ E SHITUR
                        </div>
                      )}
                      {property.status === 'RENTED' && (
                        <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                          🏠 E DHËNË ME QIRA
                        </div>
                      )}
                    </div>

                    {/* Property Image/Header */}
                    <div className="h-56 relative overflow-hidden">
                      {property.gallery && property.gallery.length > 0 ? (
                        <Image 
                          src={property.gallery[0]} 
                          alt={property.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                                              <Image 
                        src="https://wayhome.al/wayhome/uploads/image-1752145569939-WhatsApp_Image_2025-07-10_at_13.05.55_bf66cd2e.jpg"
                        alt="Property placeholder"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      )}
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                      {/* Listing Type Badge */}
                      <div className="absolute top-4 left-4 z-10">
                        <span className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${getListingTypeBadge(property.listingType || 'SALE').bg} ${getListingTypeBadge(property.listingType || 'SALE').text} backdrop-blur-sm`}>
                          <span>{getListingTypeBadge(property.listingType || 'SALE').icon}</span>
                          {getListingTypeLabel(property.listingType || 'SALE')}
                        </span>
                      </div>

                      {/* Property Type Badge */}
                      <div className="absolute bottom-4 left-4 z-10">
                        <span className="bg-white/95 backdrop-blur-sm text-orange-600 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                          {getPropertyTypeLabel(property.type)}
                        </span>
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(property.id);
                        }}
                        className="absolute bottom-4 right-4 p-3 bg-white/95 backdrop-blur-sm rounded-full shadow-xl hover:bg-white hover:scale-110 transition-all duration-200 z-10"
                      >
                        {favorites.has(property.id) ? (
                          <HeartSolid className="w-6 h-6 text-red-500" />
                        ) : (
                          <HeartOutline className="w-6 h-6 text-gray-600" />
                        )}
                      </button>
                    </div>

                    {/* Property Details */}
                    <div className="p-8">
                      {/* Title and Location */}
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors duration-200 line-clamp-2">
                          {property.title}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPinIcon className="w-5 h-5" />
                          <span className="font-medium">{property.zona ? `${property.zona}, ${property.city}` : property.city}</span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mb-6">
                        <PriceDisplayLarge 
                          price={property.price} 
                          priceOnRequest={property.priceOnRequest}
                          showIcon={true}
                          IconComponent={CurrencyEuroIcon}
                          className="text-3xl font-bold text-orange-600 flex items-center gap-2"
                        />
                      </div>

                      {/* Property Features */}
                      <div className="flex items-center gap-6 text-gray-600 mb-6">
                        {property.siperfaqeMin && (
                          <span className="flex items-center gap-2 font-medium">
                            <HomeIcon className="w-5 h-5" />
                            {property.siperfaqeMin}m²
                          </span>
                        )}
                        {property.bedrooms && (
                          <span className="flex items-center gap-2 font-medium">
                            🛏️ {property.bedrooms}
                          </span>
                        )}
                        {property.bathrooms && (
                          <span className="flex items-center gap-2 font-medium">
                            🚿 {property.bathrooms}
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="pt-6 border-t border-gray-100">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-center py-3 rounded-xl font-semibold group-hover:from-orange-600 group-hover:to-red-600 transition-all duration-200">
                          Shiko Detajet Premium →
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section Divider */}
      {featuredProperties.length > 0 && regularProperties.length > 0 && (
        <div className="py-16 bg-gradient-to-b from-orange-50 to-gray-50">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              <div className="mx-8 bg-white rounded-full px-6 py-3 shadow-lg border border-gray-200">
                <span className="text-gray-500 font-medium text-sm">Shiko edhe pronat e tjera</span>
              </div>
              <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>
          </div>
        </div>
      )}

      {/* Regular Properties Section - Standard Section */}
      {regularProperties.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-6 lg:px-8">
            {/* Section Badge */}
            <div 

              className="text-center mb-8"
            >
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg">
                🏡 Available Properties
              </span>
            </div>

            {/* Section Header */}
            <div

              className="text-center mb-12"
            >
              <h2 
                className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"

              >
                Pronat e{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Disponueshme
                </span>
              </h2>
              <p 
                className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"

              >
                Shikoni disa nga pronat më të reja dhe të verifikuara në platformën tonë
              </p>

              {/* Regular Features */}
              <div 
                className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-8"

              >
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="text-2xl mb-2">🔍</div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">Të Verifikuara</h3>
                  <p className="text-xs text-gray-600">Prona të kontrolluara dhe të sigurta</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="text-2xl mb-2">📍</div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">Lokacione të Mira</h3>
                  <p className="text-xs text-gray-600">Zona të kërkuara dhe strategjike</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="text-2xl mb-2">💰</div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">Çmime Konkurruese</h3>
                  <p className="text-xs text-gray-600">Vlera të mira për paranë</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="text-2xl mb-2">⏰</div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">Të Reja</h3>
                  <p className="text-xs text-gray-600">Prona të fresh dhe të azhornuara</p>
                </div>
              </div>
            </div>

            {/* Regular Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularProperties.map((property) => (
                <Link href={`/pronat/${generatePropertySlug(property.id, property.title)}`} key={property.id}>
                  <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-200">
                    {/* Property Image/Header */}
                    <div className="h-48 relative overflow-hidden">
                      {property.gallery && property.gallery.length > 0 ? (
                        <Image 
                          src={property.gallery[0]} 
                          alt={property.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Image 
                          src="https://wayhome.al/wayhome/uploads/image-1752145569939-WhatsApp_Image_2025-07-10_at_13.05.55_bf66cd2e.jpg"
                          alt="Property placeholder"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      
                      {/* Listing Type Badge */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getListingTypeBadge(property.listingType || 'SALE').bg} ${getListingTypeBadge(property.listingType || 'SALE').text} shadow-sm backdrop-blur-sm`}>
                          <span>{getListingTypeBadge(property.listingType || 'SALE').icon}</span>
                          {getListingTypeLabel(property.listingType || 'SALE')}
                        </span>
                        {property.status === 'SOLD' && (
                          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                            ✅ E SHITUR
                          </span>
                        )}
                        {property.status === 'RENTED' && (
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                            🏠 E DHËNË ME QIRA
                          </span>
                        )}
                        {property.status === 'UNDER_OFFER' && (
                          <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                            💰 NËN OFERTË
                          </span>
                        )}
                      </div>

                      {/* Property Type Badge */}
                      <div className="absolute top-4 right-4">
                        <span className="bg-white/90 backdrop-blur-sm text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                          {getPropertyTypeLabel(property.type)}
                        </span>
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(property.id);
                        }}
                        className="absolute bottom-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200 z-10"
                      >
                        {favorites.has(property.id) ? (
                          <HeartSolid className="w-5 h-5 text-red-500" />
                        ) : (
                          <HeartOutline className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                    </div>

                    {/* Property Details */}
                    <div className="p-6">
                      {/* Title and Location */}
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                          {property.title}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <MapPinIcon className="w-4 h-4" />
                          <span>{property.zona ? `${property.zona}, ${property.city}` : property.city}</span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        <PriceDisplayLarge 
                          price={property.price} 
                          priceOnRequest={property.priceOnRequest}
                          showIcon={true}
                          IconComponent={CurrencyEuroIcon}
                          className="text-2xl font-bold text-blue-600 flex items-center gap-1"
                        />
                      </div>

                      {/* Property Features */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        {property.siperfaqeMin && (
                          <span className="flex items-center gap-1">
                            <HomeIcon className="w-4 h-4" />
                            {property.siperfaqeMin}m²
                          </span>
                        )}
                        {property.bedrooms && (
                          <span className="flex items-center gap-1">
                            🛏️ {property.bedrooms}
                          </span>
                        )}
                        {property.bathrooms && (
                          <span className="flex items-center gap-1">
                            🚿 {property.bathrooms}
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-center gap-2 text-blue-600 font-medium group-hover:text-blue-700 transition-colors duration-200">
                          <span>Shiko detajet</span>
                          <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Show All Button Below Regular Properties */}
            <div className="flex justify-center mt-12">
              <Link href="/pronat">
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105">
                  🔍 Shiko Të Gjitha Pronat
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* No Properties Message */}
      {featuredProperties.length === 0 && regularProperties.length === 0 && !loading && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-6 lg:px-8">
          <div

            className="text-center py-16"
          >
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Asnjë pronë e disponueshme
            </h3>
            <p className="text-gray-600 mb-8">
              Aktualisht nuk ka prona të disponueshme. Kontrolloni sërish më vonë ose kontaktoni agjentët tanë.
            </p>
            <Link href="/agjentet">
              <button

                className="bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Kontakto Agjentin
              </button>
            </Link>
          </div>
          </div>
        </section>
        )}

              {/* Call to Action Section */}
      {(featuredProperties.length > 0 || regularProperties.length > 0) && (
        <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0ibTM2IDM0IDAtMTQtMiAwLTAgMTQtMTQgMCAwIDIgMTQgMCAwIDE0IDIgMCAwLTE0IDE0IDAgMC0yIHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
          </div>

          <div className="container mx-auto px-6 lg:px-8 relative">
            <div
          
              className="text-center"
            >
              {/* Header */}
              <h2 
                className="text-4xl md:text-5xl font-bold text-white mb-6"

              >
                Gjen Pronën{' '}
                <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  Perfekte
                </span>
              </h2>

              <p 
                className="text-xl text-gray-300 max-w-3xl mx-auto mb-8"

              >
                Më shumë se {featuredProperties.length + regularProperties.length} prona të disponueshme të verifikuara nga ekspertët tanë
              </p>

              {/* Stats */}
              <div 
                className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-10"

              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-2">{featuredProperties.length}+</div>
                  <div className="text-sm text-gray-400">Prona Premium</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{regularProperties.length}+</div>
                  <div className="text-sm text-gray-400">Prona Standarde</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">100%</div>
                  <div className="text-sm text-gray-400">Të Verifikuara</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">24/7</div>
                  <div className="text-sm text-gray-400">Mbështetje</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/pronat">
                  <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-xl hover:shadow-2xl">
                    🔍 Eksploro Të Gjitha Pronat
                  </button>
                </Link>
                <Link href="/pronat?type=HOUSE">
                  <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-xl hover:shadow-2xl">
                    🏠 Vetëm Shtëpitë
                  </button>
                </Link>
                <Link href="/pronat?type=APARTMENT">
                  <button className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-teal-600 transition-all duration-300 shadow-xl hover:shadow-2xl">
                    🏢 Vetëm Apartamentet
                  </button>
                </Link>
                <Link href="/agjentet">
                  <button className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300">
                    💬 Kontakto Agjentin
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        )}
            </div>
  );
}
