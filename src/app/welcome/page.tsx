import { AcademicIntegrityNotice } from "@/components/AcademicIntegrityNotice";
import { LandingAnalytics } from "@/components/analytics/LandingAnalytics";
import { GoalForm } from "@/components/GoalForm";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";

export default function WelcomePage() {
  return (
    <main className="flex min-h-svh flex-col">
      <LandingAnalytics />
      <Hero />
      <HowItWorks />
      <AcademicIntegrityNotice />
      <GoalForm />
    </main>
  );
}
