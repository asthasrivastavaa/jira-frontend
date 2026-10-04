import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { WorkspaceProvider } from "@/components/layout/workspace-provider";
import { getMe } from "@/lib/me";
import { getWorkspace } from "@/lib/workspace";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const [workspace, me] = await Promise.all([getWorkspace(workspaceSlug), getMe()]);

  return (
    <WorkspaceProvider workspace={workspace}>
      <SidebarProvider>
        <AppSidebar workspace={workspace} workspaces={me.workspaces} />
        <SidebarInset>
          <Topbar user={me.user} />
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </WorkspaceProvider>
  );
}
