export default function DashboardLoading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="font-mono text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
}
