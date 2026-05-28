import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
} from "@tanstack/react-router";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-gold">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Halaman tidak ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Halaman gagal dimuat</h1>
        <p className="mt-2 text-sm text-muted-foreground">Coba muat ulang atau kembali ke beranda.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Coba lagi
          </button>
          <a href="/" className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
            Beranda
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Teknisi.Akhirat — Caption Dakwah Otomatis" },
      { name: "description", content: "Platform kreator konten dakwah Islam. Ubah transkrip kajian menjadi caption siap posting untuk media sosial." },
      { property: "og:title", content: "Teknisi.Akhirat — Caption Dakwah Otomatis" },
      { name: "twitter:title", content: "Teknisi.Akhirat — Caption Dakwah Otomatis" },
      { property: "og:description", content: "Platform kreator konten dakwah Islam. Ubah transkrip kajian menjadi caption siap posting untuk media sosial." },
      { name: "twitter:description", content: "Platform kreator konten dakwah Islam. Ubah transkrip kajian menjadi caption siap posting untuk media sosial." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/043a518f-2c8d-4c4c-9ac9-5e1e49d29476/id-preview-6da2ec87--2b1bcaec-5eb1-485b-9a8c-a44a6292a3df.lovable.app-1779763551177.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/043a518f-2c8d-4c4c-9ac9-5e1e49d29476/id-preview-6da2ec87--2b1bcaec-5eb1-485b-9a8c-a44a6292a3df.lovable.app-1779763551177.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <>
      <HeadContent />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Outlet />
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </QueryClientProvider>
    </>
  );
}
