export default function ConsoleLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      {/* Spinner */}
      <div className="relative mb-6">
        <div className="size-10 rounded-full border-[3px] border-muted/30" />
        <div className="absolute inset-0 size-10 animate-spin rounded-full border-[3px] border-transparent border-t-primary" />
      </div>
      <p className="text-sm font-medium text-muted-foreground/50">Loading...</p>
    </div>
  );
}
