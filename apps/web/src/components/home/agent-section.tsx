'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { StarIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/solid';
import { MapPinIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  specialization?: string;
  city?: string;
  rating?: number;
  totalSales?: number;
}

export function AgentSection() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    fetchTopAgents();
  }, []);

  const fetchTopAgents = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/agents?limit=3`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data && Array.isArray(data.data)) {
        // Transform the API data to match our component interface
        const transformedAgents = data.data.map((agent: any) => ({
          id: agent.id,
          firstName: agent.firstName,
          lastName: agent.lastName,
          email: agent.email,
          phone: agent.phone,
          avatar: agent.avatar,
          specialization: 'Agjent i pasurive të patundshme',
          city: agent.office?.city || 'Tirana',
          rating: 4.8 + Math.random() * 0.4, // Generate random rating between 4.8-5.2
          totalSales: Math.floor(Math.random() * 100) + 50 // Random sales count
        }));
        setAgents(transformedAgents);
      } else {
        console.warn('No agents found');
        setAgents([]);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
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

  return (
          <section ref={ref} className="py-20 bg-gradient-to-br from-gray-50 to-orange-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-400 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Agjentët tanë{' '}
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              ekspertë
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ekipi ynë i agjentëve profesionalë është gati t'ju ndihmojë të gjeni pronën perfekte
          </p>
        </motion.div>

        {/* Agents Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg animate-pulse">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mb-6"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2 w-32"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-24"></div>
                  <div className="h-4 bg-gray-200 rounded mb-6 w-40"></div>
                  <div className="flex gap-2 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-4 h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {agents.map((agent, index) => (
              <motion.div
                key={agent.id}
                variants={itemVariants}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                {/* Agent Avatar */}
                <div className="flex flex-col items-center mb-6">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-24 h-24 mb-4"
                  >
                    {agent.avatar ? (
                      <Image
                        src={agent.avatar}
                        alt={`${agent.firstName} ${agent.lastName}`}
                        fill
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {agent.firstName[0]}{agent.lastName[0]}
                      </div>
                    )}
                    
                    {/* Online Indicator */}
                    <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                  </motion.div>

                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {agent.firstName} {agent.lastName}
                  </h3>
                  
                  <p className="text-orange-600 font-medium mb-2">
                    {agent.specialization || 'Agjent i pasurive të patundshme'}
                  </p>

                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    <span className="text-sm">{agent.city}</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(agent.rating || 0)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    {agent.rating} ({agent.totalSales} shitje)
                  </span>
                </div>

                {/* Contact Buttons */}
                <div className="space-y-3">
                  <motion.a
                    href={`mailto:${agent.email}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <EnvelopeIcon className="w-4 h-4" />
                    Dërgo email
                  </motion.a>

                  {agent.phone && (
                    <motion.a
                      href={`tel:${agent.phone}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-white border-2 border-orange-600 text-orange-600 py-3 px-4 rounded-lg font-semibold hover:bg-orange-600 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <PhoneIcon className="w-4 h-4" />
                      Telefono
                    </motion.a>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* View All Agents Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mt-12"
        >
          <Link href="/agjentet">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-orange-600 border-2 border-orange-600 px-8 py-4 rounded-lg font-semibold hover:bg-orange-600 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Shiko të gjithë agjentët →
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}