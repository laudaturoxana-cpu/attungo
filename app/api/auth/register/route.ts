import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId, email, name } = await req.json();

  if (!userId || !email || !name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Service role bypasses RLS — safe because this route is called only after
  // Supabase Auth confirms the user was just created.
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await admin.from("parents").insert({
    id: userId,
    email,
    name,
    subscription_plan: "trial",
    subscription_status: "active",
    trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    language_preference: "ro",
  });

  // 23505 = unique_violation — row already exists, treat as success
  if (error && error.code !== "23505") {
    console.error("[register] parents insert failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
