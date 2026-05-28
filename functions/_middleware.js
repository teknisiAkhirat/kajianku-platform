export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Biarkan API, file statis, dan index.html jalan normal
  if (
    path.startsWith('/api/') ||
    path === '/index.html' ||
    path.match(/\.[a-zA-Z0-9]+$/)
  ) {
    return context.next();
  }

  // Rewrite ke index.html tanpa redirect
  const indexRequest = new Request(
    new URL('/index.html', url).toString()
  );
  return context.env.ASSETS.fetch(indexRequest);
}
