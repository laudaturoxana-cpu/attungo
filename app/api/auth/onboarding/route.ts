import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId, child, profile } = await req.json();

  if (!userId || !child) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check subscription limit
  const { data: parent } = await admin
    .from("parents")
    .select("subscription_plan")
    .eq("id", userId)
    .single();

  const PLAN_LIMITS: Record<string, number> = {
    trial: 1, essential: 1, family: 3, annual: 1, cancelled: 0,
  };
  const plan = parent?.subscription_plan ?? "trial";
  const limit = PLAN_LIMITS[plan] ?? 1;

  const { count } = await admin
    .from("children")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", userId)
    .eq("is_active", true);

  if ((count ?? 0) >= limit) {
    const msg = plan === "cancelled"
      ? "Abonamentul tău a expirat. Activează un plan din Setări."
      : `Planul tău permite maximum ${limit} ${limit === 1 ? "copil" : "copii"}.`;
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  // Insert child
  const { data: newChild, error: childError } = await admin
    .from("children")
    .insert({
      parent_id: userId,
      name: child.name,
      age: child.age,
      grade: child.grade,
      curriculum_type: child.curriculum_type,
      session_language: child.session_language,
      atto_color: "#E8A020",
      atto_name: "Atto",
      is_active: true,
    })
    .select("id")
    .single();

  if (childError || !newChild) {
    console.error("[onboarding] children insert failed:", childError);
    return NextResponse.json({ error: "Eroare la salvare copil." }, { status: 500 });
  }

  // Update child_profiles (auto-created by DB trigger on children insert)
  if (profile) {
    const { error: profileError } = await admin
      .from("child_profiles")
      .update(profile)
      .eq("child_id", newChild.id);

    if (profileError) {
      console.error("[onboarding] child_profiles update failed:", profileError);
      // Non-fatal — child was created, profile will be updated on next session
    }
  }

  return NextResponse.json({ childId: newChild.id });
}
