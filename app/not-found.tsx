'use client';

import Link from 'next/link';
import { Zap, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
            <Zap className="h-8 w-8 text-background" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-6xl font-bold text-gray-900 dark:text-gray-100">
            404
          </h1>
          <h2 className="font-heading text-2xl font-semibold">
            Page Not Found
          </h2>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Link>
          </Button>
          <Button className="bg-gradient-to-r from-amber-400 to-orange-500 text-background font-semibold hover:opacity-90" asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
