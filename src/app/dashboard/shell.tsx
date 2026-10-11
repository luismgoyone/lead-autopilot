import Link from "next/link";
import { Logo } from "@/components/logo";
import { logout } from "./actions";

// Header for signed-in dashboard pages.
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="bg-pine text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Logo light />
            <span className="hidden rounded-full bg-white/10 px-3 py-1 text-xs font-semibold sm:inline">
              Lead Autopilot
            </span>
          </Link>
          <form action={logout}>
            <button type="submit" className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
