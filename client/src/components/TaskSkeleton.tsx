export function TaskSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-4 w-full">
            {/* Fake Checkbox */}
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-800 shrink-0"></div>
            {/* Fake Title */}
            <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/3"></div>
          </div>
          {/* Fake Badge */}
          <div className="h-6 w-16 bg-gray-200 dark:bg-zinc-800 rounded-md shrink-0"></div>
        </div>
      ))}
    </div>
  );
}