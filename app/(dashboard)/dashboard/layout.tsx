import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/components/dashboard/sidebar';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 min-h-screen lg:ml-0">
        <div className="h-full p-4 lg:p-8 pt-20 lg:pt-8 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
