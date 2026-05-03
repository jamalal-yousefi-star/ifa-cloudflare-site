const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
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

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));

    const name = body.name || body.fullName || body.full_name || "";
    const phone = body.phone || body.whatsapp || body.mobile || "";
    const email = body.email || "";
    const service = body.service || body.subject || "طلب جديد من الموقع";
    const message = body.message || body.notes || "";

    if (!name && !phone && !email && !message) {
      return jsonResponse({
        ok: false,
        error: "empty_request",
        message: "الطلب فارغ. أدخل الاسم أو رقم التواصل."
      }, 400);
    }

    const savedRequest = {
      createdAt: new Date().toISOString(),
      name,
      phone,
      email,
      service,
      message,
      source: "ifa-website"
    };

    // Optional KV storage binding: IFA_KV
    if (env.IFA_KV) {
      const id = `request_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      await env.IFA_KV.put(id, JSON.stringify(savedRequest));
    }

    let emailSent = false;
    let emailNote = "لم يتم إرسال إيميل لأن RESEND_API_KEY أو ADMIN_EMAIL غير مضافين.";

    // Optional email via Resend
    if (env.RESEND_API_KEY && env.ADMIN_EMAIL) {
      const fromEmail = env.FROM_EMAIL || "IFA Website <onboarding@resend.dev>";
      const subject = `طلب جديد من موقع IFA - ${service}`;

      const html = `
        <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">
          <h2>طلب جديد من موقع IFA</h2>
          <p><b>الاسم:</b> ${escapeHtml(name)}</p>
          <p><b>رقم التواصل/واتساب:</b> ${escapeHtml(phone)}</p>
          <p><b>الإيميل:</b> ${escapeHtml(email)}</p>
          <p><b>الخدمة:</b> ${escapeHtml(service)}</p>
          <p><b>الرسالة:</b><br>${escapeHtml(message)}</p>
          <hr>
          <p><small>${savedRequest.createdAt}</small></p>
        </div>
      `;

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [env.ADMIN_EMAIL],
          subject,
          html
        })
      });

      const resendData = await resendRes.json().catch(() => ({}));
      emailSent = resendRes.ok;
      emailNote = resendRes.ok ? "تم إرسال الطلب إلى الإيميل." : `فشل إرسال الإيميل: ${JSON.stringify(resendData)}`;
    }

    return jsonResponse({
      ok: true,
      message: "تم استلام طلبك بنجاح.",
      emailSent,
      emailNote
    });

  } catch (error) {
    return jsonResponse({
      ok: false,
      error: "contact_error",
      message: error.message
    }, 500);
  }
}
