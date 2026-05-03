const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
  return handleVisitor(context);
}

export async function onRequestPost(context) {
  return handleVisitor(context);
}

async function handleVisitor(context) {
  try {
    const { env } = context;

    // Optional KV binding name: IFA_KV
    if (!env.IFA_KV) {
      return jsonResponse({
        ok: true,
        count: 0,
        note: "KV غير مربوط. أضف KV binding باسم IFA_KV لتفعيل عداد الزوار الحقيقي."
      });
    }

    const key = "visitor_counter_total";
    const current = Number(await env.IFA_KV.get(key) || "0");
    const next = current + 1;
    await env.IFA_KV.put(key, String(next));

    return jsonResponse({
      ok: true,
      count: next
    });

  } catch (error) {
    return jsonResponse({
      ok: false,
      error: "visitor_counter_error",
      message: error.message
    }, 500);
  }
}
