import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
}
