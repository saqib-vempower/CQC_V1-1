'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Header } from '@/components/cqc/header';
import { useAuth } from '@/components/cqc/auth-provider';
import { Home, ClipboardList, BarChart3, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: '/home', label: 'Home', icon: Home, roles: ['Admin', 'QA', 'Agent'] },
    { href: '/audits', label: 'New Audit', icon: ClipboardList, roles: ['Admin', 'QA'] },
    { href: '/admin', label: 'Admin Dashboard', icon: BarChart3, roles: ['Admin'] },
    { href: '/qa', label: 'QA Dashboard', icon: Users, roles: ['QA'] },
    { href: '/agent', label: 'Agent View', icon: Users, roles: ['Agent'] },
  ];
  
  const accessibleNavItems = navItems.filter(item => userProfile?.role && item.roles.includes(userProfile.role));


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
           <SidebarTrigger />
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                {accessibleNavItems.map(item => (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={pathname === item.href}>
                            <Link href={item.href}>
                                <item.icon />
                                <span>{item.label}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
