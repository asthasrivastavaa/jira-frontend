import Link from "next/link";
import { FolderKanban, Settings, Users } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { can } from "@/lib/permissions";
import type { Workspace } from "@/lib/api/workspaces";

export function AppSidebar({ workspace, workspaces }: { workspace: Workspace; workspaces: Workspace[] }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <WorkspaceSwitcher current={workspace} workspaces={workspaces} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href={`/${workspace.slug}/projects`} />}>
                  <FolderKanban />
                  <span>Projects</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href={`/${workspace.slug}/members`} />}>
                  <Users />
                  <span>Members</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {can(workspace.role, "manageWorkspace") && (
                <SidebarMenuItem>
                  <SidebarMenuButton render={<Link href={`/${workspace.slug}/settings`} />}>
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
