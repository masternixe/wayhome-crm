'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { HomeIcon, UsersIcon, MapPinIcon, CheckCircleIcon } from '@heroicons/react/20/solid';

interface StatItem {
  icon: React.ComponentType<any>;
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
}

const defaultStats: StatItem[] = [
  {
    icon: HomeIcon,
    value: 10000,
    label: 'Prona aktive',
    suffix: '+'
  },
  {
    icon: CheckCircleIcon,
    value: 2500,
    label: 'Prona të shitura',
    suffix: '+'
  },
  {
    icon: UsersIcon,
    value: 500,
    label: 'Agjentë profesionalë',
    suffix: '+'
  },
  {
    icon: MapPinIcon,
    value: 50,
    label: 'Qytete të mbuluara',
    suffix: '+'
  }
];

function AnimatedCounter({ 
  value, 
  duration = 2000, 
  prefix = '', 
  suffix = '' 
}: { 
  value: number; 
  duration?: number; 
  prefix?: string; 
  suffix?: string; 
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration });
  const displayed = useTransform(springValue, (latest) => 
    Math.round(latest).toLocaleString()
  );

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, motionValue, value]);

  return (
    <span ref={ref} className="inline-block">
      {prefix}
      <motion.span>{displayed}</motion.span>
      {suffix}
    </span>
  );
}

export function StatsSection() {
  const [stats, setStats] = useState<StatItem[]>(defaultStats);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const apiStats: StatItem[] = [
          {
            icon: HomeIcon,
            value: data.data.totalProperties || 0,
            label: 'Prona aktive',
            suffix: '+'
          },
          {
            icon: CheckCircleIcon,
            value: data.data.soldProperties || 0,
            label: 'Prona të shitura',
            suffix: '+'
          },
          {
            icon: UsersIcon,
            value: data.data.activeAgents || 0,
            label: 'Agjentë profesionalë',
            suffix: '+'
          },
          {
            icon: MapPinIcon,
            value: data.data.totalCities || 0,
            label: 'Qytete të mbuluara',
            suffix: '+'
          }
        ];
        setStats(apiStats);
      } else {
        console.warn('No stats found or invalid response format');
        // Use the API data even if it's zeros
        const apiStats: StatItem[] = [
          {
            icon: HomeIcon,
            value: 0,
            label: 'Prona aktive',
            suffix: ''
          },
          {
            icon: CheckCircleIcon,
            value: 0,
            label: 'Prona të shitura',
            suffix: ''
          },
          {
            icon: UsersIcon,
            value: 0,
            label: 'Agjentë profesionalë',
            suffix: ''
          },
          {
            icon: MapPinIcon,
            value: 0,
            label: 'Qytete të mbuluara',
            suffix: ''
          }
        ];
        setStats(apiStats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Show zeros instead of fake data
      const zeroStats: StatItem[] = [
        {
          icon: HomeIcon,
          value: 0,
          label: 'Prona aktive',
          suffix: ''
        },
        {
          icon: CheckCircleIcon,
          value: 0,
          label: 'Prona të shitura',
          suffix: ''
        },
        {
          icon: UsersIcon,
          value: 0,
          label: 'Agjentë profesionalë',
          suffix: ''
        },
        {
          icon: MapPinIcon,
          value: 0,
          label: 'Qytete të mbuluara',
          suffix: ''
        }
      ];
      setStats(zeroStats);
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
    hidden: { opacity: 0, y: 50, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section ref={ref} className="py-20 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
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
            Të dhënat që{' '}
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              flasin
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Udhëheqës në tregun e pasurive të patundshme në Shqipëri
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                y: -10,
                transition: { duration: 0.3 }
              }}
              className="group"
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
                
                {/* Icon */}
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl mb-6 group-hover:from-orange-600 group-hover:to-red-600 transition-all duration-300"
                >
                  <stat.icon className="w-8 h-8 text-white" />
                </motion.div>

                {/* Value */}
                <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                  <AnimatedCounter 
                    value={stat.value} 
                    prefix={stat.prefix} 
                    suffix={stat.suffix}
                  />
                </div>

                {/* Label */}
                <p className="text-gray-600 text-lg font-medium">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16"
        >
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 md:p-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Bashkohuni me mijëra klientë të kënaqur
            </h3>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Besimi i klientëve tanë është arsyeja kryesore e suksesit tonë në tregun e pasurive të patundshme
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Fillo kërkimin tënd →
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
