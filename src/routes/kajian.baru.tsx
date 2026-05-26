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
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transkrip, setTranskrip] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const youtubeTouched = youtubeUrl.trim().length > 0;
  const youtubeValid = useMemo(() => isValidYouTubeUrl(youtubeUrl), [youtubeUrl]);

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
            Pilih cara untuk memasukkan transkrip kajianmu.
          </p>
        </div>

        <Tabs defaultValue="audio" className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="audio" className="gap-2">
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
              <p className="mt-3 font-display text-xl">Unggah file audio</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Format MP3, WAV, atau M4A.
              </p>
              <Input
                type="file"
                accept="audio/*"
                className="mx-auto mt-4 max-w-sm"
                onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
              />
              {audioFile && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Dipilih: {audioFile.name}
                </p>
              )}
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
            {youtubeTouched && youtubeValid && (
              <p className="mt-2 text-xs text-muted-foreground">
                Kami akan mengambil closed caption (CC) dari video ini.
              </p>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-end">
          <Button
            type="button"
            onClick={() =>
              alert("Pemrosesan akan tersedia di fase berikutnya, insyaAllah.")
            }
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Lanjutkan
          </Button>
        </div>
      </main>
    </div>
  );
}
