import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface PageCardLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  headerContent?: React.ReactNode; 
}

export function PageCardLayout({ title, description, children, headerContent }: PageCardLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-4xl">
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
  );
}
