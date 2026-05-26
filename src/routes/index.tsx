import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ScrollText, Share2, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Teknisi.Akhirat — Caption Dakwah Otomatis" },
      { name: "description", content: "Ubah transkrip kajian menjadi caption siap posting di Instagram, TikTok, dan lainnya." },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <Moon className="h-5 w-5 text-gold" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">
            Teknisi<span className="text-gold">.Akhirat</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/login" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex">
            Masuk
          </Link>
          <Link to="/register">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Daftar
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-5 pt-10 pb-20 text-center sm:pt-20">
        <div className="ornament-divider mx-auto mb-8 max-w-xs text-xs uppercase tracking-[0.3em]">
          بسم الله
        </div>
        <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl md:text-7xl">
          Dari Transkrip Kajian
          <br />
          <span className="italic text-gold">menjadi Caption</span> Siap Posting
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
          Platform untuk kreator konten dakwah. Tulis sekali, sebar di semua platform — Instagram,
          TikTok, Facebook, dan Threads — dalam hitungan detik.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/register">
            <Button
              size="lg"
              className="h-12 bg-primary px-8 text-base text-primary-foreground hover:bg-primary/90"
            >
              Mulai Bismillah
              <Sparkles className="ml-2 h-4 w-4 text-gold" />
            </Button>
          </Link>
          <Link to="/login">
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-foreground/20 px-8 text-base hover:bg-secondary"
            >
              Sudah punya akun? Masuk
            </Button>
          </Link>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">Gratis untuk memulai · Tanpa kartu kredit</p>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-5xl gap-px bg-border sm:grid-cols-3">
          {[
            {
              icon: ScrollText,
              title: "Transkrip Otomatis",
              desc: "Unggah audio atau tempel teks kajian — biar kami yang mengubahnya menjadi caption rapi.",
            },
            {
              icon: Sparkles,
              title: "Gaya Bahasa Islami",
              desc: "Tone hangat dan santun, lengkap dengan dalil, tetap relevan untuk audiens media sosial.",
            },
            {
              icon: Share2,
              title: "Multi-Platform",
              desc: "Caption dioptimalkan per platform: Instagram, TikTok, Facebook, Threads, dan X.",
            },
          ].map((f) => (
            <div key={f.title} className="bg-background p-8">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary">
                <f.icon className="h-5 w-5 text-gold" />
              </div>
              <h3 className="font-display text-2xl">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h2 className="font-display text-4xl sm:text-5xl">
          Sebarkan kebaikan, <span className="text-gold italic">lebih luas</span>.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Setiap caption yang dibagikan adalah amal jariyah. Mulai sekarang, gratis.
        </p>
        <Link to="/register">
          <Button size="lg" className="mt-8 h-12 bg-primary px-8 text-primary-foreground hover:bg-primary/90">
            Daftar Sekarang
          </Button>
        </Link>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Teknisi.Akhirat — Untuk dakwah yang lebih luas.
      </footer>
    </div>
  );
}
