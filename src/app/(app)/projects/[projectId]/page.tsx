import { KanbanBoard } from "@/components/board/kanban-board";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ issue?: string }>;
}) {
  const { projectId } = await params;
  const { issue } = await searchParams;
  return (
    <KanbanBoard
      key={`${projectId}:${issue ?? ""}`}
      projectId={projectId}
      initialIssueId={issue}
    />
  );
}
