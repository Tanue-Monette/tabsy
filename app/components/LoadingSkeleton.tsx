export default function LoadingSkeleton({
  variant = "page",
}: {
  variant?: "page" | "list" | "form" | "detail" | "report";
}) {
  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-32 animate-pulse">
      <header className="bg-[#18181b] text-white px-6 pt-10 pb-6 shadow-lg border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-800" />
          <div className="space-y-1.5">
            <div className="w-16 h-2.5 bg-zinc-800 rounded" />
            <div className="w-32 h-5 bg-zinc-700 rounded" />
          </div>
        </div>
      </header>

      <main className="px-6 space-y-5 pt-6 max-w-2xl mx-auto">
        {variant === "form" ? (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200/80 space-y-4">
            <div className="h-12 bg-zinc-100 rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 bg-zinc-100 rounded-2xl" />
              <div className="h-12 bg-zinc-100 rounded-2xl" />
            </div>
            <div className="h-12 bg-zinc-100 rounded-2xl" />
          </div>
        ) : variant === "report" ? (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="h-24 bg-white rounded-3xl border border-zinc-200/80" />
              <div className="h-24 bg-white rounded-3xl border border-zinc-200/80" />
              <div className="h-24 bg-white rounded-3xl border border-zinc-200/80" />
            </div>
            <div className="bg-white rounded-3xl p-5 border border-zinc-200/80 space-y-3">
              <div className="h-10 bg-zinc-100 rounded-2xl" />
              <div className="space-y-2">
                <div className="h-12 bg-zinc-50 rounded-2xl" />
                <div className="h-12 bg-zinc-50 rounded-2xl" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-14 bg-zinc-200/70 rounded-2xl w-full" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-24 bg-white rounded-3xl border border-zinc-200/80" />
              <div className="h-24 bg-white rounded-3xl border border-zinc-200/80" />
            </div>
            <div className="space-y-3">
              <div className="h-16 bg-white rounded-3xl border border-zinc-200/80" />
              <div className="h-16 bg-white rounded-3xl border border-zinc-200/80" />
              <div className="h-16 bg-white rounded-3xl border border-zinc-200/80" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
