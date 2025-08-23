import { Compass } from 'lucide-react';
import React from 'react';

export default function Splash() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Compass className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">Loading Call Compass...</p>
    </div>
  );
}
