import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      username?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

const getEmailContent = (type: string, confirmUrl: string, username: string) => {
  const baseStyles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0d1117; color: #e6edf3; margin: 0; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #161b22 0%, #0d1117 100%); border-radius: 16px; border: 1px solid #30363d; padding: 40px; }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo h1 { color: #58a6ff; font-size: 28px; margin: 0; }
    .logo span { color: #8b949e; font-size: 12px; }
    h2 { color: #e6edf3; font-size: 24px; margin-bottom: 20px; }
    p { color: #8b949e; line-height: 1.6; margin-bottom: 20px; }
    .button { display: inline-block; background: linear-gradient(135deg, #238636 0%, #2ea043 100%); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .button:hover { background: linear-gradient(135deg, #2ea043 0%, #3fb950 100%); }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #30363d; text-align: center; }
    .footer p { color: #6e7681; font-size: 12px; }
    .code { background: #21262d; padding: 16px; border-radius: 8px; font-family: monospace; color: #58a6ff; text-align: center; font-size: 18px; letter-spacing: 2px; }
  `;

  switch (type) {
    case "signup":
    case "email_confirmation":
      return {
        subject: "Confirm your Justachat™ account",
        html: `
          <!DOCTYPE html>
          <html>
          <head><style>${baseStyles}</style></head>
          <body>
            <div class="container">
              <div class="logo">
                <h1>Justachat™</h1>
                <span>Free Chat Rooms Since 1997</span>
              </div>
              <h2>Welcome${username ? `, ${username}` : ''}! 👋</h2>
              <p>Thanks for signing up for Justachat™! Please confirm your email address to activate your account and start chatting.</p>
              <div style="text-align: center;">
                <a href="${confirmUrl}" class="button">Confirm Email Address</a>
              </div>
              <p style="font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="font-size: 12px; word-break: break-all; color: #58a6ff;">${confirmUrl}</p>
              <div class="footer">
                <p>If you didn't create an account, you can safely ignore this email.</p>
                <p>© ${new Date().getFullYear()} Justachat™ - All rights reserved</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "recovery":
    case "password_recovery":
      return {
        subject: "Reset your Justachat™ password",
        html: `
          <!DOCTYPE html>
          <html>
          <head><style>${baseStyles}</style></head>
          <body>
            <div class="container">
              <div class="logo">
                <h1>Justachat™</h1>
                <span>Free Chat Rooms Since 1997</span>
              </div>
              <h2>Password Reset Request 🔐</h2>
              <p>We received a request to reset your password. Click the button below to choose a new password:</p>
              <div style="text-align: center;">
                <a href="${confirmUrl}" class="button">Reset Password</a>
              </div>
              <p style="font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="font-size: 12px; word-break: break-all; color: #58a6ff;">${confirmUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <div class="footer">
                <p>If you didn't request a password reset, you can safely ignore this email.</p>
                <p>© ${new Date().getFullYear()} Justachat™ - All rights reserved</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "magiclink":
      return {
        subject: "Your Justachat™ magic link",
        html: `
          <!DOCTYPE html>
          <html>
          <head><style>${baseStyles}</style></head>
          <body>
            <div class="container">
              <div class="logo">
                <h1>Justachat™</h1>
                <span>Free Chat Rooms Since 1997</span>
              </div>
              <h2>Magic Link Login ✨</h2>
              <p>Click the button below to log in to your Justachat™ account:</p>
              <div style="text-align: center;">
                <a href="${confirmUrl}" class="button">Log In to Justachat™</a>
              </div>
              <p style="font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="font-size: 12px; word-break: break-all; color: #58a6ff;">${confirmUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <div class="footer">
                <p>If you didn't request this link, you can safely ignore this email.</p>
                <p>© ${new Date().getFullYear()} Justachat™ - All rights reserved</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "email_change":
      return {
        subject: "Confirm your new email for Justachat™",
        html: `
          <!DOCTYPE html>
          <html>
          <head><style>${baseStyles}</style></head>
          <body>
            <div class="container">
              <div class="logo">
                <h1>Justachat™</h1>
                <span>Free Chat Rooms Since 1997</span>
              </div>
              <h2>Email Change Request 📧</h2>
              <p>Please confirm your new email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${confirmUrl}" class="button">Confirm New Email</a>
              </div>
              <p style="font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="font-size: 12px; word-break: break-all; color: #58a6ff;">${confirmUrl}</p>
              <div class="footer">
                <p>If you didn't request an email change, please contact support immediately.</p>
                <p>© ${new Date().getFullYear()} Justachat™ - All rights reserved</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    default:
      return {
        subject: "Justachat™ - Email Verification",
        html: `
          <!DOCTYPE html>
          <html>
          <head><style>${baseStyles}</style></head>
          <body>
            <div class="container">
              <div class="logo">
                <h1>Justachat™</h1>
                <span>Free Chat Rooms Since 1997</span>
              </div>
              <h2>Verify Your Email</h2>
              <p>Please click the button below to complete your request:</p>
              <div style="text-align: center;">
                <a href="${confirmUrl}" class="button">Verify Email</a>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Justachat™ - All rights reserved</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };
  }
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AuthEmailPayload = await req.json();
    
    console.log("Auth email request received:", {
      email: payload.user?.email,
      type: payload.email_data?.email_action_type,
    });

    const { user, email_data } = payload;
    
    if (!user?.email || !email_data) {
      throw new Error("Missing required email data");
    }

    const { token_hash, redirect_to, email_action_type, site_url } = email_data;
    
    // Build the confirmation URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || site_url;
    const confirmUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to || "https://justachat.net"}`;
    
    const username = user.user_metadata?.username || "";
    const emailContent = getEmailContent(email_action_type, confirmUrl, username);

    console.log("Sending email via Resend:", {
      to: user.email,
      subject: emailContent.subject,
      type: email_action_type,
    });

    const { data, error } = await resend.emails.send({
      from: "Justachat™ <noreply@justachat.net>",
      to: [user.email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-auth-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
