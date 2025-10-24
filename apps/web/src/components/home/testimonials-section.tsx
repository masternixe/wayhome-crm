'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { StarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import Image from 'next/image';

interface Testimonial {
  id: string;
  name: string;
  location: string;
  avatar?: string;
  rating: number;
  comment: string;
  propertyType: string;
  date: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Fatmir Brahimi',
    location: 'Tirana',
    rating: 5,
    comment: 'Wayhome më ndihmoi të gjej apartamentin perfekt për familjen time. Shërbimi ishte profesional dhe shumë i shpejtë. Rekomandoj pa rezerva!',
    propertyType: 'Apartament 3+1',
    date: '2024-01-15'
  },
  {
    id: '2',
    name: 'Mirela Koka',
    location: 'Durrës',
    rating: 5,
    comment: 'Eksperiencë e shkëlqyer! Agjenti im ishte shumë i ditur dhe më ndihmoi në çdo hap. Gjeta vilën e ëndrrave afër detit.',
    propertyType: 'Vilë me pamje deti',
    date: '2024-01-10'
  },
  {
    id: '3',
    name: 'Erion Sulaj',
    location: 'Vlorë',
    rating: 5,
    comment: 'Platforma është shumë e lehtë për t\'u përdorur. Gjeta zyrën e duhur për biznesin tim brenda javës. Faleminderit Wayhome!',
    propertyType: 'Hapësirë komerciale',
    date: '2024-01-05'
  },
  {
    id: '4',
    name: 'Ana Shkurti',
    location: 'Shkodër',
    rating: 5,
    comment: 'Shërbim i pakonkurueshëm! Agjenti më orientoi drejt dhe më ndihmoi të marr vendimin e duhur. Shtëpia e re është perfekte.',
    propertyType: 'Shtëpi familjare',
    date: '2023-12-28'
  },
  {
    id: '5',
    name: 'Gentian Basha',
    location: 'Korçë',
    rating: 5,
    comment: 'Me Wayhome procesi i blerjes së pronës u bë shumë më i thjeshtë. Çmimet ishin transparente dhe pa surpriza.',
    propertyType: 'Apartament 2+1',
    date: '2023-12-20'
  }
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextTestimonial = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <section ref={ref} className="py-20 bg-gradient-to-br from-orange-900 via-red-900 to-yellow-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-400 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Çka thonë{' '}
            <span className="bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent">
              klientët tanë
            </span>
          </h2>
                      <p className="text-xl text-orange-100 max-w-3xl mx-auto">
            Dëshmitë e klientëve tanë të kënaqur janë motivimi ynë për të vazhduar të përmirësohemi
          </p>
        </motion.div>

        {/* Testimonials Carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="relative h-[400px] flex items-center justify-center">
            
            {/* Navigation Buttons */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevTestimonial}
              className="absolute left-0 z-10 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextTestimonial}
              className="absolute right-0 z-10 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </motion.button>

            {/* Testimonial Cards */}
            <div className="relative w-full h-full flex items-center justify-center">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2 }
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipe = swipePower(offset.x, velocity.x);

                    if (swipe < -swipeConfidenceThreshold) {
                      nextTestimonial();
                    } else if (swipe > swipeConfidenceThreshold) {
                      prevTestimonial();
                    }
                  }}
                  className="absolute w-full max-w-2xl"
                >
                  <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
                    
                    {/* Quote Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"/>
                        </svg>
                      </div>
                    </div>

                    {/* Testimonial Content */}
                    <blockquote className="text-lg md:text-xl text-white text-center leading-relaxed mb-8">
                      "{testimonials[currentIndex].comment}"
                    </blockquote>

                    {/* Rating */}
                    <div className="flex justify-center mb-6">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-5 h-5 ${
                              i < testimonials[currentIndex].rating
                                ? 'text-yellow-400'
                                : 'text-gray-400'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Client Info */}
                    <div className="flex items-center justify-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                        {testimonials[currentIndex].name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-white">
                          {testimonials[currentIndex].name}
                        </div>
                        <div className="text-blue-200 text-sm">
                          {testimonials[currentIndex].location} • {testimonials[currentIndex].propertyType}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentIndex 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mt-16"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20">
            <h3 className="text-3xl font-bold text-white mb-4">
              Jeni gati të gjeni pronën tuaj të ardhshme?
            </h3>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Bashkohuni me mijëra klientë të kënaqur që kanë gjetur shtëpinë e ëndrrave me Wayhome
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-8 py-4 rounded-lg font-semibold hover:from-orange-600 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Fillo kërkimin tënd →
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
