import { ProposalWorkspaceEntry } from "@/components/proposal/ProposalWorkspaceEntry";

type ResultPhasePageProps = {
  params: Promise<{ phase: string; section: string }>;
};

export default async function ResultPhasePage({ params }: ResultPhasePageProps) {
  const { phase, section } = await params;

  return <ProposalWorkspaceEntry phase={phase} sectionId={section} />;
}
