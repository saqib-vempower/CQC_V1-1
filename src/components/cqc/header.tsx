import { Compass } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold tracking-tight font-headline">
              Call Quality Compass
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
