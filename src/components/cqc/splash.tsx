import { Compass } from 'lucide-react';

export function Splash() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="animate-pulse">
        <Compass className="h-16 w-16 text-primary" />
      </div>
    </div>
  );
}
