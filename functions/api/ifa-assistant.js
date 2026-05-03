const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));

    const userMessage =
      body.message ||
      body.question ||
      body.text ||
      (Array.isArray(body.messages) ? body.messages.at(-1)?.content : "");

    if (!userMessage || String(userMessage).trim().length < 1) {
      return jsonResponse({
        ok: false,
        error: "message_required",
        reply: "اكتب رسالتك أولًا وسأساعدك."
      }, 400);
    }

    if (!env.OPENROUTER_API_KEY) {
      return jsonResponse({
        ok: false,
        error: "missing_OPENROUTER_API_KEY",
        reply: "المساعد غير مفعل بعد. أضف OPENROUTER_API_KEY في Cloudflare Variables."
      }, 500);
    }

    const siteName = env.SITE_NAME || "IFA FOR PUBLIC SERVICES";
    const model = env.AI_MODEL || "openrouter/free";

    const systemPrompt = env.AI_SYSTEM_PROMPT || `
أنت مساعد خدمة عملاء رسمي لموقع ${siteName}.
تحدث بالعربية الواضحة والودية.
خدمات الشركة: القبولات الجامعية، التأشيرات، الإقامة، التأمين، الخدمات التعليمية والعامة.
اجعل الإجابات قصيرة ومباشرة، واطلب من العميل التواصل عبر واتساب عند الحاجة.
لا تخترع أسعارًا أو مواعيد نهائية غير مؤكدة.
`;

    const messages = Array.isArray(body.messages)
      ? [
          { role: "system", content: systemPrompt },
          ...body.messages.slice(-10).map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: String(m.content || "")
          }))
        ]
      : [
          { role: "system", content: systemPrompt },
          { role: "user", content: String(userMessage) }
        ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": env.SITE_URL || "https://ifa-cloudflare-site.pages.dev",
        "X-Title": siteName
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
        max_tokens: 700
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return jsonResponse({
        ok: false,
        error: "openrouter_error",
        status: response.status,
        details: data,
        reply: "حصل خطأ في الاتصال بالمساعد الذكي. تأكد من مفتاح OpenRouter والمتغيرات."
      }, 502);
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      "لم أستطع تجهيز رد الآن. حاول مرة أخرى.";

    return jsonResponse({
      ok: true,
      reply,
      model: data?.model || model
    });

  } catch (error) {
    return jsonResponse({
      ok: false,
      error: "server_error",
      message: error.message,
      reply: "حدث خطأ مؤقت في المساعد. حاول مرة أخرى."
    }, 500);
  }
}
