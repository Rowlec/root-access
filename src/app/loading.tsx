export default function Loading() {
  return (
    <main className="min-h-svh bg-background px-5 py-14 sm:px-8 lg:px-10">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <div className="h-8 w-32 rounded-lg bg-muted" />
          <div className="space-y-4">
            <div className="h-12 max-w-2xl rounded-lg bg-muted sm:h-14" />
            <div className="h-12 max-w-xl rounded-lg bg-muted sm:h-14" />
            <div className="h-6 max-w-lg rounded-lg bg-muted" />
          </div>
          <div className="h-12 w-40 rounded-lg bg-muted" />
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 h-14 rounded-lg bg-muted" />
          <div className="space-y-3">
            <div className="h-16 rounded-lg bg-muted" />
            <div className="h-16 rounded-lg bg-muted" />
            <div className="h-16 rounded-lg bg-muted" />
          </div>
        </section>
      </div>
    </main>
  );
}
