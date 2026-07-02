'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Sparkles, Library, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

const navItems = [
  { label: 'Generate', href: '/dashboard', icon: Sparkles },
  { label: 'Library', href: '/dashboard/library', icon: Library },
];

const bottomNavItems = [
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, session, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(true);
  const [generationsCount, setGenerationsCount] = useState(0);

  // Fetch user stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!session) return;

      try {
        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setGenerationsCount(data.profile.generations_used);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, [session]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (!collapsed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [collapsed]);

  // Close menu on route change
  useEffect(() => {
    setCollapsed(true);
  }, [pathname]);

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border touch-manipulation"
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle menu"
      >
        {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      {!collapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col',
          'transform transition-transform duration-200 lg:transform-none',
          collapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 px-6 flex items-center border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
              <Zap className="h-5 w-5 text-background" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight">
              Hook<span className="gradient-text">Forge</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setCollapsed(true)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors touch-manipulation',
                    isActive
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary active:bg-secondary'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="px-4 py-4 border-t border-border space-y-1">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setCollapsed(true)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors touch-manipulation',
                  isActive
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary active:bg-secondary'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}

          {/* User info and sign out */}
          <div className="pt-4 border-t border-border mt-4">
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium truncate">
                {user?.email || 'Loading...'}
              </p>
              <p className="text-xs text-muted-foreground">{generationsCount} hooks generated</p>
            </div>

            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground touch-manipulation"
              onClick={signOut}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
