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
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() }
  });
}

const KNOWLEDGE_BASE = `
IFA FOR PUBLIC SERVICES هي شركة خدمات عامة وتعليمية في تركيا.

المالكون:
- بدر اليوسفي
- هشام الرامسي

الخدمات:
- القبولات الجامعية في تركيا.
- الجامعات الحكومية والخاصة.
- المعاهد ودورات اللغة.
- الإقامة والتأمين.
- التأشيرات والسفر.
- الترجمة والتصديق وتجهيز الملفات.
- متابعة الطلبات والخدمات العامة للطلاب والمقيمين والمسافرين.

قاعدة اللغة:
رد بنفس لغة العميل. إذا كتب عربي رد عربي. إذا كتب تركي رد تركي. إذا كتب إنجليزي رد إنجليزي.

الدراسة في تركيا:
تركيا فيها جامعات حكومية وخاصة. الدراسة قد تكون بالتركية أو الإنجليزية. القبول يختلف حسب الجامعة والتخصص والمعدل والمقاعد والجنسية ولغة الدراسة.
الجامعات الحكومية رسومها غالبًا أقل والمنافسة فيها أعلى.
الجامعات الخاصة أسرع وأسهل غالبًا في القبول، لكن رسومها أعلى وتختلف حسب الجامعة والتخصص.
عند طلب قبول جامعي اسأل عن المرحلة، التخصص، المعدل، اللغة، الجنسية، وهل يريد جامعة حكومية أو خاصة.

الإقامة:
IFA تساعد في ملف الإقامة، التأمين، دفع الرسوم، متابعة النواقص وتجهيز الملف. القرار النهائي للجهات الرسمية ولا يوجد ضمان 100%.

التأشيرات:
اسأل عن الجنسية، الدولة المطلوبة، نوع التأشيرة، وتاريخ السفر.

الحياة في تركيا:
إسطنبول كبيرة وحيوية وأعلى تكلفة. أنقرة مناسبة للدراسة. سكاريا قريبة من إسطنبول وهادئة ومناسبة للطلاب. بورصة، إزمير، قونيا، قيصري، إسكي شهير، طرابزون وكوجالي خيارات جيدة حسب الجامعة والتكلفة.

الممنوع:
لا تخترع أسعارًا أو مواعيد أو ضمانات. إذا احتاج الأمر تحقق، قل إن فريق IFA يمكنه التحقق.
`;

function localFallbackReply(message) {
  const msg = String(message || "").trim().toLowerCase();

  if (!msg) return "اكتب رسالتك أولًا وسأساعدك.";

  if (msg.includes("السلام")) {
    return "وعليكم السلام ورحمة الله، أهلًا وسهلًا بك في IFA FOR PUBLIC SERVICES. كيف يمكنني مساعدتك اليوم؟";
  }

  if (msg.includes("مرحبا") || msg.includes("مرحباً") || msg.includes("اهلا") || msg.includes("أهلا")) {
    return "أهلًا وسهلًا بك في IFA FOR PUBLIC SERVICES 👋\nكيف يمكنني مساعدتك اليوم؟";
  }

  if (msg.includes("كيف حال") || msg.includes("كيفك")) {
    return "الحمد لله بخير، شكرًا لسؤالك. كيف يمكنني خدمتك اليوم؟";
  }

  if (msg.includes("صاحب") || msg.includes("مالك") || msg.includes("المالك") || msg.includes("owners") || msg.includes("owner")) {
    return "مالكو شركة IFA FOR PUBLIC SERVICES هم بدر اليوسفي وهشام الرامسي.";
  }

  if (msg.includes("شركة") || msg.includes("من انتم") || msg.includes("من أنتم") || msg.includes("ifa")) {
    return "IFA FOR PUBLIC SERVICES هي شركة خدمات عامة وتعليمية في تركيا، تقدم خدمات للطلاب والمقيمين والمسافرين مثل القبولات الجامعية، الإقامة، التأمين، التأشيرات، الترجمة، التصديق، وتجهيز ومتابعة الطلبات.";
  }

  if (msg.includes("قبول") || msg.includes("جامعة") || msg.includes("دراسة") || msg.includes("ماستر") || msg.includes("بكالوريوس")) {
    return "نعم، نساعدك في القبولات الجامعية في تركيا للجامعات الحكومية والخاصة والمعاهد. حتى أوجهك بشكل صحيح، أرسل لي: المرحلة المطلوبة، التخصص، المعدل، الجنسية، لغة الدراسة المطلوبة، وهل تفضّل جامعة حكومية أم خاصة.";
  }

  if (msg.includes("اقامة") || msg.includes("إقامة") || msg.includes("ikamet")) {
    return "نساعدك في ملف الإقامة في تركيا، التأمين، دفع الرسوم، تجهيز الأوراق ومتابعة النواقص. القرار النهائي دائمًا للجهات الرسمية.";
  }

  if (msg.includes("تأشيرة") || msg.includes("فيزا") || msg.includes("visa")) {
    return "نساعدك في خدمات التأشيرات حسب الدولة المطلوبة. أرسل لي الجنسية، الدولة التي تريد السفر إليها، نوع التأشيرة، وتاريخ السفر المتوقع.";
  }

  if (msg.includes("تركيا") || msg.includes("اسطنبول") || msg.includes("إسطنبول") || msg.includes("سكن")) {
    return "تركيا مناسبة للدراسة والحياة، لكن التكلفة تختلف حسب المدينة. إسطنبول أكبر وأعلى تكلفة، سكاريا هادئة وقريبة من إسطنبول، وأنقرة مناسبة للدراسة. أخبرني بالمدينة أو الجامعة المطلوبة لأعطيك توجيهًا أفضل.";
  }

  return "أقدر أساعدك في خدمات IFA مثل القبولات الجامعية، الإقامة، التأمين، التأشيرات، المعاهد، الترجمة والتصديق. اكتب طلبك بجملة قصيرة مثل: أريد قبول ماستر، أو أريد إقامة طالب، وسأوجهك خطوة بخطوة.";
}

async function handleHealth(request, env) {
  return jsonResponse({
    ok: true,
    service: "IFA FOR PUBLIC SERVICES",
    mode: "single-worker-final",
    openrouter: Boolean(env.OPENROUTER_API_KEY),
    model: env.AI_MODEL || "local-fallback-or-openrouter",
    assistant: true,
    duplicateAssistant: false,
    internalKnowledgeBase: true
  });
}

async function handleAssistant(request, env) {
  const body = await request.json().catch(() => ({}));
  const userMessage =
    body.message ||
    body.question ||
    body.text ||
    (Array.isArray(body.messages) ? body.messages.at(-1)?.content : "");

  if (!userMessage || !String(userMessage).trim()) {
    return jsonResponse({ ok: false, reply: "اكتب رسالتك أولًا وسأساعدك." }, 400);
  }

  // If no API key, the assistant still works with local IFA knowledge.
  if (!env.OPENROUTER_API_KEY) {
    return jsonResponse({
      ok: true,
      mode: "local-fallback",
      reply: localFallbackReply(userMessage)
    });
  }

  const systemPrompt = `
أنت مساعد IFA FOR PUBLIC SERVICES الذكي.
رد بنفس لغة العميل.
كن ودودًا، واضحًا، مختصرًا، ومهنيًا.
لا تخترع أسعارًا أو مواعيد أو ضمانات.
إذا احتاج الأمر تحقق، قل إن فريق IFA يمكنه التحقق.

قاعدة المعرفة:
${KNOWLEDGE_BASE}
`;

  const messages = Array.isArray(body.messages)
    ? [
        { role: "system", content: systemPrompt },
        ...body.messages.slice(-8).map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content || "")
        }))
      ]
    : [
        { role: "system", content: systemPrompt },
        { role: "user", content: String(userMessage) }
      ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": env.SITE_URL || "https://ifa-cloudflare-site.jamal-al-yousefi.workers.dev",
        "X-Title": "IFA FOR PUBLIC SERVICES"
      },
      body: JSON.stringify({
        model: env.AI_MODEL || "openrouter/auto",
        messages,
        temperature: 0.25,
        max_tokens: 700
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return jsonResponse({
        ok: true,
        mode: "local-fallback-after-openrouter-error",
        openrouterStatus: response.status,
        reply: localFallbackReply(userMessage)
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      localFallbackReply(userMessage);

    return jsonResponse({ ok: true, mode: "openrouter", reply });
  } catch (error) {
    return jsonResponse({
      ok: true,
      mode: "local-fallback-after-network-error",
      reply: localFallbackReply(userMessage)
    });
  }
}

function siteHtml() {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>IFA FOR PUBLIC SERVICES</title>
<meta name="description" content="IFA FOR PUBLIC SERVICES - خدمات عامة وتعليمية في تركيا">
<style>
:root{
  --bg:#070707;--bg2:#101013;--surface:#151518;--text:#fff8eb;--muted:#cfc2ae;
  --gold:#c99b51;--gold2:#f1d47f;--line:rgba(201,155,81,.38);--green:#25d366;
  --shadow:0 24px 70px rgba(0,0,0,.45);--radius:28px;--max:1180px;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font-family:Tahoma,Arial,sans-serif;line-height:1.75;overflow-x:hidden}
a{text-decoration:none;color:inherit}button,input,textarea,select{font:inherit}
.container{width:min(var(--max),calc(100% - 32px));margin:auto}
.header{position:sticky;top:0;z-index:50;background:rgba(7,7,7,.92);border-bottom:1px solid var(--line);backdrop-filter:blur(14px)}
.header-inner{min-height:84px;display:flex;align-items:center;justify-content:space-between;gap:18px}
.brand{display:flex;align-items:center;gap:13px;font-weight:900}
.logo-mark{width:62px;height:42px;border-radius:12px;border:1px solid var(--line);display:grid;place-items:center;background:linear-gradient(135deg,rgba(241,212,127,.18),rgba(255,255,255,.04))}
.logo-mark b{font-size:26px;color:var(--gold2);letter-spacing:-2px}
.brand-title{line-height:1.15;text-align:left;direction:ltr}.brand-title span{display:block;font-size:12px;color:var(--muted);direction:rtl;text-align:right}
.nav{display:flex;align-items:center;gap:8px}
.nav a,.nav button{border:0;background:transparent;color:var(--text);font-weight:900;padding:10px 14px;border-radius:14px;cursor:pointer}
.nav a:hover,.nav .active{background:rgba(201,155,81,.15);color:var(--gold2)}
.langs{display:flex;border:1px solid var(--line);border-radius:999px;padding:4px;gap:3px}
.langs button{min-width:40px;padding:7px;border:0;border-radius:999px;background:transparent;color:var(--text);font-weight:900;cursor:pointer}
.langs .active{background:linear-gradient(135deg,var(--gold2),var(--gold));color:#111}
.hero{position:relative;min-height:calc(100vh - 84px);display:flex;align-items:center;overflow:hidden;background:radial-gradient(circle at 20% 30%,rgba(201,155,81,.18),transparent 34%),linear-gradient(110deg,rgba(0,0,0,.98),rgba(20,18,18,.72)),url("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80") center/cover}
.hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;padding:70px 0}
.hero-card{border:1px solid var(--line);border-radius:30px;padding:38px;background:rgba(0,0,0,.3);box-shadow:var(--shadow);backdrop-filter:blur(8px)}
.hero-logo{height:190px;border:1px solid var(--line);border-radius:28px;display:grid;place-items:center;background:rgba(255,255,255,.05)}
.hero-logo .big{font-size:44px;font-weight:900;color:var(--gold2);direction:ltr;text-align:center;line-height:1.1}
h1{font-size:clamp(34px,5vw,68px);line-height:1.18;margin:0 0 18px;color:var(--gold2);font-weight:900}
.hero p{font-size:18px;color:#f4ead9;margin:0 0 24px}
.actions{display:flex;gap:12px;flex-wrap:wrap}
.btn{border:1px solid var(--line);padding:13px 20px;border-radius:16px;font-weight:900;cursor:pointer}
.btn.gold{background:linear-gradient(135deg,var(--gold2),var(--gold));color:#111;border:0}
.btn.dark{background:rgba(0,0,0,.25);color:var(--text)}
.section{padding:70px 0;border-top:1px solid rgba(201,155,81,.18)}
.section-title{font-size:34px;color:var(--gold2);margin:0 0 18px}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.card{background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.025));border:1px solid var(--line);border-radius:22px;padding:22px}
.card h3{margin:0 0 10px;color:var(--gold2)}
.card p{color:var(--muted);margin:0}
.whatsapp{position:fixed;left:18px;bottom:18px;z-index:80;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:var(--green);color:white;font-size:30px;box-shadow:0 15px 38px rgba(0,0,0,.35)}
.visitors{position:fixed;right:18px;top:105px;z-index:45;border:1px solid var(--line);border-radius:999px;padding:8px 14px;background:rgba(0,0,0,.45);backdrop-filter:blur(10px);font-weight:900;color:var(--gold2)}
/* Assistant */
#ifaAssistant{position:fixed;right:18px;bottom:18px;z-index:2147483647;direction:rtl}
#ifaOpen{border:1px solid rgba(201,155,81,.55);border-radius:999px;background:linear-gradient(135deg,var(--gold2),var(--gold));color:#111;font-weight:900;padding:13px 18px;cursor:pointer;box-shadow:0 15px 40px rgba(0,0,0,.38);animation:pulse 2.4s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-3px) scale(1.035)}}
#ifaPanel{display:none;width:min(385px,calc(100vw - 24px));height:min(565px,calc(100vh - 92px));background:linear-gradient(180deg,#151515,#0d1019);border:1px solid rgba(201,155,81,.65);border-radius:24px;overflow:hidden;color:#fff;box-shadow:var(--shadow)}
#ifaAssistant.open #ifaPanel{display:flex;flex-direction:column}
#ifaAssistant.open #ifaOpen{display:none}
.ai-head{background:linear-gradient(135deg,var(--gold2),var(--gold));color:#111;padding:13px 14px;display:flex;justify-content:space-between;align-items:center;font-weight:900}
.ai-head small{display:block;font-size:11px;opacity:.75}
.ai-actions{display:flex;gap:8px}.ai-actions button{width:32px;height:32px;border:0;border-radius:10px;background:rgba(0,0,0,.13);font-weight:900;cursor:pointer}
#aiMessages{flex:1;overflow-y:auto;padding:13px;background:radial-gradient(circle at top right,rgba(201,155,81,.13),transparent 36%),#0f172a}
.msg{max-width:88%;padding:10px 12px;margin:8px 0;border-radius:16px;font-size:14px;line-height:1.65;white-space:pre-wrap}
.bot{margin-left:auto;background:rgba(255,255,255,.075);border:1px solid rgba(201,155,81,.35)}
.user{margin-right:auto;background:rgba(37,211,102,.18);border:1px solid rgba(37,211,102,.45)}
.typing{display:inline-flex;gap:4px;align-items:center}
.typing span{width:6px;height:6px;background:var(--gold2);border-radius:50%;display:block;animation:dot 1s infinite ease-in-out}
.typing span:nth-child(2){animation-delay:.15s}.typing span:nth-child(3){animation-delay:.3s}
@keyframes dot{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-4px)}}
#aiForm{display:flex;gap:8px;padding:10px;background:#121212;border-top:1px solid rgba(201,155,81,.3)}
#aiInput{flex:1;min-width:0;border:1px solid rgba(201,155,81,.45);border-radius:15px;background:#0b0f18;color:white;outline:none;padding:11px}
#aiSend{border:0;border-radius:15px;background:linear-gradient(135deg,var(--gold2),var(--gold));color:#111;font-weight:900;padding:0 14px;cursor:pointer}
@media(max-width:850px){.header-inner{flex-wrap:wrap;padding:10px 0}.nav{width:100%;justify-content:center;overflow:auto}.hero-grid{grid-template-columns:1fr;padding:42px 0}.hero-card{padding:24px}.cards{grid-template-columns:1fr}.visitors{top:132px}.brand-title{font-size:13px}}
@media(max-width:640px){#ifaAssistant{right:10px;bottom:10px}#ifaPanel{width:calc(100vw - 20px);height:72vh;border-radius:20px}.whatsapp{left:10px;bottom:10px}.hero-logo{height:130px}.hero-logo .big{font-size:30px}}
</style>
</head>
<body>
<header class="header">
  <div class="container header-inner">
    <div class="brand"><div class="logo-mark"><b>IFA</b></div><div class="brand-title">IFA FOR PUBLIC SERVICES<span>خدمات عامة وتعليمية في تركيا</span></div></div>
    <nav class="nav"><a class="active" href="#home">الرئيسية</a><a href="#services">الخدمات</a><a href="#about">من نحن</a><a href="#contact">تواصل معنا</a><div class="langs"><button class="active">AR</button><button>TR</button><button>EN</button></div></nav>
  </div>
</header>

<div class="visitors">👁 زوار الموقع: 201</div>

<main id="home" class="hero">
  <div class="container hero-grid">
    <div class="hero-card">
      <div class="hero-logo"><div class="big">IFA FOR<br>PUBLIC SERVICES</div></div>
    </div>
    <div>
      <h1>شركة إيفاء للخدمات العامة والتعليمية المتكاملة في تركيا</h1>
      <p>نرتب معاملاتك بخطوات واضحة، متابعة دقيقة، وخدمة احترافية للطلاب والمقيمين والمسافرين داخل تركيا وخارجها.</p>
      <div class="actions"><a class="btn gold" href="#contact">ابدأ طلبك الآن</a><a class="btn dark" href="#services">استعرض الخدمات</a></div>
    </div>
  </div>
</main>

<section id="about" class="section"><div class="container">
  <h2 class="section-title">تعريف بالشركة</h2>
  <p style="color:var(--muted);font-size:18px;max-width:850px">IFA FOR PUBLIC SERVICES تقدم خدمات عامة وتعليمية وإدارية وسياحية في تركيا، وتعمل على ترتيب المعاملات وتسهيل التواصل مع العميل خطوة بخطوة.</p>
  <div class="cards" style="margin-top:22px"><div class="card"><h3>ثقة</h3><p>تعامل واضح ومتابعة مستمرة للطلب.</p></div><div class="card"><h3>خبرة</h3><p>خدمات متعددة للطلاب والمقيمين والمسافرين.</p></div><div class="card"><h3>سرعة</h3><p>ترتيب الملفات وتوجيه العميل حسب الخدمة.</p></div></div>
</div></section>

<section id="services" class="section"><div class="container">
  <h2 class="section-title">الخدمات</h2>
  <div class="cards">
    <div class="card"><h3>القبولات الجامعية</h3><p>جامعات حكومية وخاصة ومعاهد ودراسة لغة.</p></div>
    <div class="card"><h3>الإقامة والتأمين</h3><p>تجهيز الملف، التأمين، الرسوم ومتابعة النواقص.</p></div>
    <div class="card"><h3>التأشيرات والسفر</h3><p>متابعة متطلبات التأشيرات حسب الجنسية والدولة.</p></div>
    <div class="card"><h3>الترجمة والتصديق</h3><p>ترجمة وتصديق الشهادات والوثائق الرسمية.</p></div>
    <div class="card"><h3>الخدمات العامة</h3><p>تسهيل المعاملات والمتابعة خطوة بخطوة.</p></div>
    <div class="card"><h3>استشارات الطلاب</h3><p>توجيه عام حول المدن، الدراسة، السكن والحياة في تركيا.</p></div>
  </div>
</div></section>

<section id="contact" class="section"><div class="container">
  <h2 class="section-title">تواصل معنا</h2>
  <p style="color:var(--muted)">للطلبات السريعة استخدم زر واتساب أو مساعد IFA الذكي.</p>
</div></section>

<a class="whatsapp" href="https://wtsi.me/905376053328" target="_blank" aria-label="WhatsApp">☘</a>

<div id="ifaAssistant">
  <div id="ifaPanel">
    <div class="ai-head"><div>مساعد IFA الذكي<small>متاح الآن</small></div><div class="ai-actions"><button id="aiReset" type="button">↻</button><button id="aiClose" type="button">×</button></div></div>
    <div id="aiMessages"></div>
    <form id="aiForm"><input id="aiInput" autocomplete="off" placeholder="اكتب سؤالك هنا..." /><button id="aiSend" type="submit">إرسال</button></form>
  </div>
  <button id="ifaOpen" type="button">✨ مساعد IFA <span style="opacity:.75">اسألني الآن</span></button>
</div>

<script>
(function(){
  const root=document.getElementById('ifaAssistant'), open=document.getElementById('ifaOpen'), close=document.getElementById('aiClose'), reset=document.getElementById('aiReset'), form=document.getElementById('aiForm'), input=document.getElementById('aiInput'), messages=document.getElementById('aiMessages');
  let history=[];
  function add(text,who){const d=document.createElement('div');d.className='msg '+(who==='user'?'user':'bot');d.textContent=text;messages.appendChild(d);messages.scrollTop=messages.scrollHeight;return d}
  function typing(){const d=document.createElement('div');d.className='msg bot';d.innerHTML='<span class="typing"><span></span><span></span><span></span></span> جاري كتابة الرد...';messages.appendChild(d);messages.scrollTop=messages.scrollHeight;return d}
  function welcome(){messages.innerHTML='';history=[];add('مرحبًا بك في IFA FOR PUBLIC SERVICES 👋\\nأنا مساعد IFA الذكي. يمكنني مساعدتك في القبولات الجامعية، الإقامة، التأمين، التأشيرات، المعاهد، الترجمة، التصديق، ومتابعة الطلبات.\\n\\nكيف يمكنني مساعدتك اليوم؟','bot')}
  async function send(text){add(text,'user');history.push({role:'user',content:text});const load=typing();try{const r=await fetch('/api/ifa-assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,messages:history.slice(-8)})});const data=await r.json();const reply=data.reply||'لم يصل رد واضح من المساعد.';load.textContent=reply;history.push({role:'assistant',content:reply})}catch(e){load.textContent='تعذر الاتصال بالمساعد الآن، لكن يمكنك التواصل معنا عبر واتساب.'}}
  open.onclick=()=>{root.classList.add('open');setTimeout(()=>input.focus(),80)}
  close.onclick=()=>root.classList.remove('open')
  reset.onclick=welcome
  form.onsubmit=(e)=>{e.preventDefault();const t=(input.value||'').trim();if(!t)return;input.value='';send(t)}
  welcome()
})();
</script>
</body>
</html>`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });

    if (path === "/api/health" && request.method === "GET") return handleHealth(request, env);
    if ((path === "/api/ifa-assistant" || path === "/api/chat") && request.method === "POST") return handleAssistant(request, env);

    return new Response(siteHtml(), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};
