export default function RootLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background text-foreground">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="font-mono text-sm text-muted-foreground">Loading AeroStress...</p>
    </div>
  );
}
