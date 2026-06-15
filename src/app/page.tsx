import { AcademicIntegrityNotice } from "@/components/AcademicIntegrityNotice";
import { LandingAnalytics } from "@/components/analytics/LandingAnalytics";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { GoalForm } from "@/components/GoalForm";

export default function Page() {
  return (
    <main className="flex min-h-svh flex-col bg-background">
      <LandingAnalytics />
      <Hero />
      <HowItWorks />
      <AcademicIntegrityNotice />
      <GoalForm />
    </main>
  );
}
