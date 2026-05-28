type Env = {
  GROQ_API_KEY: string;
};

export const onRequest = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "content-type, authorization",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response("Missing GROQ_API_KEY", { status: 500 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await groqRes.text();

  return new Response(body, {
    status: groqRes.status,
    headers: {
      "content-type": groqRes.headers.get("content-type") ?? "application/json",
      "access-control-allow-origin": "*",
    },
  });
};
