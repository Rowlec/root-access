import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

type AcademicIntegrityNoticeProps = {
  compact?: boolean;
  variant?: "onboarding" | "workflow";
};

export function AcademicIntegrityNotice({
  compact = false,
  variant = "onboarding",
}: AcademicIntegrityNoticeProps) {
  const t = useTranslations("AcademicIntegrityNotice");
  const notice = (
    <div className="glass mx-auto flex w-full max-w-6xl gap-3 rounded-3xl p-4 text-sm leading-6 text-muted-foreground sm:p-5">
      <ShieldCheck
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-primary"
      />
      <div className="space-y-1">
        <p className="font-medium text-foreground">{t(`${variant}.title`)}</p>
        <p>{t(`${variant}.body`)}</p>
      </div>
    </div>
  );

  if (compact) {
    return notice;
  }

  return (
    <section className="w-full px-5 py-6 sm:px-8 lg:px-10">
      {notice}
    </section>
  );
}
