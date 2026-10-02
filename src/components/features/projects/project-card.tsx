import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProjectCardMenu } from "./project-card-menu";
import type { Project } from "@/types/project";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="transition-colors hover:border-primary">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <Link href={`/projects/${project.key}`} className="flex-1">
          <CardTitle className="flex items-center gap-2">
            <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{project.key}</span>
            {project.name}
          </CardTitle>
          {project.description && <CardDescription>{project.description}</CardDescription>}
        </Link>
        <ProjectCardMenu project={project} />
      </CardHeader>
    </Card>
  );
}
