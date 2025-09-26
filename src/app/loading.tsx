export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center space-x-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
        <p className="text-sm text-muted-foreground">Loading your career counseling session...</p>
      </div>
    </div>
  );
}