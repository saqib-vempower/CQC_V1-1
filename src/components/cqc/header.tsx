import { Compass, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';

type HeaderProps = {
  user?: User | null;
}

export function Header({ user }: HeaderProps) {
  const handleSignOut = async () => {
    await auth.signOut();
  };

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
          {user && (
            <div className='flex items-center gap-4'>
              <span className='text-sm text-muted-foreground'>Welcome, {user.email}</span>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
