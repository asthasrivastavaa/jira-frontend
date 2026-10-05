import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { SearchButton } from "@/components/layout/search-button";
import type { AuthUser } from "@/lib/api/auth";

export function Topbar({ user }: { user: AuthUser }) {
  return (
    <header className="flex h-14 items-center gap-4 border-b px-4">
      <SidebarTrigger />
      <div className="flex-1 text-sm text-muted-foreground">Breadcrumbs placeholder</div>
      <SearchButton />
      <ModeToggle />
      <UserMenu user={user} />
    </header>
  );
}
