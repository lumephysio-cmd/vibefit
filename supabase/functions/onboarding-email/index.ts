// Supabase Edge Function: onboarding-email
// Triggered manually or via a DB webhook on profiles INSERT
// Sends a Day 1 welcome email via Resend
// Set env vars: RESEND_API_KEY, FROM_EMAIL (e.g. hello@wellcrew.app)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "Wellcrew <hello@wellcrew.app>";

interface EmailPayload {
  to: string;
  name: string;
  day: 1 | 3 | 7;
}

const templates: Record<number, (name: string) => { subject: string; html: string }> = {
  1: (name) => ({
    subject: "Welcome to Wellcrew 🌿 — your first 2-minute check-in",
    html: `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#080810;color:#e8e8f0;border-radius:16px;">
        <div style="font-size:22px;font-weight:900;background:linear-gradient(90deg,#6EE7B7,#93C5FD);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:20px;">WELLCREW</div>
        <h1 style="font-size:22px;font-weight:800;margin-bottom:12px;">Hey ${name}, welcome aboard! 👋</h1>
        <p style="color:#aaa;line-height:1.7;margin-bottom:20px;">
          Your workplace wellness journey starts today — and it only takes 2 minutes a day.
        </p>
        <p style="color:#aaa;line-height:1.7;margin-bottom:8px;"><strong style="color:#e8e8f0;">Your first step:</strong> Complete today's Daily Check-In.</p>
        <ul style="color:#aaa;line-height:1.9;padding-left:20px;margin-bottom:24px;">
          <li>Rate your sleep, energy and mood (takes 60 seconds)</li>
          <li>Log your water intake</li>
          <li>See your Readiness Score — designed by Physio Brooke</li>
        </ul>
        <a href="https://vibefit-zeta.vercel.app" style="display:inline-block;background:linear-gradient(135deg,#6EE7B7,#93C5FD);color:#080810;font-weight:800;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">Do my check-in →</a>
        <p style="color:#555;font-size:12px;margin-top:32px;">You're receiving this because you joined Wellcrew. <a href="#" style="color:#6EE7B7;">Unsubscribe</a></p>
      </div>
    `,
  }),
  3: (name) => ({
    subject: "You're 3 days in — have you challenged your team yet? 🏆",
    html: `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#080810;color:#e8e8f0;border-radius:16px;">
        <div style="font-size:22px;font-weight:900;background:linear-gradient(90deg,#6EE7B7,#93C5FD);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:20px;">WELLCREW</div>
        <h1 style="font-size:22px;font-weight:800;margin-bottom:12px;">3 days in, ${name} 🎉</h1>
        <p style="color:#aaa;line-height:1.7;margin-bottom:20px;">
          The best part of Wellcrew isn't the habits — it's the team energy that builds around them.
        </p>
        <p style="color:#aaa;line-height:1.7;margin-bottom:8px;"><strong style="color:#e8e8f0;">This week, try:</strong></p>
        <ul style="color:#aaa;line-height:1.9;padding-left:20px;margin-bottom:24px;">
          <li>Check the <strong style="color:#e8e8f0;">Leaderboard</strong> — are you in the top 3?</li>
          <li>Give a teammate some <strong style="color:#e8e8f0;">Kudos</strong> in the Crew feed</li>
          <li>Log your first challenge and watch your team react</li>
        </ul>
        <a href="https://vibefit-zeta.vercel.app" style="display:inline-block;background:linear-gradient(135deg,#FCD34D,#6EE7B7);color:#080810;font-weight:800;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">See the leaderboard →</a>
        <p style="color:#555;font-size:12px;margin-top:32px;"><a href="#" style="color:#6EE7B7;">Unsubscribe</a></p>
      </div>
    `,
  }),
  7: (name) => ({
    subject: "Your first week on Wellcrew — here's how you did 📊",
    html: `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#080810;color:#e8e8f0;border-radius:16px;">
        <div style="font-size:22px;font-weight:900;background:linear-gradient(90deg,#6EE7B7,#93C5FD);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:20px;">WELLCREW</div>
        <h1 style="font-size:22px;font-weight:800;margin-bottom:12px;">One week done, ${name} 💪</h1>
        <p style="color:#aaa;line-height:1.7;margin-bottom:20px;">
          You've made it through your first week of workplace wellness. The habits that feel small now add up fast.
        </p>
        <p style="color:#aaa;line-height:1.7;margin-bottom:24px;">
          Head into the app to see your <strong style="color:#6EE7B7;">Readiness trend</strong>, your check-in streak, and how your team is tracking — it's all in the <strong style="color:#e8e8f0;">Me</strong> tab.
        </p>
        <a href="https://vibefit-zeta.vercel.app" style="display:inline-block;background:linear-gradient(135deg,#6EE7B7,#93C5FD);color:#080810;font-weight:800;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">See my week →</a>
        <p style="color:#555;font-size:12px;margin-top:32px;"><a href="#" style="color:#6EE7B7;">Unsubscribe</a></p>
      </div>
    `,
  }),
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload: EmailPayload = await req.json();
    const { to, name, day } = payload;

    if (!to || !name || !templates[day]) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const { subject, html } = templates[day](name);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data }), { status: res.status });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
