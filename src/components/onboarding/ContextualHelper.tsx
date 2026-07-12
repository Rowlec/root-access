import { Lightbulb } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ContextualHelper({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm leading-6 text-muted-foreground",
        className,
      )}
    >
      <Lightbulb aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
      <p>{children}</p>
    </div>
  );
}
