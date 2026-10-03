import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/shared/mode-toggle";

export function Topbar() {
  return (
    <header className="flex h-14 items-center gap-4 border-b px-4">
      <SidebarTrigger />
      <div className="flex-1 text-sm text-muted-foreground">Breadcrumbs placeholder</div>
      <div className="text-sm text-muted-foreground">Search placeholder</div>
      <ModeToggle />
      <div className="h-8 w-8 rounded-full bg-muted" />
    </header>
  );
}
