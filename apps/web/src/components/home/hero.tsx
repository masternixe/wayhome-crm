'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MagnifyingGlassIcon, MapPinIcon, CurrencyEuroIcon, BuildingOfficeIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

const propertyTypes = [
  { value: '', label: 'Të gjitha llojet' },
  { value: 'APARTMENT', label: 'Apartament' },
  { value: 'HOUSE', label: 'Shtëpi' },
  { value: 'VILLA', label: 'Vilë' },
  { value: 'COMMERCIAL', label: 'Komercial' },
  { value: 'OFFICE', label: 'Zyrë' },
  { value: 'LAND', label: 'Tokë' }
];

const cities = ['', 'Tirana', 'Durrës', 'Vlorë', 'Shkodër', 'Korçë', 'Fier', 'Elbasan', 'Berat', 'Gjirokastër'];

export function HeroSection() {
  const router = useRouter();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

  const [searchData, setSearchData] = useState({
    q: '',
    type: '',
    city: '',
    zona: '',
    priceMin: '',
    priceMax: ''
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build search params
    const params = new URLSearchParams();
    Object.entries(searchData).forEach(([key, value]) => {
      if (value && value !== '') {
        params.append(key, value.toString());
      }
    });

    // Navigate to properties page with search params
    router.push(`/pronat?${params.toString()}`);
  };

  const handleInputChange = (key: string, value: string) => {
    setSearchData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-orange-900 via-orange-800 to-red-900">
      {/* Animated Background Elements */}
      <motion.div 
        style={{ y, opacity }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-60 right-20 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl"></div>
      </motion.div>

      {/* Floating Icons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        className="absolute top-32 right-1/4 text-orange-300/30"
      >
        <HomeIcon className="w-16 h-16" />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
        className="absolute top-64 left-1/4 text-red-300/30"
      >
        <BuildingOfficeIcon className="w-12 h-12" />
      </motion.div>

      {/* Hero Content */}
      <div className="relative z-10 flex items-center min-h-screen">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            
            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Gjej shtëpinë e{' '}
                <motion.span
                  initial={{ backgroundPosition: '0% 50%' }}
                  animate={{ backgroundPosition: '100% 50%' }}
                  transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                  className="bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent bg-[length:200%_100%]"
                >
                  ëndrrave
                </motion.span>
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl md:text-2xl text-orange-100 leading-relaxed"
              >
                Platforma më e besueshme e pasurive të patundshme në Shqipëri
              </motion.p>
            </motion.div>

            {/* Advanced Search Form */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="max-w-4xl mx-auto"
            >
              <form onSubmit={handleSearch} className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  
                  {/* Location Search */}
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lokacioni
                    </label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Qyteti ose zona..."
                        value={searchData.zona}
                        onChange={(e) => handleInputChange('zona', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Property Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lloji i pronës
                    </label>
                    <div className="relative">
                      <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={searchData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                      >
                        {propertyTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Qyteti
                    </label>
                    <select
                      value={searchData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                    >
                      <option value="">Të gjitha qytetet</option>
                      {cities.slice(1).map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Çmimi minimum
                    </label>
                    <div className="relative">
                      <CurrencyEuroIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        placeholder="Min €"
                        value={searchData.priceMin}
                        onChange={(e) => handleInputChange('priceMin', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Çmimi maksimum
                    </label>
                    <div className="relative">
                      <CurrencyEuroIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        placeholder="Max €"
                        value={searchData.priceMax}
                        onChange={(e) => handleInputChange('priceMax', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Search Button */}
                  <div className="flex items-end">
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <MagnifyingGlassIcon className="w-5 h-5" />
                      Kërko Pronat
                    </motion.button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap justify-center gap-6 pt-4 border-t border-gray-200">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="text-center"
                  >
                    <div className="text-2xl font-bold text-orange-600">10,000+</div>
                    <div className="text-sm text-gray-600">Prona aktive</div>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="text-center"
                  >
                    <div className="text-2xl font-bold text-orange-600">500+</div>
                    <div className="text-sm text-gray-600">Agjentë</div>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="text-center"
                  >
                    <div className="text-2xl font-bold text-orange-600">50+</div>
                    <div className="text-sm text-gray-600">Qytete</div>
                  </motion.div>
                </div>
              </form>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-orange-300/70 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}