import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AuthShell, HCaptchaPlaceholder } from "@/components/AuthShell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({ meta: [{ title: "Daftar — Teknisi.Akhirat" }] }),
});

function RegisterPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Pendaftaran berhasil! Cek email Anda untuk verifikasi.");
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) toast.error("Gagal masuk dengan Google");
  };

  return (
    <AuthShell
      title="Daftar Akun"
      subtitle="Mulai sebarkan kebaikan lewat konten dakwah yang lebih luas."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Masuk di sini
          </Link>
        </>
      }
    >
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full border-foreground/20 bg-background hover:bg-secondary"
        onClick={handleGoogle}
      >
        <GoogleIcon className="mr-2 h-4 w-4" />
        Daftar dengan Google
      </Button>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <Separator className="flex-1" />
        atau dengan email
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleEmailSignup} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Kata Sandi</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            className="h-11"
          />
        </div>
        <HCaptchaPlaceholder />
        <Button
          type="submit"
          disabled={busy}
          className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {busy ? "Memproses..." : "Daftar"}
        </Button>
      </form>
    </AuthShell>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.9 3.2 14.7 2.2 12 2.2 6.5 2.2 2 6.7 2 12.2s4.5 10 10 10c5.8 0 9.6-4 9.6-9.7 0-.7-.1-1.2-.2-1.7H12z" />
    </svg>
  );
}
