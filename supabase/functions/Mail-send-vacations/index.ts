import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface Payload {
  to: string;
  status: "approved" | "rejected";
  type: "vacation" | "day-off";
  employeeName: string;
  start_date: string; // YYYY-MM-DD
  end_date?: string;  // YYYY-MM-DD (optional for day-off)
  comment?: string;
  decidedByName?: string;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "onboarding@resend.dev"; // Usar siempre el dominio verificado de Resend
//const FROM = "vacaciones@gestor.trabajo.com"; // Utiizar este dominio verificado por Resend en producción.

console.log('[Mail-send-vacations] Secretos:', {
  hasResendKey: !!RESEND_API_KEY,
  resendKeyPrefix: RESEND_API_KEY?.substring(0, 10) || 'missing',
  from: FROM
});

function buildEmail(payload: Payload) {
  const { status, type, employeeName, start_date, end_date, comment, decidedByName } = payload;
  const isApproved = status === "approved";
  const subject = isApproved
    ? (type === "vacation" ? "Solicitud de vacaciones aprobada" : "Día libre aprobado")
    : (type === "vacation" ? "Solicitud de vacaciones rechazada" : "Día libre rechazado");

  const range = end_date && end_date !== start_date
    ? `${start_date} a ${end_date}`
    : start_date;

  const statusColor = isApproved ? "#10b981" : "#ef4444";
  const statusBg = isApproved ? "#ecfdf5" : "#fef2f2";
  const statusText = isApproved ? "Aprobada" : "Rechazada";
  const statusIcon = isApproved ? "✓" : "✕";
  const typeEmoji = type === "vacation" ? "🏖️" : "📅";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          line-height: 1.6;
          color: #1f2937;
          margin: 0;
          padding: 0;
          background-color: #f9fafb;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .status-badge {
          display: inline-block;
          background-color: ${statusBg};
          color: ${statusColor};
          padding: 12px 24px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 24px;
          border-left: 4px solid ${statusColor};
        }
        .status-icon {
          display: inline-block;
          width: 32px;
          height: 32px;
          background-color: ${statusColor};
          color: white;
          border-radius: 50%;
          text-align: center;
          line-height: 32px;
          font-weight: bold;
          margin-right: 8px;
          font-size: 18px;
        }
        .details-box {
          background-color: #f3f4f6;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
          border-left: 4px solid #667eea;
        }
        .detail-row {
          display: flex;
          margin-bottom: 12px;
          align-items: flex-start;
        }
        .detail-row:last-child {
          margin-bottom: 0;
        }
        .detail-label {
          font-weight: 600;
          color: #6b7280;
          min-width: 120px;
        }
        .detail-value {
          color: #1f2937;
        }
        .comment-box {
          background-color: #fffbeb;
          border-left: 4px solid #f59e0b;
          padding: 16px;
          border-radius: 6px;
          margin: 24px 0;
        }
        .comment-box strong {
          display: block;
          color: #b45309;
          margin-bottom: 8px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .comment-text {
          color: #92400e;
          font-style: italic;
        }
        .footer {
          background-color: #f9fafb;
          padding: 24px 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer-text {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }
        .footer-divider {
          height: 1px;
          background-color: #e5e7eb;
          margin: 16px 0;
        }
        .signature {
          margin-top: 8px;
          font-weight: 600;
          color: #1f2937;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 24px;
          color: #1f2937;
        }
        .main-message {
          font-size: 16px;
          margin-bottom: 24px;
          color: #374151;
          line-height: 1.8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Gestor de Trabajo</h1>
          <p>Sistema de Solicitudes de Vacaciones y Días Libres</p>
        </div>

        <div class="content">
          <div class="greeting">
            <strong>Hola ${employeeName},</strong>
          </div>

          <div class="status-badge">
            <span class="status-icon">${statusIcon}</span>
            ${typeEmoji} Tu solicitud ha sido ${statusText}
          </div>

          <div class="main-message">
            Tu solicitud de ${type === "vacation" ? "vacaciones" : "día libre"} ha sido <strong>${isApproved ? "aprobada ✓" : "rechazada ✕"}</strong>.
          </div>

          <div class="details-box">
            <div class="detail-row">
              <div class="detail-label">Tipo:</div>
              <div class="detail-value">${typeEmoji} ${type === "vacation" ? "Vacaciones" : "Día Libre"}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Fechas:</div>
              <div class="detail-value">📅 ${range}</div>
            </div>
            ${decidedByName ? `<div class="detail-row">
              <div class="detail-label">Decidido por:</div>
              <div class="detail-value">👤 ${decidedByName}</div>
            </div>` : ""}
          </div>

          ${comment ? `<div class="comment-box">
            <strong>📝 Comentario:</strong>
            <div class="comment-text">"${comment}"</div>
          </div>` : ""}

          <div style="margin-top: 32px; text-align: center; padding: 24px; background-color: #f0f9ff; border-radius: 8px; border-left: 4px solid #667eea;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              Si tienes alguna pregunta sobre esta decisión, por favor contacta con tu administrador.
            </p>
          </div>
        </div>

        <div class="footer">
          <p class="footer-text">
            Este es un correo automático del sistema de Gestor de Trabajo.
          </p>
          <div class="footer-divider"></div>
          <p class="signature">Gestor de Trabajo</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `GESTOR DE TRABAJO - Solicitud de ${type === "vacation" ? "Vacaciones" : "Día Libre"}\n\nHola ${employeeName},\n\nTu solicitud de ${type === "vacation" ? "vacaciones" : "día libre"} para ${range} ha sido ${isApproved ? "aprobada" : "rechazada"}.\n\nDETALLES:\n- Tipo: ${type === "vacation" ? "Vacaciones" : "Día Libre"}\n- Fechas: ${range}\n${decidedByName ? `- Decidido por: ${decidedByName}\n` : ""}${comment ? `\nCOMENTARIO:\n${comment}\n` : ""}\nSi tienes alguna pregunta sobre esta decisión, por favor contacta con tu administrador.\n\nSaludos,\nGestor de Trabajo`;

  return { subject, html, text };
}

async function sendWithResend(to: string, subject: string, html: string, text?: string): Promise<{ status: number; body: string }> {
  if (!RESEND_API_KEY) {
    return { status: 500, body: JSON.stringify({ error: "Missing RESEND_API_KEY" }) };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html, text }),
    });

    const body = await res.text();
    return { status: res.status, body };
  } catch (e) {
    return { status: 500, body: JSON.stringify({ error: String(e) }) };
  }
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const payload = (await req.json()) as Payload;
    if (!payload?.to || !payload?.status || !payload?.type || !payload?.employeeName || !payload?.start_date) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { subject, html, text } = buildEmail(payload);
    const resp = await sendWithResend(payload.to, subject, html, text);

    return new Response(resp.body, {
      status: resp.status,
      headers: corsHeaders,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
