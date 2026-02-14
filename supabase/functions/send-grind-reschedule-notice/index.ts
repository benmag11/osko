import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
const FROM_NAME = "Uncooked";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateRescheduleEmailHtml(data: {
  userName: string;
  grindTitle: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #FEF5EB; font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FEF5EB;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width: 560px;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <p style="margin: 0; font-size: 24px; font-weight: 600; color: #1A1A1A; font-family: 'Source Serif Pro', Georgia, serif;">Uncooked</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="border-bottom: 1px solid #E5E4DC;"></td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 0;">
              <p style="margin: 0 0 8px 0; font-size: 18px; line-height: 28px; color: #1A1A1A;">Hi ${escapeHtml(data.userName)},</p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 26px; color: #4A4A4A;">
                You received a reminder earlier today about your upcoming session. Apologies for any confusion — that session has been <strong>cancelled</strong> for today.
              </p>

              <!-- Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border: 1px solid #E5E4DC; border-radius: 4px; margin-bottom: 24px;">
                <tr>
                  <td align="center" style="padding: 24px;">
                    <p style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #1A1A1A;">${escapeHtml(data.grindTitle)}</p>
                    <p style="margin: 0 0 16px 0; font-size: 14px; color: #6B6B6B;">Today's session has been cancelled</p>
                    <p style="margin: 0 0 4px 0; font-size: 22px; font-weight: 600; color: #D97757;">Rescheduled to Saturday 21 February</p>
                    <p style="margin: 0; font-size: 16px; color: #4A4A4A;">at <strong>8:00 PM</strong></p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 26px; color: #4A4A4A;">
                You don't need to do anything — your registration carries over and you'll receive a new reminder before the rescheduled session.
              </p>

              <p style="margin: 16px 0 0 0; font-size: 16px; line-height: 26px; color: #4A4A4A;">
                Sorry for the mixup,<br>Ben
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="border-bottom: 1px solid #E5E4DC;"></td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #6B6B6B;">Uncooked — Leaving Cert exam preparation</p>
              <p style="margin: 0; font-size: 13px;">
                <a href="https://uncooked.ie/dashboard/grinds" style="color: #D97757; text-decoration: underline;">View upcoming grinds</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify authorization — only accept the service role key
  const authHeader = req.headers.get("Authorization");
  const expectedToken = `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;
  if (authHeader !== expectedToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let grindId: string;
  try {
    const body = await req.json();
    if (typeof body?.grind_id !== "string") {
      throw new Error("missing grind_id");
    }
    grindId = body.grind_id;
  } catch {
    return new Response(
      JSON.stringify({ error: "Request body must include { grind_id: string }" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Find registrations that already received a reminder email today for this grind
    const { data: registrations, error: queryError } = await supabase
      .from("grind_registrations")
      .select(
        `
        id,
        user_id,
        grind_id,
        grinds!inner (
          id,
          title
        )
      `
      )
      .eq("grind_id", grindId)
      .not("reminder_email_sent_at", "is", null)
      .gte("reminder_email_sent_at", new Date().toISOString().split("T")[0])
      .lt(
        "reminder_email_sent_at",
        new Date(Date.now() + 86400000).toISOString().split("T")[0]
      );

    if (queryError) {
      console.error("Error querying registrations:", queryError);
      return new Response(JSON.stringify({ error: queryError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!registrations || registrations.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No registrations found with reminders sent today for this grind",
          count: 0,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user details
    const userIds = [...new Set(registrations.map((r) => r.user_id))];

    const userResults = await Promise.allSettled(
      userIds.map((id) => supabase.auth.admin.getUserById(id))
    );

    const emailMap = new Map<string, string>();
    for (let i = 0; i < userIds.length; i++) {
      const result = userResults[i];
      if (result.status === "fulfilled" && result.value.data?.user?.email) {
        emailMap.set(userIds[i], result.value.data.user.email);
      } else {
        console.error(
          `Failed to fetch user ${userIds[i]}:`,
          result.status === "rejected"
            ? result.reason
            : result.value.error
        );
      }
    }

    // Get user profiles for names
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("user_id, name")
      .in("user_id", userIds);
    const nameMap = new Map(
      (profiles || []).map((p) => [p.user_id, p.name])
    );

    // Build batch email array
    const emailObjects: Array<{
      from: string;
      to: string;
      subject: string;
      html: string;
      headers: Record<string, string>;
    }> = [];
    const registrationIds: string[] = [];
    let skipped = 0;

    for (const reg of registrations) {
      const grind = reg.grinds as { id: string; title: string };

      const userEmail = emailMap.get(reg.user_id);
      if (!userEmail) {
        console.error(`No email found for user ${reg.user_id}`);
        skipped++;
        continue;
      }

      const userName = nameMap.get(reg.user_id) || userEmail.split("@")[0];

      const html = generateRescheduleEmailHtml({
        userName,
        grindTitle: grind.title,
      });

      emailObjects.push({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: userEmail,
        subject: `Schedule Change: ${grind.title} — Rescheduled to 21 Feb`,
        html,
        headers: {
          "X-Entity-Ref-ID": `grind-reschedule/${grind.id}/${userEmail}`,
        },
      });
      registrationIds.push(reg.id);
    }

    if (emailObjects.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No valid emails to send",
          total: registrations.length,
          successful: 0,
          failed: skipped,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Send via Resend Batch API
    const batchResponse = await fetch(
      "https://api.resend.com/emails/batch",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailObjects),
      }
    );

    let successful = 0;
    let failed = skipped;

    if (batchResponse.ok) {
      successful = emailObjects.length;
      console.log(`Batch sent ${successful} reschedule notice emails`);

      // Reset reminder_email_sent_at to NULL so the cron reminder fires again for the rescheduled date
      const { error: updateError } = await supabase
        .from("grind_registrations")
        .update({ reminder_email_sent_at: null })
        .in("id", registrationIds);

      if (updateError) {
        console.error(
          "Failed to reset reminder_email_sent_at:",
          updateError
        );
      } else {
        console.log(
          `Reset reminder_email_sent_at for ${registrationIds.length} registrations`
        );
      }
    } else {
      const errorText = await batchResponse.text();
      failed += emailObjects.length;
      console.error("Batch send failed:", errorText);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${successful} reschedule notices, ${failed} failed`,
        total: registrations.length,
        successful,
        failed,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
