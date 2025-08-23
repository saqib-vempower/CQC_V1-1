'use client';
import { useAuth } from '@/components/cqc/auth-provider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const StatCard = ({ title, value, change, changeType, icon: Icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className={`text-xs ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
        {change} from last month
      </p>
    </CardContent>
  </Card>
);

export default function HomePage() {
  const { profile } = useAuth();
  const router = useRouter();

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  const roleActions = {
    Admin: [
      { title: 'Admin Dashboard', description: 'View all calls and manage users.', href: '/admin' },
      { title: 'New Audit', description: 'Start a new call audit.', href: '/audits' },
    ],
    QA: [
      { title: 'My Reviews', description: 'View calls assigned to you for review.', href: '/qa' },
      { title: 'New Audit', description: 'Start a new call audit.', href: '/audits' },
    ],
    Agent: [
      { title: 'My Performance', description: 'Review your call scores and feedback.', href: '/agent' },
    ],
  };

  const actions = roleActions[profile.role] || [];

  return (
    <div className="flex-1 space-y-4">
      <h1 className="text-2xl font-bold">Welcome, {profile.name}</h1>
      <p className="text-muted-foreground">Here's a quick overview of your workspace.</p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder Stat Cards */}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {actions.map(action => (
          <Card key={action.title} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{action.title}</CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push(action.href)}>
                Go to {action.title} <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
