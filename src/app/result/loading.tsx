export default function Loading() {
  return (
    <main
      aria-busy="true"
      className="min-h-svh px-5 py-10 sm:px-8 sm:py-14 lg:px-10"
    >
      <span className="sr-only" role="status">
        Loading workflow
      </span>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="space-y-5 border-b border-border pb-8">
          <div className="flex gap-3">
            <div className="h-5 w-32 rounded-full bg-secondary/45" />
            <div className="h-5 w-24 rounded-full bg-secondary/45" />
          </div>
          <div className="max-w-3xl space-y-4">
            <div className="h-12 rounded-2xl bg-secondary/45 sm:h-14" />
            <div className="h-6 max-w-2xl rounded-2xl bg-secondary/45" />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:items-start">
          <aside className="glass rounded-3xl p-5">
            <div className="mb-5 h-6 w-24 rounded-2xl bg-secondary/45" />
            <div className="h-8 rounded-2xl bg-secondary/45" />
            <div className="mt-4 h-2.5 rounded-full bg-secondary/45" />
          </aside>

          <section className="grid gap-5">
            <div className="glass h-64 rounded-3xl" />
            <div className="glass h-64 rounded-3xl" />
            <div className="glass h-64 rounded-3xl" />
          </section>
        </div>
      </div>
    </main>
  );
}
