import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface PageCardLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  headerContent?: React.ReactNode; // Optional prop for extra header content like buttons
}

export function PageCardLayout({ title, description, children, headerContent }: PageCardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="mx-auto w-full max-w-full"> {/* Let the card define the width */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="grid gap-1">
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
              {headerContent}
            </div>
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
