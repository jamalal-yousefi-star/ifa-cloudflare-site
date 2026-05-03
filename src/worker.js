function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders()
    }
  });
}

async function readKnowledgeBase() {
  return `
IFA FOR PUBLIC SERVICES هي شركة خدمات عامة وتعليمية في تركيا.

المالكون:
- بدر اليوسفي
- هشام الرامسي

الشركة تساعد الطلاب والمقيمين والمسافرين في:
القبولات الجامعية، الجامعات الحكومية والخاصة، المعاهد، الإقامة، التأمين، التأشيرات، الترجمة، التصديق، تجهيز الملفات، متابعة الطلبات، والخدمات العامة.

قاعدة اللغة:
رد بنفس لغة العميل. إذا كتب عربي رد عربي، إذا كتب تركي رد تركي، إذا كتب إنجليزي رد إنجليزي. إذا خلط لغتين، استخدم اللغة الأكثر ظهورًا.

التحية:
السلام عليكم: وعليكم السلام ورحمة الله، أهلًا وسهلًا بك في IFA. كيف يمكنني مساعدتك اليوم؟
مرحبًا: أهلًا وسهلًا بك، كيف يمكنني مساعدتك؟
كيف حالك؟ الحمد لله بخير، شكرًا لسؤالك. كيف يمكنني خدمتك اليوم؟
صباح الخير: صباح النور، أهلًا بك في IFA.
مساء الخير: مساء النور، أهلًا وسهلًا بك.
شكرًا: العفو، نحن في خدمتك دائمًا.

الدراسة في تركيا:
تركيا فيها جامعات حكومية وخاصة. الدراسة قد تكون بالتركية أو الإنجليزية. القبول يختلف حسب الجامعة، التخصص، المعدل، المقاعد، الجنسية، ولغة الدراسة.

الجامعات الحكومية:
رسومها غالبًا أقل، لكن المنافسة أعلى والقبول يعتمد على المفاضلة والمعدل والمقاعد.

الجامعات الخاصة:
أسرع وأسهل غالبًا في القبول، لكن الرسوم أعلى وتختلف حسب الجامعة والتخصص.

عند طلب قبول جامعي:
اسأل عن المرحلة، التخصص، المعدل، اللغة المطلوبة، الجنسية، وهل يريد جامعة حكومية أو خاصة.

المعاهد:
IFA تساعد في معاهد اللغة التركية والإنجليزية والدورات التحضيرية حسب المدينة والمتاح.

الإقامة:
IFA تساعد في ملف الإقامة، التأمين، دفع الرسوم، ومراجعة النواقص. القرار النهائي للجهات الرسمية. لا تعطي ضمان.

التأمين:
اسأل عن العمر، نوع التأمين، المدة، وهل هو لغرض إقامة أو سفر أو دراسة.

التأشيرات:
اسأل عن الجنسية، الدولة المطلوبة، نوع التأشيرة، وتاريخ السفر.

الترجمة والتصديق:
IFA تساعد في ترجمة وتصديق الشهادات، كشف الدرجات، جواز السفر، والوثائق المطلوبة للجامعة أو الإقامة.

الحياة في تركيا:
إسطنبول كبيرة وحيوية لكنها أعلى تكلفة. أنقرة مناسبة للدراسة. سكاريا قريبة من إسطنبول وهادئة ومناسبة للطلاب. بورصة، إزمير، قونيا، قيصري، إسكي شهير، طرابزون وكوجالي خيارات جيدة حسب الجامعة والتكلفة.

السكن:
السكن قد يكون جامعي، خاص، شقة مشتركة أو مستقلة، والتكلفة تختلف حسب المدينة والقرب من الجامعة والخدمات.

العمل:
فرص العمل تختلف حسب المدينة واللغة والمهارة والوضع القانوني. لا تضمن عملًا.

ممنوع:
لا تخترع أسعارًا أو مواعيد أو ضمانات. لا تقل مضمون 100%. لا تطلب كلمات مرور أو بيانات بنكية. إذا احتاج الأمر تحقق، قل إن فريق IFA يمكنه التحقق.
`;
}

async function handleHealth(request, env) {
  const kb = await readKnowledgeBase();
  return jsonResponse({
    ok: true,
    service: "IFA Cloudflare Worker",
    openrouter: Boolean(env.OPENROUTER_API_KEY),
    model: env.AI_MODEL || "openrouter/auto",
    knowledgeBase: kb.length > 100,
    knowledgeBaseCharacters: kb.length,
    internalKB: true,
    assetsBinding: Boolean(env.ASSETS && env.ASSETS.fetch)
  });
}

async function handleAssistant(request, env) {
  const body = await request.json().catch(() => ({}));
  const userMessage =
    body.message ||
    body.question ||
    body.text ||
    (Array.isArray(body.messages) ? body.messages.at(-1)?.content : "");

  if (!userMessage || String(userMessage).trim().length < 1) {
    return jsonResponse({ ok: false, error: "message_required", reply: "اكتب رسالتك أولًا وسأساعدك." }, 400);
  }

  if (!env.OPENROUTER_API_KEY) {
    return jsonResponse({
      ok: false,
      error: "missing_OPENROUTER_API_KEY",
      reply: "المساعد غير مفعل بعد. أضف OPENROUTER_API_KEY في Cloudflare Variables ثم اعمل Deploy."
    }, 500);
  }

  const siteName = env.SITE_NAME || "IFA FOR PUBLIC SERVICES";
  const model = env.AI_MODEL || "openrouter/auto";
  const knowledgeBase = await readKnowledgeBase();
  const shortPrompt = env.AI_SYSTEM_PROMPT || "أنت مساعد IFA الذكي. رد بنفس لغة العميل. كن ودودًا ومختصرًا ومهنيًا. لا تخترع أسعارًا أو مواعيد أو ضمانات.";

  const systemPrompt = `
${shortPrompt}

استخدم قاعدة معرفة IFA التالية كأساس لإجاباتك. التزم بالمعلومات الموجودة فيها. إذا لم توجد المعلومة، لا تخترعها وقل إن فريق IFA يمكنه التحقق.

--- IFA KNOWLEDGE BASE START ---
${knowledgeBase}
--- IFA KNOWLEDGE BASE END ---
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
      "HTTP-Referer": env.SITE_URL || "https://ifa-cloudflare-site.jamal-al-yousefi.workers.dev",
      "X-Title": siteName
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.25,
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
      reply: "حصل خطأ في الاتصال بالمساعد الذكي. تأكد من مفتاح OpenRouter، ومن AI_MODEL إذا أضفته."
    }, 502);
  }

  const reply =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.text ||
    "لم أستطع تجهيز رد الآن. حاول مرة أخرى.";

  return jsonResponse({ ok: true, reply, model: data?.model || model, knowledgeBase: true });
}

async function handleVisitors(env) {
  return jsonResponse({ ok: true, count: 0, note: "عداد الزوار التجريبي يعمل. لعداد حقيقي اربط KV باسم IFA_KV." });
}

async function handleContact(request, env) {
  const body = await request.json().catch(() => ({}));
  return jsonResponse({
    ok: true,
    message: "تم استلام الطلب. لإرسال الطلب إلى الإيميل يجب إضافة RESEND_API_KEY و ADMIN_EMAIL.",
    received: body
  });
}

async function serveStatic(request, env) {
  if (env.ASSETS && env.ASSETS.fetch) {
    return env.ASSETS.fetch(request);
  }
  return new Response("ASSETS binding is missing. Check wrangler.toml [assets] binding = \"ASSETS\".", {
    status: 500,
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    try {
      if (path === "/api/health" && request.method === "GET") return handleHealth(request, env);
      if ((path === "/api/ifa-assistant" || path === "/api/chat") && request.method === "POST") return handleAssistant(request, env);
      if (path === "/api/visitors") return handleVisitors(env);
      if ((path === "/api/contact" || path === "/api/send-request") && request.method === "POST") return handleContact(request, env);

      // Important: never return a fallback HTML from Worker.
      // All website pages, design, images, and the original assistant must come from index.html/assets.
      return serveStatic(request, env);
    } catch (error) {
      return jsonResponse({ ok: false, error: "server_error", message: error.message }, 500);
    }
  }
};
