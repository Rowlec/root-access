import { AcademicIntegrityNotice } from "@/components/AcademicIntegrityNotice";
import { LandingAnalytics } from "@/components/analytics/LandingAnalytics";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { GoalForm } from "@/components/GoalForm";
import { SignedInWorkspaceRedirect } from "@/components/SignedInWorkspaceRedirect";

export default function Page() {
  return (
    <main className="flex min-h-svh flex-col">
      {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
        <SignedInWorkspaceRedirect />
      ) : null}
      <LandingAnalytics />
      <Hero />
      <HowItWorks />
      <AcademicIntegrityNotice />
      <GoalForm />
    </main>
  );
}
