import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
const FROM_NAME = "Uncooked";

interface GrindReminder {
  registration_id: string;
  user_email: string;
  user_name: string;
  grind_id: string;
  grind_title: string;
  grind_description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url: string | null;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-IE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function generateReminderEmailHtml(data: {
  userName: string;
  grindTitle: string;
  grindDescription: string | null;
  scheduledAt: string;
  durationMinutes: number;
  meetingUrl: string | null;
}): string {
  const startTime = formatTime(data.scheduledAt);

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
              <p style="margin: 0 0 8px 0; font-size: 18px; line-height: 28px; color: #1A1A1A;">Hi ${data.userName},</p>

              <p style="margin: 0 0 24px 0; font-size: 20px; line-height: 30px; color: #1A1A1A;">
                Just a heads up — your session starts in <strong>2 hours</strong>.
              </p>

              <!-- Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border: 1px solid #E5E4DC; border-radius: 4px; margin-bottom: 24px;">
                <tr>
                  <td align="center" style="padding: 24px;">
                    <p style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #1A1A1A;">${data.grindTitle}</p>
                    ${data.grindDescription ? `<p style="margin: 0 0 16px 0; font-size: 14px; color: #6B6B6B;">${data.grindDescription}</p>` : ""}
                    <p style="margin: 16px 0 4px 0; font-size: 28px; font-weight: 600; color: #D97757;">Starts at ${startTime}</p>
                    <p style="margin: 0; font-size: 14px; color: #6B6B6B;">${data.durationMinutes} minutes</p>
                  </td>
                </tr>
              </table>

              ${data.meetingUrl ? `
              <!-- Join Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${data.meetingUrl}" style="display: inline-block; background-color: #D97757; color: #FFFFFF; font-size: 16px; font-weight: 500; text-decoration: none; padding: 14px 40px; border-radius: 4px;">Join Meeting</a>
                  </td>
                </tr>
              </table>
              ` : `
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 26px; color: #4A4A4A;">
                The meeting link will be available on your dashboard when the session is about to start.
              </p>
              `}

              <!-- Tip -->
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #6B6B6B; font-style: italic; padding: 16px; background-color: #F5F4ED; border-radius: 4px;">
                Tip: Find a quiet spot, have a pen and paper ready, and make sure your device is charged.
              </p>

              <p style="margin: 16px 0 0 0; font-size: 16px; line-height: 26px; color: #4A4A4A;">
                See you soon,<br>Ben
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
  // Only allow POST requests (from cron or manual trigger)
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify authorization (cron jobs include the service role key)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.includes(SUPABASE_SERVICE_ROLE_KEY)) {
    // Check if it's an anon key request (for testing)
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!authHeader?.includes(anonKey || "")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Find grinds starting in ~2 hours (1.5 to 2.5 hour window for flexibility)
    // This allows the cron job to run every 30 minutes without missing any
    const now = new Date();
    const windowStart = new Date(now.getTime() + 90 * 60 * 1000); // 1.5 hours from now
    const windowEnd = new Date(now.getTime() + 150 * 60 * 1000); // 2.5 hours from now

    // Query registrations where:
    // 1. The grind is within the reminder window
    // 2. The reminder hasn't been sent yet
    const { data: reminders, error: queryError } = await supabase
      .from("grind_registrations")
      .select(
        `
        id,
        user_id,
        grind_id,
        grinds!inner (
          id,
          title,
          description,
          scheduled_at,
          duration_minutes,
          meeting_url
        )
      `
      )
      .is("reminder_email_sent_at", null)
      .gte("grinds.scheduled_at", windowStart.toISOString())
      .lte("grinds.scheduled_at", windowEnd.toISOString());

    if (queryError) {
      console.error("Error querying registrations:", queryError);
      return new Response(JSON.stringify({ error: queryError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No reminders to send",
          count: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user details for each registration
    const userIds = [...new Set(reminders.map((r) => r.user_id))];

    // Get user emails from auth.users (targeted lookups, not bulk list)
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

    // Send emails
    const results = await Promise.allSettled(
      reminders.map(async (reminder) => {
        const grind = reminder.grinds as {
          id: string;
          title: string;
          description: string | null;
          scheduled_at: string;
          duration_minutes: number;
          meeting_url: string | null;
        };

        const userEmail = emailMap.get(reminder.user_id);
        if (!userEmail) {
          console.error(`No email found for user ${reminder.user_id}`);
          return { success: false, error: "No email" };
        }

        const userName =
          nameMap.get(reminder.user_id) || userEmail.split("@")[0];

        const html = generateReminderEmailHtml({
          userName,
          grindTitle: grind.title,
          grindDescription: grind.description,
          scheduledAt: grind.scheduled_at,
          durationMinutes: grind.duration_minutes,
          meetingUrl: grind.meeting_url,
        });

        // Send via Resend API
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: userEmail,
            subject: `Reminder: ${grind.title} starts in 2 hours`,
            html,
            headers: {
              "X-Entity-Ref-ID": `grind-reminder/${grind.id}/${userEmail}`,
            },
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error(`Failed to send email to ${userEmail}:`, errorText);
          return { success: false, error: errorText };
        }

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from("grind_registrations")
          .update({ reminder_email_sent_at: new Date().toISOString() })
          .eq("id", reminder.id);

        if (updateError) {
          console.error(
            `Failed to update reminder status for ${reminder.id}:`,
            updateError
          );
        }

        return { success: true, email: userEmail };
      })
    );

    const successful = results.filter(
      (r) => r.status === "fulfilled" && (r.value as { success: boolean }).success
    ).length;
    const failed = results.length - successful;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${successful} reminders, ${failed} failed`,
        total: results.length,
        successful,
        failed,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
