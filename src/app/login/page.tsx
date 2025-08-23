
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const brand = {
  name: 'Call Quality Compass',
  logo: '🧭',
  accent: 'bg-[#3B5998]',
  accentHover: 'hover:bg-[#334a80]',
  cta: {
    primary: { label: 'Login', href: '/' },
    secondary: { label: 'Home', href: '/' },
  },
};

const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, delay } },
});

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <div className="text-center">
        <div className="text-6xl mb-4 inline-block">{brand.logo}</div>
        <h1 className="mt-5 text-4xl md:text-6xl font-ext-bold tracking-tight text-gray-900">
          {brand.name}
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Please login to continue.
        </p>

        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeIn()}
          className="mt-10"
        >
          <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg"
            />
            <Link
              href={brand.cta.primary.href}
              className={`w-full inline-flex items-center justify-center text-sm font-medium text-white ${brand.accent} ${brand.accentHover} px-5 py-3 rounded-xl shadow-md`}
            >
              {brand.cta.primary.label}
            </Link>
            <Link
              href={brand.cta.secondary.href}
              className="mt-4 w-full inline-flex items-center justify-center text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 px-5 py-3 rounded-xl shadow-md"
            >
              {brand.cta.secondary.label}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
