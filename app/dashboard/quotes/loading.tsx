export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-32 bg-slate-800/50 rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-44 bg-slate-800/50 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
