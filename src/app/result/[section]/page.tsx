import { ProposalWorkspaceEntry } from "@/components/proposal/ProposalWorkspaceEntry";

type ResultSectionPageProps = {
  params: Promise<{ section: string }>;
};

export default async function ResultSectionPage({
  params,
}: ResultSectionPageProps) {
  const { section } = await params;

  return <ProposalWorkspaceEntry sectionId={section} />;
}
