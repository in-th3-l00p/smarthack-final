import Image from "next/image";
import WalletRedirect from "@/components/WalletRedirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseStatus: "connected" | "missing-env" | "error" = "missing-env";

  if (supabaseUrl) {
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/health`, { cache: "no-store" });
      supabaseStatus = res.ok ? "connected" : "error";
    } catch {
      supabaseStatus = "error";
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex w-full flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-none text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Welcome to SmartHack
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 dark:text-zinc-400">Supabase status:</span>
            {supabaseStatus === "connected" ? (
              <span className="rounded-full bg-green-100 px-2 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                Connected
              </span>
            ) : supabaseStatus === "missing-env" ? (
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                Missing env vars
              </span>
            ) : (
              <span className="rounded-full bg-red-100 px-2 py-1 text-sm font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                Connection error
              </span>
            )}
          </div>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Connect your wallet to continue to the dashboard. You will be redirected automatically after connecting.
          </p>
          <WalletRedirect />
        </div>
      </main>
    </div>
  );
}
