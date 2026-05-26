import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LogOut, Moon, Plus, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Dashboard — Teknisi.Akhirat" }] }),
});

function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Memuat...
      </div>
    );
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Saudaraku";

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Moon className="h-4 w-4 text-gold" />
            </div>
            <span className="font-display text-lg font-semibold">
              Teknisi<span className="text-gold">.Akhirat</span>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
        {/* Greeting */}
        <div>
          <p className="text-sm text-gold">السلام عليكم</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">
            Assalamu'alaikum, <span className="italic">{displayName}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Semoga harimu penuh keberkahan. Siap membuat caption baru?
          </p>
        </div>

        {/* Primary CTA */}
        <Link
          to="/kajian/baru"
          className="group mt-8 flex w-full items-center justify-between gap-4 rounded-2xl border border-foreground/10 bg-primary p-6 text-left text-primary-foreground transition-all hover:border-gold sm:p-8"
        >
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold">Mulai</div>
            <div className="mt-1 font-display text-2xl sm:text-3xl">Kajian Baru</div>
            <div className="mt-1 text-sm text-primary-foreground/70">
              Unggah audio atau tempel transkrip kajianmu.
            </div>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold text-gold-foreground transition-transform group-hover:scale-110">
            <Plus className="h-6 w-6" />
          </div>
        </Link>

        {/* History */}
        <section className="mt-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-2xl">History Kajian</h2>
            <span className="text-xs text-muted-foreground">0 kajian</span>
          </div>
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <ScrollText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-display text-xl">Belum ada kajian</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Kajian yang Anda proses akan muncul di sini.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
