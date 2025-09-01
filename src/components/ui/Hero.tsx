
import React from 'react';
import { motion } from 'framer-motion';
import PrimaryButton from './PrimaryButton';

const fadeIn = (delay = 0) => ({
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, delay } },
});
  
const Hero = ({ brand }: any) => (
    <section id="home" className="relative overflow-hidden">
      {/* Gradient overlay must not block clicks */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary via-primary/70 to-secondary opacity-10"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeIn()}
          className="text-center"
        >
          <div className="text-6xl mb-4 inline-block">{brand.logo}</div>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
            {brand.name}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered call auditing tool to empower agents.
          </p>
  
          <div className="mt-10">
            <PrimaryButton href={brand.cta.primary.href}>
              {brand.cta.primary.label}
            </PrimaryButton>
          </div>
  
          <div className="mt-10 text-xs text-muted-foreground">
            Built on Firebase • Gemini • AssemblyAI
          </div>
        </motion.div>
      </div>
    </section>
);

export default Hero;