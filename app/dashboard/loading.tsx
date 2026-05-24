export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-32 bg-slate-800/50 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-24 bg-slate-800/50 rounded-lg animate-pulse" />
        <div className="h-24 bg-slate-800/50 rounded-lg animate-pulse" />
        <div className="h-24 bg-slate-800/50 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
