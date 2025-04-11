
import React from 'react';
import Layout from '@/components/Layout';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Testimonials from '@/components/Testimonials';
import CTA from '@/components/CTA';

const Index: React.FC = () => {
  return (
    <Layout>
      <Hero />
      <Features />
      <Testimonials />
      <CTA />
    </Layout>
  );
};

export default Index;
