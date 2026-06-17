export default function Loading() {
  return (
    <main
      aria-busy="true"
      className="min-h-svh bg-background px-5 py-10 sm:px-8 sm:py-14 lg:px-10"
    >
      <span className="sr-only" role="status">
        Loading workflow
      </span>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="space-y-5 border-b border-border pb-8">
          <div className="flex gap-3">
            <div className="h-5 w-32 rounded-full bg-muted" />
            <div className="h-5 w-24 rounded-full bg-muted" />
          </div>
          <div className="max-w-3xl space-y-4">
            <div className="h-12 rounded-lg bg-muted sm:h-14" />
            <div className="h-6 max-w-2xl rounded-lg bg-muted" />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:items-start">
          <aside className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-5 h-6 w-24 rounded-lg bg-muted" />
            <div className="h-8 rounded-lg bg-muted" />
            <div className="mt-4 h-2.5 rounded-full bg-muted" />
          </aside>

          <section className="grid gap-5">
            <div className="h-64 rounded-lg border border-border bg-card shadow-sm" />
            <div className="h-64 rounded-lg border border-border bg-card shadow-sm" />
            <div className="h-64 rounded-lg border border-border bg-card shadow-sm" />
          </section>
        </div>
      </div>
    </main>
  );
}
