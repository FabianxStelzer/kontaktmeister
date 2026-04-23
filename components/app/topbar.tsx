"use client";

import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { initials } from "@/lib/utils";
import type { WorkspaceRole } from "@prisma/client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchWorkspace } from "@/app/app/actions";

type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
};

type Ctx = {
  userId: string;
  userEmail: string;
  userName: string | null;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  role: WorkspaceRole;
};

export function Topbar({ ctx, workspaces }: { ctx: Ctx; workspaces: WorkspaceSummary[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onSwitch(id: string) {
    start(async () => {
      await switchWorkspace(id);
      router.refresh();
    });
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <span className="font-medium">{ctx.workspaceName}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.map((w) => (
            <DropdownMenuItem
              key={w.id}
              onClick={() => onSwitch(w.id)}
              disabled={pending}
              className="flex flex-col items-start"
            >
              <span className="font-medium">{w.name}</span>
              <span className="text-xs text-muted-foreground">/{w.slug} &middot; {w.role}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 pl-2 pr-3">
            <Avatar>
              <AvatarFallback>{initials(ctx.userName ?? ctx.userEmail)}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm md:inline">{ctx.userName ?? ctx.userEmail}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{ctx.userEmail}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/app/settings">
              <UserIcon className="mr-2 h-4 w-4" /> Einstellungen
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="mr-2 h-4 w-4" /> Abmelden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
