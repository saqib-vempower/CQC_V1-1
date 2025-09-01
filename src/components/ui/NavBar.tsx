
import React from 'react';
import PrimaryButton from './PrimaryButton';

const NavBar = ({ brand }: any) => (
    <div className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/90 border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a
          href="#home"
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <span className="text-xl">{brand.logo}</span>
          <span>{brand.name}</span>
        </a>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#flow" className="hover:text-foreground">
            How it works
          </a>
          <a href="#scorecard" className="hover:text-foreground">
            Scorecard
          </a>
          <a href="#faq" className="hover:text-foreground">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <PrimaryButton href={brand.cta.primary.href}>
            {brand.cta.primary.label}
          </PrimaryButton>
        </div>
      </div>
    </div>
);
  
export default NavBar;