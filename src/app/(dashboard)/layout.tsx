'use client';
import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Home,
  Users,
  FileText,
  Shield,
  ChevronLeft,
  ChevronRight,
  Menu,
  Compass,
} from 'lucide-react';
import { useAuth } from '@/components/cqc/auth-provider';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getAuth, signOut } from 'firebase/auth';

const NavItem = ({ href, icon: Icon, label, isCollapsed }) => (
  <Link
    href={href}
    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
  >
    <Icon className="h-4 w-4" />
    {!isCollapsed && label}
  </Link>
);

const Header = ({ onMenuClick }) => {
  const { user, profile } = useAuth();
  const auth = getAuth();

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <Button
        variant="outline"
        size="icon"
        className="shrink-0 md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </Button>
      <div className="w-full flex-1">
        {/* Can add search bar here if needed */}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          {profile && (
            <DropdownMenuLabel className="font-normal text-xs text-muted-foreground -mt-2">
              {profile.role}
            </DropdownMenuLabel>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => alert('Settings coming soon!')}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => alert('Support coming soon!')}>
            Support
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { profile } = useAuth();

  const navItems = [
    { href: '/home', icon: Home, label: 'Home' },
    ...(profile?.role === 'Admin'
      ? [{ href: '/admin', icon: Shield, label: 'Admin Dashboard' }]
      : []),
    ...(profile?.role === 'QA'
      ? [{ href: '/qa', icon: FileText, label: 'My Reviews' }]
      : []),
    ...(profile?.role === 'Agent'
      ? [{ href: '/agent', icon: Users, label: 'My Performance' }]
      : []),
  ];

  const SidebarNav = ({ isCollapsed }) => (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
      {navItems.map((item) => (
        <NavItem key={item.href} {...item} isCollapsed={isCollapsed} />
      ))}
    </nav>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr]">
      {/* Desktop Sidebar */}
      <div
        className={`hidden border-r bg-muted/40 md:block transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Compass className="h-6 w-6" />
              {!isCollapsed && <span>Call Compass</span>}
            </Link>
            <Button
              variant="outline"
              size="icon"
              className="ml-auto h-8 w-8"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </div>
          <div className="flex-1">
            <SidebarNav isCollapsed={isCollapsed} />
          </div>
          {!isCollapsed && (
            <div className="mt-auto p-4">
              <Card>
                <CardHeader className="p-2 pt-0 md:p-4">
                  <CardTitle>Upgrade to Pro</CardTitle>
                  <CardDescription>
                    Unlock all features and get unlimited access to our support
                    team.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                  <Button size="sm" className="w-full">
                    Upgrade
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 z-50 w-64 bg-muted/40 border-r p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 font-semibold mb-4">
              <Compass className="h-6 w-6" />
              <span>Call Compass</span>
            </div>
            <SidebarNav isCollapsed={false} />
          </div>
        </div>
      )}

      <div className="flex flex-col">
        <Header onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-gray-50/40">
          {children}
        </main>
      </div>
    </div>
  );
}
