export default function Loading() {
  return (
    <main
      aria-busy="true"
      className="min-h-svh px-5 py-14 sm:px-8 lg:px-10"
    >
      <span className="sr-only" role="status">
        Loading Root Access
      </span>
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <div className="h-8 w-32 rounded-full bg-secondary/45" />
          <div className="space-y-4">
            <div className="h-12 max-w-2xl rounded-2xl bg-secondary/45 sm:h-14" />
            <div className="h-12 max-w-xl rounded-2xl bg-secondary/45 sm:h-14" />
            <div className="h-6 max-w-lg rounded-2xl bg-secondary/45" />
          </div>
          <div className="h-12 w-40 rounded-full bg-primary/35" />
        </section>

        <section className="glass rounded-3xl p-5">
          <div className="mb-5 h-14 rounded-2xl bg-secondary/45" />
          <div className="space-y-3">
            <div className="h-16 rounded-2xl bg-secondary/35" />
            <div className="h-16 rounded-2xl bg-secondary/35" />
            <div className="h-16 rounded-2xl bg-secondary/35" />
          </div>
        </section>
      </div>
    </main>
  );
}
