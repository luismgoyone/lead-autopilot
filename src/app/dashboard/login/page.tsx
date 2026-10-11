import type { Metadata } from "next";
import { LogoMark } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Owner login · Lead Autopilot" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-[0_12px_32px_-8px_rgba(31,42,48,0.12)]">
        <LogoMark className="h-12 w-12" />
        <h1 className="mt-5 font-display text-3xl font-medium text-pine">Lead Autopilot</h1>
        <p className="mt-1 text-slate/70">Pinecrest Dental owner dashboard</p>
        <LoginForm />
      </div>
    </main>
  );
}
