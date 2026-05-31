import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, FileAudio, FileText, Upload, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { YoutubeTranscript, YoutubeTranscriptError } from "youtube-transcript";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/kajian/baru")({
  component: KajianBaruPage,
  head: () => ({ meta: [{ title: "Kajian Baru — Teknisi.Akhirat" }] }),
});

const SYSTEM_PROMPT_0 =
  'Kamu adalah asisten transkripsi kajian Islam yang teliti dan amanah. Tugasmu membersihkan transkrip SRT/TXT menjadi transkrip penuh yang rapi dalam format Markdown. Ikuti instruksi user dengan ketat. Jangan tambahkan penjelasan atau komentar di luar hasil transkrip.';

const SYSTEM_PROMPT_A =
  "Kamu adalah asisten transkripsi kajian Islam yang teliti dan amanah. Output kamu hanya berisi hasil transkripsi dan faidah sesuai format yang diminta. Jangan tambahkan penjelasan, komentar, atau sapaan.";

const SYSTEM_PROMPT_RINGKASAN = "Kamu adalah asisten ringkas. Output hanya berisi ringkasan tanpa komentar tambahan.";

const SYSTEM_PROMPT_B =
  "Kamu adalah kreator konten dakwah Islam Indonesia. Tulis caption natural, berbobot, dan tidak terdeteksi sebagai AI. Output hanya berisi caption sesuai format yang diminta, tanpa komentar tambahan.";

const SYSTEM_PROMPT_B3 =
  "Kamu adalah kreator konten dakwah Islam Indonesia yang paham algoritma TikTok 2026. Output hanya berisi caption sesuai format, tanpa komentar tambahan.";

const SYSTEM_PROMPT_B4 =
  "Kamu adalah kreator konten dakwah Islam Indonesia yang paham algoritma YouTube Shorts. Output hanya berisi caption sesuai format, tanpa komentar tambahan.";

const SYSTEM_PROMPT_C =
  "Kamu adalah kreator konten dakwah Islam Indonesia yang menulis Threads. Output hanya berisi konten Threads sesuai format, tanpa komentar tambahan.";

const SYSTEM_PROMPT_D =
  "Kamu adalah art director konten dakwah Islam Indonesia. Output hanya berisi prompt gambar sesuai format, tanpa komentar tambahan.";

const SYSTEM_PROMPT_F =
  "Kamu adalah kreator konten dakwah Islam Indonesia yang paham cara membuka video agar penonton tidak skip. Output hanya berisi 3 hook sesuai format, tanpa komentar tambahan.";

const SYSTEM_PROMPT_G =
  "Kamu adalah social media strategist konten dakwah Islam Indonesia. Output hanya berisi urutan platform sesuai format, tanpa komentar tambahan.";

const CHUNK_MAX_CHARS = 3500;

function splitByParagraphs(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let current = "";
  for (const para of paragraphs) {
    if (para.length > maxChars) {
      if (current) { chunks.push(current); current = ""; }
      const words = para.split(" ");
      let sub = "";
      for (const word of words) {
        if (sub.length + word.length + 1 <= maxChars) {
          sub += (sub ? " " : "") + word;
        } else {
          chunks.push(sub);
          sub = word;
        }
      }
      if (sub) current = sub;
    } else if (current.length + para.length + 2 <= maxChars) {
      current += (current ? "\n\n" : "") + para;
    } else {
      if (current) chunks.push(current);
      current = para;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

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

function parseSrtToText(srt: string): string {
  return srt
    .replace(/\r\n/g, "\n")
    .split(/\n\n+/)
    .map((block) => {
      const lines = block.trim().split("\n");
      const textLines = lines.filter((line) => !/^\d+$/.test(line) && !line.includes("-->"));
      return textLines.join(" ");
    })
    .filter((text) => text.length > 0)
    .join("\n\n");
}

function handleFileUpload(file: File, onLoaded: (text: string) => void) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    const isSrt = file.name.toLowerCase().endsWith(".srt");
    const text = isSrt ? parseSrtToText(content) : content;
    onLoaded(text);
  };
  reader.readAsText(file);
}

function getTodayJakartaDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

function splitByHeading(markdown: string): Array<{ title: string; body: string }> {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  const parts = normalized.split(/(?=^##\s+)/gm);

  return parts
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => {
      const [first, ...rest] = part.split("\n");
      const title = first.replace(/^##\s+/, "").trim();
      const body = rest.join("\n").trim();
      return { title, body };
    })
    .filter((s) => s.title.length > 0);
}

function splitBlocksBySeparator(text: string): string[] {
  return text
    .split("===")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
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
  const [progress, setProgress] = useState<string | null>(null);

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

  async function callGroq(system: string, prompt: string): Promise<string> {
    const res = await fetch("/api/groq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 4096,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const raw = await res.text();
      throw new Error(raw || `HTTP ${res.status}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) throw new Error("Respons kosong dari Groq.");
    return text;
  }

  async function handleProcess() {
    if (!canProcess) return;

    setProcessing(true);
    setProcessError(null);
    setHasil("");
    setProgress("Mengecek kuota harian...");

    try {
      const today = getTodayJakartaDate();
      const { data: usageExisting, error: usageError } = await supabase
        .from("usage_log")
        .select("id, jumlah")
        .eq("user_id", user!.id)
        .eq("tanggal", today)
        .maybeSingle();

      if (usageError) throw usageError;
      if ((usageExisting?.jumlah ?? 0) >= 1) {
        setProcessError("Kuota Free Tier hari ini sudah habis. Upgrade untuk lanjut.");
        setProcessing(false);
        setProgress(null);
        return;
      }

      let transcriptInput = inputTranskrip;

      if (tab === "youtube") {
        const videoIdMatch = youtubeUrl.match(
          /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
        );
        if (!videoIdMatch?.[1]) {
          setProcessError("Tidak dapat mengekstrak ID video dari URL.");
          setProcessing(false);
          return;
        }

        try {
          const transcriptData = await YoutubeTranscript.fetchTranscript(videoIdMatch[1]);
          transcriptInput = transcriptData.map((item) => item.text).join(" ");
        } catch (err) {
          if (err instanceof YoutubeTranscriptError) {
            if (err.message.includes("disabled")) {
              setProcessError("Subtitle dinonaktifkan oleh pemilik video ini.");
            } else if (err.message.includes("no longer available")) {
              setProcessError("Video tidak ditemukan atau sudah dihapus.");
            } else if (err.message.includes("No transcripts are available")) {
              setProcessError("Subtitle tidak tersedia untuk video ini. Coba upload file SRT manual.");
            } else if (err.message.includes("too many requests") || err.message.includes("captcha")) {
              setProcessError("Terlalu banyak request ke YouTube. Tunggu sebentar lalu coba lagi, atau upload file SRT.");
            } else {
              setProcessError(`Subtitle tidak tersedia (${err.message}). Coba upload file SRT manual.`);
            }
          } else {
            setProcessError("Gagal mengambil subtitle dari YouTube. Pastikan koneksi internet stabil, atau upload file SRT manual.");
          }
          setProcessing(false);
          return;
        }
      }

      setProgress("Membuat record kajian...");
      const { data: kajianRow, error: kajianError } = await supabase
        .from("kajian")
        .insert({
          user_id: user!.id,
          ustadz: namaUstadz.trim(),
          tema: temaKitab.trim(),
          episode: episode.trim(),
          sumber: sumber.trim().length > 0 ? sumber.trim() : null,
        })
        .select("id")
        .single();

      if (kajianError) throw kajianError;

      setProgress("Memecah transkrip menjadi bagian...");
      const chunks = splitByParagraphs(transcriptInput, CHUNK_MAX_CHARS);
      const total = chunks.length;

      let transkripPenuh = "";

      for (let i = 0; i < chunks.length; i++) {
        const isFirst = i === 0;
        const isLast = i === total - 1;

        if (isFirst) {
          setProgress(`Prompt 0 (bagian ${i + 1}/${total}): membersihkan transkrip...`);
          const prompt0 = [
            "Bersihkan transkrip kajian berikut sesuai aturan ini:",
            "",
            "Identitas kajian:",
            `Ustadz: ${namaUstadz.trim()}`,
            `Tema/Kitab: ${temaKitab.trim()}`,
            `Episode: ${episode.trim()}`,
            `Sumber: ${sumber.trim().length > 0 ? sumber.trim() : "-"}`,
            "",
            "YANG HARUS DIHAPUS:",
            "- Timestamp (contoh: 00:00:08,620 --> 00:00:13,160)",
            "- Nomor urut subtitle (1, 2, 3, dst)",
            "- Watermark aplikasi (contoh: Transcribed by TurboScribe.ai...)",
            "- Penggalan kalimat akibat potongan SRT — sambung jadi kalimat utuh",
            "",
            "YANG HARUS DIPERTAHANKAN:",
            "- Semua kata yang diucapkan ustadz persis apa adanya",
            "- Interaksi dengan hadirin, percakapan informal pembuka",
            "- Logat, gaya bicara, kata seru, jeda, pengulangan kata ustadz",
            "",
            "KOREKSI YANG DIIZINKAN:",
            "- Typo yang jelas",
            "- Teks Arab dari alfabet → tulisan Arab asli",
            '- Nama ulama/kitab salah → koreksi dengan format: Nama Benar *(transkripsi: "nama salah")*',
            "",
            "UNTUK AYAT AL-QUR'AN:",
            "- Tulis dalam tulisan Arab",
            "- Sertakan nama surat dan nomor ayat: (QS. Al-Fatihah: 1)",
            "",
            "UNTUK HADITS:",
            "- Tandai setiap hadits",
            "- Sertakan nomor dan derajat hadits jika diketahui",
            "- Jika tidak ketahui: ⚠️ perlu verifikasi",
            "",
            "FORMAT OUTPUT:",
            `- Judul: # ${temaKitab.trim()}`,
            `- Header: **Ustadz:** ${namaUstadz.trim()} | **Tema:** ${temaKitab.trim()} | **Episode:** ${episode.trim()}`,
            "- Setiap sub-bab diberi heading ## (Heading 2)",
            "- Output dalam format Markdown",
            "",
            "LARANGAN KERAS:",
            "- JANGAN parafrase",
            "- JANGAN tambah kata yang tidak diucapkan ustadz",
            "- JANGAN kurangi kata apapun",
            "- JANGAN tafsirkan atau simpulkan sendiri",
            "- JANGAN tambah komentar atau penjelasan di luar transkrip",
            "",
            "Transkrip mentah bagian 1/" + total + ":",
            chunks[i],
          ].join("\n");
          transkripPenuh = await callGroq(SYSTEM_PROMPT_0, prompt0);
        } else {
          setProgress(`Prompt 0 (bagian ${i + 1}/${total}): melanjutkan pembersihan...`);
          const promptCont = [
            "Lanjutkan pembersihan transkrip kajian berikut.",
            "",
            "Aturan sama seperti sebelumnya:",
            "- Hapus timestamp, nomor subtitle, watermark",
            "- Koreksi typo jelas, teks Arab dari alfabet",
            "- Pertahankan semua kata ustadz persis apa adanya",
            "- JANGAN parafrase, JANGAN tambah, JANGAN kurangi",
            "- JANGAN tambah heading ## baru — lanjutkan konten yang sudah ada",
            "",
            "Output: lanjutkan langsung dengan teks transkrip yang sudah dibersihkan (mulai dari paragraf pertama, TANPA heading judul/header).",
            "",
            "Potongan transkrip bagian " + (i + 1) + "/" + total + ":",
            chunks[i],
          ].join("\n");
          const lanjutan = await callGroq(SYSTEM_PROMPT_0, promptCont);
          const cleanedLanjutan = lanjutan
            .replace(/^# .*$/m, "")
            .replace(/^\*\*Ustadz:.*$/m, "")
            .replace(/^\*\*Tema:.*$/m, "")
            .replace(/^---$/m, "")
            .replace(/^\*\*Episode:.*$/m, "")
            .replace(/^\*\*Sumber:.*$/m, "")
            .trim();
          if (cleanedLanjutan) {
            transkripPenuh += "\n\n" + cleanedLanjutan;
          }
        }
      }
      setHasil(transkripPenuh);

      const subBabSections = splitByHeading(transkripPenuh);
      if (subBabSections.length === 0) throw new Error("Tidak menemukan sub-bab (Heading ##) dari hasil Prompt 0.");

      const subBabRows: Array<{
        kajian_id: string;
        nomor: number;
        judul: string;
        blok_a: string | null;
        ringkasan: string | null;
        blok_b1: string | null;
        blok_b2: string | null;
        blok_b3: string | null;
        blok_b4: string | null;
        blok_c: unknown | null;
        blok_d: string | null;
        blok_f: unknown | null;
        blok_g: string | null;
      }> = [];

      subBabRows.push({
        kajian_id: kajianRow.id,
        nomor: 0,
        judul: "Transkrip Penuh",
        blok_a: transkripPenuh,
        ringkasan: null,
        blok_b1: null,
        blok_b2: null,
        blok_b3: null,
        blok_b4: null,
        blok_c: null,
        blok_d: null,
        blok_f: null,
        blok_g: null,
      });

      for (let i = 0; i < subBabSections.length; i++) {
        const nomor = i + 1;
        const judulSubBab = subBabSections[i].title;
        const transkripSubBab = subBabSections[i].body;

        setProgress(`Sub-bab ${nomor}/${subBabSections.length}: Prompt A...`);
        const promptA = [
          "Identitas kajian:",
          `Ustadz: ${namaUstadz.trim()} | Tema: ${temaKitab.trim()} | Episode: ${episode.trim()}`,
          `Sub-bab: ${judulSubBab}`,
          "",
          "BAGIAN 1 — TRANSKRIP BERSIH:",
          "Bersihkan potongan transkrip berikut:",
          "- Pertahankan SEMUA kata ustadz persis apa adanya",
          "- Koreksi typo yang jelas",
          "- Teks Arab dari alfabet → tulisan Arab asli",
          "- Ayat Al-Qur'an: tulis Arab + (QS. nama surat: nomor ayat)",
          "- Hadits: tandai + sertakan derajat atau ⚠️ perlu verifikasi",
          "- JANGAN parafrase, JANGAN tambah, JANGAN kurangi",
          "",
          "BAGIAN 2 — FAIDAH KAJIAN:",
          "Setelah transkrip bersih, tulis semua faidah yang bisa diambil.",
          "- Tulis SEMUA faidah — tanpa batasan jumlah",
          "- Setiap faidah diberi nomor",
          "- Bahasa mengikuti ustadz",
          "- Faidah HANYA dari yang diucapkan ustadz",
          "",
          "FORMAT OUTPUT:",
          "Tampilkan Bagian 1 dan Bagian 2 dalam satu blok teks bersambung.",
          "Pisahkan dengan garis: ---",
          "",
          "Potongan transkrip sub-bab ini:",
          transkripSubBab,
        ].join("\n");
        const blokA = await callGroq(SYSTEM_PROMPT_A, promptA);

        setProgress(`Sub-bab ${nomor}/${subBabSections.length}: Ringkasan...`);
        const promptRingkasan = [
          "Ringkas isi transkrip berikut menjadi maksimal 200 kata. Pertahankan poin-poin penting. Gunakan bahasa Indonesia yang jelas.",
          "",
          blokA,
        ].join("\n");
        const ringkasan = await callGroq(SYSTEM_PROMPT_RINGKASAN, promptRingkasan);

        setProgress(`Sub-bab ${nomor}/${subBabSections.length}: B1 Instagram...`);
        const blokB1 = await callGroq(
          SYSTEM_PROMPT_B,
          [
            "Identitas kajian:",
            `Ustadz: ${namaUstadz.trim()} | Tema: ${temaKitab.trim()} | Episode: ${episode.trim()}`,
            `Sub-bab: ${judulSubBab}`,
            "",
            "Ringkasan isi sub-bab:",
            ringkasan,
            "",
            "Tulis caption Instagram dengan ketentuan:",
            "- Pembuka santai, relatable, gaya Gen Z — bervariasi setiap sub-bab",
            "- Isi tetap berbobot dan ilmiah",
            "- Mengalir natural — tidak kaku, tidak terdeteksi sebagai AI",
            "- Punchline singkat di bagian penting",
            "- JANGAN cantumkan faidah di caption",
            "- JANGAN sebut nama pemateri dan sumber video",
            "- JANGAN melebihi 2.200 karakter",
            "",
            "SUSUNAN OUTPUT (ikuti persis):",
            "1. Teks caption utama",
            "2. Pertanyaan muhasabah pribadi yang mengena",
            "3. —",
            "4. [minimal 15 hashtag relevan]",
            "5. 📲 Follow @teknisi.akhirat untuk faidah kajian setiap hari",
            "6. —",
            `   Sumber: Kajian ${temaKitab.trim()}`,
            `   — Ustadz ${namaUstadz.trim()}, episode ${episode.trim()}`,
          ].join("\n"),
        );

        setProgress(`Sub-bab ${nomor}/${subBabSections.length}: B2 Facebook...`);
        const blokB2 = await callGroq(
          SYSTEM_PROMPT_B,
          [
            "Identitas kajian:",
            `Ustadz: ${namaUstadz.trim()} | Tema: ${temaKitab.trim()} | Episode: ${episode.trim()}`,
            `Sub-bab: ${judulSubBab}`,
            "",
            "Ringkasan isi sub-bab:",
            ringkasan,
            "",
            "Tulis caption Facebook dengan ketentuan:",
            "- Lebih naratif dan detail dibanding Instagram",
            "- Tone lebih tenang, audiens lebih dewasa",
            "- JANGAN cantumkan faidah di caption",
            "- JANGAN sebut nama pemateri dan sumber video",
            "- JANGAN melebihi 3.000 karakter",
            "",
            "SUSUNAN OUTPUT (ikuti persis):",
            "1. Teks caption utama",
            "2. Pertanyaan muhasabah pribadi yang mengena",
            "3. —",
            "4. [5–10 hashtag relevan]",
            "5. 📲 Follow @teknisi.akhirat untuk faidah kajian setiap hari",
            "6. —",
            `   Sumber: Kajian ${temaKitab.trim()}`,
            `   — Ustadz ${namaUstadz.trim()}, episode ${episode.trim()}`,
          ].join("\n"),
        );

        setProgress(`Sub-bab ${nomor}/${subBabSections.length}: B3 TikTok...`);
        const blokB3 = await callGroq(
          SYSTEM_PROMPT_B3,
          [
            "Identitas kajian:",
            `Ustadz: ${namaUstadz.trim()} | Tema: ${temaKitab.trim()} | Episode: ${episode.trim()}`,
            `Sub-bab: ${judulSubBab}`,
            "",
            "Ringkasan isi sub-bab:",
            ringkasan,
            "",
            "Tulis caption TikTok dengan ketentuan:",
            "- Keyword utama di 30 karakter pertama",
            "- Hook kuat di awal — named tension, bukan semangat kosong",
            "- Pola: named tension + neutral resolution",
            "- JANGAN pakai CTA generik",
            "- JANGAN sebut nama pemateri dan sumber video",
            "- Panjang total 150–300 karakter (tidak termasuk hashtag)",
            "",
            "STRUKTUR OUTPUT (ikuti persis):",
            "[HOOK — 1 kalimat, maks 50 karakter]",
            "[Isi — 2–3 baris padat, gunakan emoji sebagai visual breaker]",
            "[CTA spesifik — ajakan dengan tindakan jelas]",
            "[3–5 hashtag dakwah populer]",
          ].join("\n"),
        );

        setProgress(`Sub-bab ${nomor}/${subBabSections.length}: B4 Shorts...`);
        const blokB4 = await callGroq(
          SYSTEM_PROMPT_B4,
          [
            "Identitas kajian:",
            `Ustadz: ${namaUstadz.trim()} | Tema: ${temaKitab.trim()} | Episode: ${episode.trim()}`,
            `Sub-bab: ${judulSubBab}`,
            "",
            "Ringkasan isi sub-bab:",
            ringkasan,
            "",
            "Tulis caption YouTube Shorts dengan ketentuan:",
            "- Pendek, hook kuat di awal",
            "- JANGAN pakai CTA generik",
            "- JANGAN sebut nama pemateri dan sumber video",
            "- Panjang total 150–300 karakter (tidak termasuk hashtag)",
            "",
            "STRUKTUR OUTPUT (ikuti persis):",
            "[HOOK — 1 kalimat, maks 50 karakter]",
            "[Isi — 2–3 baris padat, gunakan emoji sebagai visual breaker]",
            "[CTA spesifik]",
            "[3–5 hashtag dakwah populer]",
          ].join("\n"),
        );

        setProgress(`Sub-bab ${nomor}/${subBabSections.length}: C Threads...`);
        const blokCText = await callGroq(
          SYSTEM_PROMPT_C,
          [
            "Identitas kajian:",
            `Ustadz: ${namaUstadz.trim()} | Tema: ${temaKitab.trim()} | Episode: ${episode.trim()}`,
            `Sub-bab: ${judulSubBab}`,
            "",
            "Ringkasan isi sub-bab:",
            ringkasan,
            "",
            "Tulis konten Threads dengan ketentuan:",
            "- Maksimal 500 karakter per bagian",
            "- Pecah menjadi beberapa bagian bernomor: 1/4, 2/4, dst",
            "- Gaya santai namun berbobot",
            "- JANGAN sebut nama pemateri dan sumber video",
            '- Bagian terakhir: tutup dengan refleksi/ajakan +',
            '  "Follow @teknisi.akhirat untuk faidah kajian setiap hari 📲"',
            "",
            "FORMAT OUTPUT:",
            "Pisahkan setiap bagian dengan tanda: ===",
            "1/4",
            "[isi bagian 1]",
            "===",
            "2/4",
            "[isi bagian 2]",
            "===",
            "dst",
          ].join("\n"),
        );
        const blokC = splitBlocksBySeparator(blokCText);

        setProgress(`Sub-bab ${nomor}/${subBabSections.length}: D Prompt gambar...`);
        const blokD = await callGroq(
          SYSTEM_PROMPT_D,
          [
            "Identitas kajian:",
            `Ustadz: ${namaUstadz.trim()} | Tema: ${temaKitab.trim()} | Episode: ${episode.trim()}`,
            `Sub-bab: ${judulSubBab}`,
            "",
            "Ringkasan isi sub-bab:",
            ringkasan,
            "",
            "Buat 1 prompt gambar Instagram dengan ketentuan:",
            "- Format PORTRAIT 9:16",
            "- Gaya Islamic aesthetic GELAP (dark background)",
            "- JANGAN sebut nama pemateri dan sumber video",
            "",
            "ELEMEN WAJIB:",
            "1. Teks HOOK di tengah (besar, dominan) — kalimat pemantik rasa ingin tahu",
            '2. Teks ajakan di bawah: "📖 Baca caption untuk penjelasan lengkap"',
            "3. Watermark: @teknisi.akhirat (font kecil elegan, pojok kanan bawah)",
            "",
            "FORMAT OUTPUT — satu prompt berisi:",
            "- Deskripsi visual latar belakang",
            "- Elemen dekoratif Islamic (ornamen, kaligrafi, arabesque)",
            "- Teks hook yang ditampilkan di tengah",
            "- Teks ajakan dan username di bagian bawah",
            "- Palet warna: hitam (#0D0D0D), emas (#C9A84C), putih ivory (#F5F0E8)",
          ].join("\n"),
        );

        setProgress(`Sub-bab ${nomor}/${subBabSections.length}: F Hook video...`);
        const blokFText = await callGroq(
          SYSTEM_PROMPT_F,
          [
            "Identitas kajian:",
            `Ustadz: ${namaUstadz.trim()} | Tema: ${temaKitab.trim()} | Episode: ${episode.trim()}`,
            `Sub-bab: ${judulSubBab}`,
            "",
            "Ringkasan isi sub-bab:",
            ringkasan,
            "",
            "Buat 3 pilihan hook pembuka video/Reels dengan ketentuan:",
            "- 1–2 kalimat per hook",
            "- Gaya spoken word — enak diucapkan di depan kamera",
            "- Memancing penonton untuk tidak skip",
            "- JANGAN sebut nama pemateri dan sumber video",
            "",
            "FORMAT OUTPUT:",
            "Hook 1:",
            "[isi hook 1]",
            "===",
            "Hook 2:",
            "[isi hook 2]",
            "===",
            "Hook 3:",
            "[isi hook 3]",
          ].join("\n"),
        );
        const blokF = splitBlocksBySeparator(blokFText);

        setProgress(`Sub-bab ${nomor}/${subBabSections.length}: G Jadwal posting...`);
        const blokG = await callGroq(
          SYSTEM_PROMPT_G,
          [
            `Sub-bab: ${judulSubBab}`,
            `Tema: ${temaKitab.trim()}`,
            "",
            "Rekomendasikan urutan platform untuk posting konten sub-bab ini.",
            "Cukup urutan platform + alasan singkat kenapa diposting duluan.",
            "Maksimal 6 platform.",
            "",
            "FORMAT OUTPUT (ikuti persis):",
            "1. [Platform] — [alasan singkat]",
            "2. [Platform] — [alasan singkat]",
            "dst.",
          ].join("\n"),
        );

        subBabRows.push({
          kajian_id: kajianRow.id,
          nomor,
          judul: judulSubBab,
          blok_a: blokA,
          ringkasan,
          blok_b1: blokB1,
          blok_b2: blokB2,
          blok_b3: blokB3,
          blok_b4: blokB4,
          blok_c: blokC,
          blok_d: blokD,
          blok_f: blokF,
          blok_g: blokG,
        });
      }

      setProgress("Menyimpan sub-bab ke database...");
      const { error: subBabError } = await supabase.from("sub_bab").insert(subBabRows);
      if (subBabError) throw subBabError;

      setProgress("Mencatat usage log...");
      if (usageExisting?.id) {
        const { error: usageUpdateError } = await supabase
          .from("usage_log")
          .update({ jumlah: (usageExisting.jumlah ?? 0) + 1 })
          .eq("id", usageExisting.id);
        if (usageUpdateError) throw usageUpdateError;
      } else {
        const { error: usageInsertError } = await supabase.from("usage_log").insert({
          user_id: user!.id,
          tanggal: today,
          jumlah: 1,
        });
        if (usageInsertError) throw usageInsertError;
      }

      setProgress("Selesai. Data tersimpan di Supabase.");
    } catch (e) {
      setProgress(null);
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
            <div className="mt-2">
              <input
                type="file"
                id="file-upload"
                accept=".srt,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, (text) => setTranskrip((prev) => (prev ? `${prev}\n\n${text}` : text)));
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
              <span className="ml-3 text-xs text-muted-foreground">Format: .srt, .txt</span>
            </div>
            <Textarea
              value={transkrip}
              onChange={(e) => setTranskrip(e.target.value)}
              placeholder="Tempel transkrip kajian di sini..."
              className="mt-3 min-h-[240px]"
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
            {progress ?? "Bismillah, sedang memproses transkrip..."}
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
