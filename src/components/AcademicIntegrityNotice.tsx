import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

type AcademicIntegrityNoticeProps = {
  compact?: boolean;
};

export function AcademicIntegrityNotice({
  compact = false,
}: AcademicIntegrityNoticeProps) {
  const t = useTranslations("AcademicIntegrityNotice");
  const notice = (
    <div className="mx-auto flex w-full max-w-6xl gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground shadow-sm sm:p-5">
      <ShieldCheck
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-foreground"
      />
      <p>{t("body")}</p>
    </div>
  );

  if (compact) {
    return notice;
  }

  return (
    <section className="w-full bg-background px-5 py-6 sm:px-8 lg:px-10">
      {notice}
    </section>
  );
}
