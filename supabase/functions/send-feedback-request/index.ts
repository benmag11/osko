import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
const FROM_NAME = "Uncooked";

const DEFAULT_FEEDBACK_BODY =
  "Thanks for attending the grind! We'd love to hear how it went — your feedback helps make future sessions better for everyone.";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function capitalizeName(name: string): string {
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function generateFeedbackRequestHtml(data: {
  userName: string;
  grindTitle: string;
  feedbackUrl: string;
  bodyText: string;
}): string {
  const safeName = escapeHtml(capitalizeName(data.userName));
  const safeTitle = escapeHtml(data.grindTitle);
  const safeBody = escapeHtml(data.bodyText).replace(/\n/g, "<br>");

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
              <img src="https://uncooked.ie/logo-full.png" alt="Uncooked" width="140" height="46" style="display: block; margin: 0 auto;" />
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="border-bottom: 1px solid #E5E4DC;"></td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 0;">
              <!-- White content card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border: 1px solid #E5E4DC; border-radius: 8px;">
                <tr>
                  <td style="padding: 32px 28px;">
                    <p style="margin: 0 0 20px 0; font-size: 18px; line-height: 26px; color: #1A1A1A;">Hi ${safeName},</p>

                    <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 24px; color: #4A4A4A;">
                      ${safeBody}
                    </p>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 4px;">
                      <tr>
                        <td align="center">
                          <a href="${data.feedbackUrl}" style="display: inline-block; background-color: #ED805E; color: #FFFFFF; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 44px; border-radius: 6px;">Share Your Feedback</a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 24px 0 0 0; font-size: 15px; line-height: 24px; color: #4A4A4A;">
                      Ben
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="border-bottom: 1px solid #E5E4DC;"></td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #6B6B6B;">Uncooked \u2014 Leaving Cert exam preparation</p>
              <p style="margin: 0; font-size: 13px;">
                <a href="https://uncooked.ie/dashboard/grinds" style="color: #ED805E; text-decoration: none;">View upcoming grinds</a>
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

  // Verify authorization — service role key
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

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Discover grinds that ended 15-75 minutes ago with unsent feedback emails
    const { data: grinds, error: rpcError } = await supabase.rpc(
      "get_grinds_needing_feedback"
    );

    if (rpcError) {
      console.error("Error calling get_grinds_needing_feedback:", rpcError);
      return new Response(JSON.stringify({ error: rpcError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!grinds || grinds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No feedback emails to send",
          count: 0,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    let totalSuccessful = 0;
    let totalFailed = 0;
    const allErrors: string[] = [];

    for (const grind of grinds) {
      const grindId = grind.grind_id;
      const grindTitle = grind.grind_title;
      const bodyText = grind.feedback_email_body || DEFAULT_FEEDBACK_BODY;
      const feedbackUrl = `https://uncooked.ie/feedback?grind=${grindId}`;

      // Fetch registrations that haven't received a feedback email yet
      const { data: registrations, error: regError } = await supabase
        .from("grind_registrations")
        .select("id, user_id")
        .eq("grind_id", grindId)
        .is("feedback_email_sent_at", null);

      if (regError) {
        console.error(
          `Error fetching registrations for grind ${grindId}:`,
          regError
        );
        allErrors.push(`Grind ${grindId}: ${regError.message}`);
        continue;
      }

      if (!registrations || registrations.length === 0) {
        continue;
      }

      const userIds = [...new Set(registrations.map((r) => r.user_id))];

      // Get emails from auth.users (parallel lookups)
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

      // Get names from user_profiles
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, name")
        .in("user_id", userIds);
      const nameMap = new Map(
        (profiles || []).map((p) => [p.user_id, p.name])
      );

      // Build batch email array for this grind
      const emailObjects: Array<{
        from: string;
        to: string;
        subject: string;
        html: string;
        headers: Record<string, string>;
      }> = [];
      const registrationIds: string[] = [];

      for (const reg of registrations) {
        const userEmail = emailMap.get(reg.user_id);
        if (!userEmail) {
          totalFailed++;
          allErrors.push(`No email for user ${reg.user_id}`);
          continue;
        }

        const userName = nameMap.get(reg.user_id) || userEmail.split("@")[0];

        const html = generateFeedbackRequestHtml({
          userName,
          grindTitle,
          feedbackUrl,
          bodyText,
        });

        emailObjects.push({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: userEmail,
          subject: `How was ${grindTitle}?`,
          html,
          headers: {
            "X-Entity-Ref-ID": `feedback-request/${grindId}/${userEmail}`,
          },
        });
        registrationIds.push(reg.id);
      }

      if (emailObjects.length === 0) continue;

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

      if (batchResponse.ok) {
        totalSuccessful += emailObjects.length;
        console.log(
          `Sent ${emailObjects.length} feedback requests for grind ${grindId}`
        );

        // Stamp all registrations as sent
        const { error: updateError } = await supabase
          .from("grind_registrations")
          .update({ feedback_email_sent_at: new Date().toISOString() })
          .in("id", registrationIds);

        if (updateError) {
          console.error(
            `Failed to stamp feedback_email_sent_at for grind ${grindId}:`,
            updateError
          );
        }
      } else {
        const errorText = await batchResponse.text();
        totalFailed += emailObjects.length;
        allErrors.push(`Batch send for grind ${grindId}: ${errorText}`);
        console.error(
          `Batch send failed for grind ${grindId}:`,
          errorText
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: totalSuccessful + totalFailed,
        successful: totalSuccessful,
        failed: totalFailed,
        errors: allErrors.length > 0 ? allErrors : undefined,
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
