export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
  
  // Kalau request ke /api/* atau file dengan ekstensi → lanjutkan normal
  if (path.startsWith('/api/') || path.includes('.')) {
    return context.next();
  }
  
  // Semua route lain → serve index.html (React SPA)
  return context.env.ASSETS.fetch(new Request(new URL('/index.html', url)));
}
