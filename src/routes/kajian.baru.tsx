import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, FileAudio, FileText, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/kajian/baru")({
  component: KajianBaruPage,
  head: () => ({ meta: [{ title: "Kajian Baru — Teknisi.Akhirat" }] }),
});

function isValidYouTubeUrl(raw: string): boolean {
  const url = raw.trim();
  if (!url) return false;
  try {
    const u = new URL(url);
    return /(^|\.)youtube\.com$/.test(u.hostname) || u.hostname === "youtu.be";
  } catch {
    return /(youtube\.com|youtu\.be)/i.test(url);
  }
}

function KajianBaruPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"audio" | "teks" | "youtube">("teks");
  const [namaUstadz, setNamaUstadz] = useState("");
  const [temaKitab, setTemaKitab] = useState("");
  const [episode, setEpisode] = useState("");
  const [sumber, setSumber] = useState("");
  const [transkrip, setTranskrip] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [hasil, setHasil] = useState("");
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const youtubeTouched = youtubeUrl.trim().length > 0;
  const youtubeValid = useMemo(() => isValidYouTubeUrl(youtubeUrl), [youtubeUrl]);

  const identitasValid =
    namaUstadz.trim().length > 0 &&
    temaKitab.trim().length > 0 &&
    episode.trim().length > 0;

  const inputTranskrip = useMemo(() => {
    if (tab === "teks") return transkrip.trim();
    if (tab === "youtube") return youtubeValid ? youtubeUrl.trim() : "";
    return "";
  }, [tab, transkrip, youtubeUrl, youtubeValid]);

  const canProcess = identitasValid && inputTranskrip.length > 0 && !processing;

  async function handleProcess() {
    if (!canProcess) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!apiKey) {
      setProcessError("VITE_GEMINI_API_KEY belum di-set.");
      return;
    }

    setProcessing(true);
    setProcessError(null);
    setHasil("");

    try {
      const endpoint =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

      const prompt = [
        "Tolong olah transkrip kajian berikut menjadi dokumen Markdown (.md) yang rapi.",
        "",
        "Identitas:",
        `- Nama Ustadz: ${namaUstadz.trim()}`,
        `- Tema/Kitab: ${temaKitab.trim()}`,
        `- Episode: ${episode.trim()}`,
        sumber.trim().length > 0 ? `- Sumber: ${sumber.trim()}` : "- Sumber: -",
        "",
        tab === "youtube"
          ? "Input transkrip berupa URL YouTube. Jangan membuat transkrip fiktif; jika tidak ada teks transkrip, jelaskan keterbatasan dan minta teks transkrip."
          : "Input transkrip berupa teks.",
        "",
        "Transkrip:",
        inputTranskrip,
      ].join("\n");

      const res = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      });

      if (!res.ok) {
        const raw = await res.text();
        throw new Error(raw || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };

      const text =
        data.candidates?.[0]?.content?.parts
          ?.map((p) => p.text)
          .filter((t): t is string => Boolean(t))
          .join("") ?? "";

      if (!text.trim()) throw new Error("Respons kosong dari Gemini.");

      setHasil(text);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Terjadi kesalahan.";
      setProcessError(message);
    } finally {
      setProcessing(false);
    }
  }

  function handleDownload() {
    if (!hasil.trim()) return;
    const safe = (raw: string) =>
      raw
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    const filename = `kajian-${safe(namaUstadz)}-${safe(episode)}.md`;

    const blob = new Blob([hasil], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Memuat...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
          <span className="font-display text-lg">
            Teknisi<span className="text-gold">.Akhirat</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
        <div>
          <p className="text-sm text-gold">Bismillah</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">Kajian Baru</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Lengkapi identitas dan masukkan transkrip kajianmu.
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-card/50 p-6 sm:p-8">
          <h2 className="font-display text-xl">Form Identitas</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="nama-ustadz" className="text-sm font-medium">
                Nama Ustadz
              </label>
              <Input
                id="nama-ustadz"
                value={namaUstadz}
                onChange={(e) => setNamaUstadz(e.target.value)}
                placeholder="Ustadz ..."
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="episode" className="text-sm font-medium">
                Episode
              </label>
              <Input
                id="episode"
                value={episode}
                onChange={(e) => setEpisode(e.target.value)}
                placeholder="Contoh: 01"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="tema-kitab" className="text-sm font-medium">
                Tema/Kitab
              </label>
              <Input
                id="tema-kitab"
                value={temaKitab}
                onChange={(e) => setTemaKitab(e.target.value)}
                placeholder="Contoh: Riyadhus Shalihin"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="sumber" className="text-sm font-medium">
                Sumber <span className="text-muted-foreground">(opsional)</span>
              </label>
              <Input
                id="sumber"
                value={sumber}
                onChange={(e) => setSumber(e.target.value)}
                placeholder="Contoh: YouTube / Masjid / Playlist ..."
              />
            </div>
          </div>
        </section>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="audio" disabled className="gap-2">
              <FileAudio className="h-4 w-4" />
              <span className="hidden sm:inline">Upload Audio</span>
              <span className="sm:hidden">Audio</span>
            </TabsTrigger>
            <TabsTrigger value="teks" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Tempel Transkrip</span>
              <span className="sm:hidden">Teks</span>
            </TabsTrigger>
            <TabsTrigger value="youtube" className="gap-2">
              <Youtube className="h-4 w-4" />
              <span className="hidden sm:inline">Link YouTube</span>
              <span className="sm:hidden">YouTube</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audio" className="mt-6">
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
              <FileAudio className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-display text-xl">Tersedia di Premium</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload audio akan dibuka untuk akun Premium, insyaAllah.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="teks" className="mt-6">
            <label className="text-sm font-medium">Tempel transkrip kajian</label>
            <Textarea
              value={transkrip}
              onChange={(e) => setTranskrip(e.target.value)}
              placeholder="Tempel transkrip kajian di sini..."
              className="mt-2 min-h-[240px]"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {transkrip.trim().length} karakter
            </p>
          </TabsContent>

          <TabsContent value="youtube" className="mt-6">
            <label htmlFor="yt-url" className="text-sm font-medium">
              Link video YouTube
            </label>
            <div className="relative mt-2">
              <Input
                id="yt-url"
                type="url"
                inputMode="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Paste URL YouTube di sini..."
                className={
                  youtubeTouched
                    ? youtubeValid
                      ? "border-gold pr-10"
                      : "border-destructive pr-10"
                    : "pr-10"
                }
                aria-invalid={youtubeTouched && !youtubeValid}
              />
              {youtubeTouched && youtubeValid && (
                <span
                  className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-green-600"
                  aria-label="URL valid"
                >
                  <Check className="h-5 w-5" strokeWidth={3} />
                </span>
              )}
            </div>
            {youtubeTouched && !youtubeValid && (
              <p className="mt-2 text-sm font-medium text-destructive">
                URL YouTube tidak valid
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Pastikan URL mengandung youtube.com atau youtu.be
            </p>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button type="button" onClick={handleProcess} disabled={!canProcess}>
            Bismillah, Proses Transkrip
          </Button>
        </div>

        {processing && (
          <p className="mt-3 text-sm text-muted-foreground">
            Bismillah, sedang memproses transkrip...
          </p>
        )}

        {processError && (
          <p className="mt-3 text-sm font-medium text-destructive">{processError}</p>
        )}

        {hasil.trim().length > 0 && (
          <section className="mt-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-display text-xl">Hasil</h2>
              <Button type="button" variant="outline" onClick={handleDownload}>
                Download MD
              </Button>
            </div>
            <Textarea value={hasil} readOnly className="mt-3 min-h-[280px]" />
          </section>
        )}
      </main>
    </div>
  );
}
