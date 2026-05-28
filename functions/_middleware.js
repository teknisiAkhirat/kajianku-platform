export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Biarkan API dan file statis jalan normal
  if (path.startsWith('/api/') || path.match(/\.[a-zA-Z0-9]+$/)) {
    return context.next();
  }

  // Semua route SPA → ambil index.html dari assets
  const indexUrl = new URL('/index.html', url);
  const assetRequest = new Request(indexUrl.toString(), context.request);
  return context.env.ASSETS.fetch(assetRequest);
}
