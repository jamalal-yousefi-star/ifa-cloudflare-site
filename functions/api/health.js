export async function onRequestGet(context) {
  const { env } = context;
  return new Response(JSON.stringify({
    ok: true,
    service: "IFA Cloudflare backend",
    openrouter: Boolean(env.OPENROUTER_API_KEY),
    resend: Boolean(env.RESEND_API_KEY),
    adminEmail: Boolean(env.ADMIN_EMAIL),
    kv: Boolean(env.IFA_KV)
  }, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}