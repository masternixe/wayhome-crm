'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { HeroSection } from '@/components/home/hero';
import { FeaturedProperties } from '@/components/home/featured-properties';
import { StatsSection } from '@/components/home/stats-section';
import { AgentSection } from '@/components/home/agent-section';
import { TestimonialsSection } from '@/components/home/testimonials-section';

export default function HomePage() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      
      {/* Hero Section with Advanced Search */}
      <HeroSection />
      
      {/* Featured Properties */}
      <FeaturedProperties />
      
      {/* Stats Section */}
      <StatsSection />
      
      {/* Agents Section */}
      <AgentSection />
      
      {/* Testimonials */}
      <TestimonialsSection />
      
      <PublicFooter />
    </div>
  );
}
