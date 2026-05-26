import { Link } from "@tanstack/react-router";
import { Moon } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children, footer }: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto max-w-6xl px-5 py-5">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <Moon className="h-5 w-5 text-gold" />
          </div>
          <span className="font-display text-xl font-semibold">
            Teknisi<span className="text-gold">.Akhirat</span>
          </span>
        </Link>
      </header>
      <main className="mx-auto max-w-md px-5 pb-16 pt-6">
        <div className="ornament-divider mb-6 text-[10px] uppercase tracking-[0.3em]">
          ﷽
        </div>
        <h1 className="font-display text-4xl leading-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {children}
        </div>
        <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
      </main>
    </div>
  );
}

export function HCaptchaPlaceholder() {
  return (
    <div className="flex items-center gap-3 rounded-md border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
      <div className="flex h-8 w-8 items-center justify-center rounded border border-border bg-background">
        <div className="h-3 w-3 rounded-sm border border-foreground/40" />
      </div>
      <div className="flex-1">
        <div className="font-medium text-foreground">Saya bukan robot</div>
        <div>hCaptcha (akan dipasang di Fase berikutnya)</div>
      </div>
    </div>
  );
}
