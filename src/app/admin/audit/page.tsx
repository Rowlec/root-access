import { Activity } from "lucide-react";

import { getAdminAuditLogs } from "@/lib/server/admin";

export default async function AdminAuditPage() {
  const logs = await getAdminAuditLogs();
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <div className="flex items-center gap-3"><Activity className="text-primary" /><h1 className="text-3xl font-semibold">Admin audit log</h1></div>
      <div className="mt-7 grid gap-3">{logs.map((log) => <article key={log.id} className="rounded-xl border border-border bg-card/70 p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{log.action.replaceAll("_", " ")}</strong><time className="text-xs text-muted-foreground">{log.createdAt.toLocaleString("vi-VN")}</time></div><p className="mt-2 text-sm text-muted-foreground">{log.adminEmail ?? "Admin"} → {log.targetType}:{log.targetId}</p><pre className="mt-2 overflow-x-auto text-xs text-muted-foreground">{JSON.stringify(log.metadata)}</pre></article>)}{!logs.length ? <p className="text-muted-foreground">Chưa có thay đổi admin.</p> : null}</div>
    </main>
  );
}
