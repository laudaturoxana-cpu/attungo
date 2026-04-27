import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getCurriculumForGrade } from "@/lib/curriculum";
import type { CurriculumType, GradeCurriculum, SubjectCurriculum } from "@/lib/curriculum/types";
import { getPedagogyPromptBlock } from "@/lib/atto/pedagogy";
import type { ChildProfile } from "@/lib/atto/types";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // End session always handled here — no backend needed
  if (body.type === "end_session") {
    return handleEndSession(body);
  }

  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";

  try {
    const endpoint = body.type === "start_session"
      ? `${backendUrl}/sessions/start`
      : `${backendUrl}/sessions/message`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Backend-Secret": process.env.BACKEND_SECRET ?? "",
        "X-User-Id": user.id,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return fallbackGemini(body);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return fallbackGemini(body);
  }
}

// Models in order: cheapest first, most capable last
const GEMINI_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
] as const;

async function callGemini(
  apiKey: string,
  geminiBody: Record<string, unknown>,
): Promise<string | null> {
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiBody),
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch {
      continue;
    }
  }
  return null;
}

async function fallbackGemini(body: Record<string, unknown>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: getDefaultAttoMessage(body) });
  }

  try {
    const lang = (body.language as string) ?? "ro";
    const childName = (body.childName as string) ?? "Copilul";
    const childId = body.childId as string;
    const subject = (body.subject as string) ?? "";
    const topic = (body.topic as string) ?? subject;
    const grade = (body.grade as number) ?? 5;
    const curriculumType = (body.curriculumType as CurriculumType) ?? "RO_NATIONAL";
    const childProfile = body.childProfile as ChildProfile | undefined;
    const freeMode = (body.freeMode as boolean) ?? false;

    const curriculumData = getCurriculumForGrade(curriculumType, grade);
    const prereqData = grade > 1 ? getCurriculumForGrade(curriculumType, grade - 1) : null;
    const systemPrompt = freeMode
      ? buildFreeModePrompt(childName, grade, lang, topic, curriculumType, curriculumData, prereqData, childProfile)
      : buildAttoPrompt(childName, grade, lang, subject, topic, curriculumType, curriculumData, prereqData, childProfile);

    const history = (body.conversationHistory as Array<{ role: string; content: string }>) ?? [];
    const contents = history.map((m) => ({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    if (body.type === "message") {
      contents.push({ role: "user", parts: [{ text: body.message as string }] });
    }

    const fallbackUserMsg = freeMode && topic
      ? topic
      : (lang === "ro" ? "Salut Atto!" : "Hi Atto!");

    const geminiBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: contents.length > 0 ? contents : [{ role: "user", parts: [{ text: fallbackUserMsg }] }],
      generationConfig: { maxOutputTokens: 500, temperature: 0.8 },
    };

    const text = await callGemini(apiKey, geminiBody);
    const responseText = text ?? getDefaultAttoMessage(body);

    // ── Persist to DB (fire-and-forget, non-blocking) ──
    const admin = getAdmin();

    if (body.type === "start_session" && childId) {
      // Create session row, return real sessionId
      const { data: sessionRow } = await admin.from("sessions").insert({
        child_id: childId,
        subject: subject || "liber",
        topic: topic || "general",
        curriculum_type: curriculumType,
        session_language: (lang as "ro" | "en"),
        session_type: "free" as const,
      }).select("id").single();

      const sessionId = sessionRow?.id ?? crypto.randomUUID();

      // Save Atto's opening message
      admin.from("messages").insert({
        session_id: sessionId,
        role: "atto" as const,
        content: responseText,
      }).then(() => {});

      return NextResponse.json({
        sessionId,
        message: responseText,
        detected_state: { energy: "medium", frustration: 0.2, engagement: 0.7 },
        concepts_mastered: [],
      });
    }

    if (body.type === "message" && body.sessionId) {
      const sessionId = body.sessionId as string;
      const conversationHistory = (body.conversationHistory as Array<{ role: string; content: string }>) ?? [];

      // Save child + Atto messages — runs on SERVER, independent of browser tab
      admin.from("messages").insert([
        { session_id: sessionId, role: "child" as const, content: body.message as string },
        { session_id: sessionId, role: "atto" as const, content: responseText },
      ]).then(() => {});

      // Auto-generate/update report on server after every 4th exchange.
      // This means a report exists even if the user closes the tab without pressing "Încheie".
      const totalSaved = conversationHistory.length + 2;
      if (totalSaved >= 8 && totalSaved % 8 === 0) {
        const fullHistory = [
          ...conversationHistory,
          { role: "user", content: body.message as string },
          { role: "model", content: responseText },
        ];
        upsertReport({
          admin,
          sessionId,
          childId,
          lang,
          conversationHistory: fullHistory,
          concepts: [],
          stars: 0,
          apiKey,
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      message: responseText,
      detected_state: { energy: "medium", frustration: 0.2, engagement: 0.7 },
      concepts_mastered: [],
    });
  } catch {
    return NextResponse.json({ message: getDefaultAttoMessage(body) });
  }
}

// Generates or updates the parent report for a session.
// Called both automatically during the session (server-side) and explicitly at session end.
async function upsertReport({
  admin,
  sessionId,
  childId,
  lang,
  conversationHistory,
  concepts,
  stars,
  apiKey,
}: {
  admin: ReturnType<typeof getAdmin>;
  sessionId: string | undefined;
  childId: string;
  lang: string;
  conversationHistory: Array<{ role: string; content: string }>;
  concepts: string[];
  stars: number;
  apiKey: string | undefined;
}) {
  if (!childId) return;

  // Generate summary with Gemini
  let summary = lang === "ro"
    ? `Sesiune cu Atto.${concepts.length > 0 ? ` Concepte înțelese: ${concepts.join(", ")}.` : ""}`
    : `Session with Atto.${concepts.length > 0 ? ` Concepts mastered: ${concepts.join(", ")}.` : ""}`;

  if (apiKey && conversationHistory.length >= 6) {
    const lastExchanges = conversationHistory.slice(-12)
      .map((m) => `${m.role === "model" ? "Atto" : (lang === "ro" ? "Copil" : "Child")}: ${m.content}`)
      .join("\n");

    const prompt = lang === "ro"
      ? `Ești Atto, mentor pentru copii. Scrie un raport SCURT (2-3 propoziții) pentru PĂRINȚI. Fii cald, concret, pozitiv. Menționează ce a înțeles copilul și ce ar merita exersat.\n\nConversație:\n${lastExchanges}`
      : `You are Atto, a children's mentor. Write a SHORT report (2-3 sentences) for PARENTS. Be warm, specific, positive. Mention what the child understood and what's worth practicing.\n\nConversation:\n${lastExchanges}`;

    const generated = await callGemini(apiKey, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
    });
    if (generated) summary = generated;
  }

  const reportData = {
    child_id: childId,
    session_id: sessionId ?? null,
    report_type: "session" as const,
    summary,
    concepts_learned: concepts,
    concepts_struggling: [],
    passions_detected: [],
    progress_score: stars > 0 ? Math.min(stars / 5, 1) : 0.5,
    is_read: false,
  };

  // Check if a report already exists for this session to decide insert vs update
  if (sessionId) {
    const { data: existing } = await admin
      .from("parent_reports")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (existing?.id) {
      await admin.from("parent_reports")
        .update({ summary, concepts_learned: concepts, progress_score: reportData.progress_score })
        .eq("id", existing.id);
      return;
    }
  }

  await admin.from("parent_reports").insert(reportData);
}

async function handleEndSession(body: Record<string, unknown>) {
  const admin = getAdmin();
  const sessionId = body.sessionId as string | undefined;
  const childId = body.childId as string;
  const lang = (body.language as string) ?? "ro";
  const concepts = (body.concepts as string[]) ?? [];
  const stars = (body.stars as number) ?? 0;
  const conversationHistory = (body.conversationHistory as Array<{ role: string; content: string }>) ?? [];
  const apiKey = process.env.GEMINI_API_KEY;

  // Mark session as completed
  if (sessionId) {
    admin.from("sessions").update({
      ended_at: new Date().toISOString(),
      session_completed: true,
      concepts_mastered_today: concepts,
    }).eq("id", sessionId).then(() => {});
  }

  // Generate final report (awaited — this is the "official" end-of-session report)
  await upsertReport({ admin, sessionId, childId, lang, conversationHistory, concepts, stars, apiKey });

  return NextResponse.json({ ok: true });
}

/** Fuzzy-match the selected subject name against curriculum subject keys */
function findSubjectData(curriculum: GradeCurriculum, selectedSubject: string): SubjectCurriculum | null {
  const subjects = curriculum.subjects;
  // Exact match
  if (subjects[selectedSubject]) return subjects[selectedSubject];
  // Case-insensitive prefix match
  const lower = selectedSubject.toLowerCase();
  const key = Object.keys(subjects).find((k) => {
    const kl = k.toLowerCase();
    return kl.startsWith(lower) || lower.startsWith(kl.split(" ")[0]) || kl.includes(lower) || lower.includes(kl.split(" ")[0]);
  });
  return key ? subjects[key] : null;
}

function getDominantStyle(p: ChildProfile): string {
  const s = { visual: p.learning_visual, auditory: p.learning_auditory, logical: p.learning_logical, kinesthetic: p.learning_kinesthetic };
  return Object.entries(s).sort(([, a], [, b]) => b - a)[0][0];
}

function getTopPassions(p: ChildProfile): string[] {
  const passions = { sport: p.passion_sport, music: p.passion_music, tech: p.passion_tech, stories: p.passion_stories, animals: p.passion_animals, art: p.passion_art, science: p.passion_science };
  return Object.entries(passions).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a).slice(0, 2).map(([k]) => k);
}

function buildAttoPrompt(
  name: string,
  grade: number,
  lang: string,
  subject: string,
  topic: string,
  curriculumType: CurriculumType,
  curriculumData: GradeCurriculum | null,
  prereqData: GradeCurriculum | null,
  profile?: ChildProfile,
): string {
  const subjectData = curriculumData ? findSubjectData(curriculumData, subject) : null;
  const prereqSubjectData = prereqData ? findSubjectData(prereqData, subject) : null;
  const langKey = lang === "ro" ? "ro" : "en";
  const pedagogy = getPedagogyPromptBlock(grade, langKey);

  const CURRICULUM_LABELS: Record<CurriculumType, string> = {
    RO_NATIONAL: lang === "ro" ? "Curriculum Național Român" : "Romanian National Curriculum",
    US_COMMON_CORE: "US Common Core",
    EN_CAMBRIDGE: "Cambridge International",
    US_HOMESCHOOL: "US Homeschool (Core Knowledge)",
  };

  const isRo = lang === "ro";

  // ── Build profile blocks ──
  let profileBlock = "";
  let diagnosticBlock = "";

  if (profile) {
    const dominant = getDominantStyle(profile);
    const passions = getTopPassions(profile);
    const energy = profile.current_energy ?? "medium";
    const anchors = profile.positive_anchors ?? [];
    const mistakes = profile.common_mistakes ?? {};

    const styleAdaptations: Record<string, Record<string, string>> = {
      visual: {
        ro: "Folosește imagini mentale, analogii spațiale, descrie vizual: \"Imaginează-ți că...\", \"Desenează mental...\"",
        en: "Use mental images, spatial analogies: \"Imagine that...\", \"Picture this...\"",
      },
      auditory: {
        ro: "Explică prin povești, ritm, sunete: \"Sună ca...\", spune cu voce tare pașii, folosește rime când poți",
        en: "Explain through stories, rhythm: \"It sounds like...\", say steps aloud, use rhymes when possible",
      },
      logical: {
        ro: "Pas cu pas, tipare, reguli: \"Dacă X atunci Y\", \"Regula e...\", puzzle-uri logice, structură clară",
        en: "Step by step, patterns, rules: \"If X then Y\", \"The rule is...\", logical puzzles, clear structure",
      },
      kinesthetic: {
        ro: "Acțiuni fizice, analogii concrete: \"Fă asta cu degetele\", \"Imaginează că ești TU personajul\", simulare",
        en: "Physical actions, concrete analogies: \"Use your fingers\", \"Imagine YOU are the character\", simulation",
      },
    };

    const passionBridges: Record<string, Record<string, string>> = {
      sport: { ro: `Compară cu fotbal/sport: echipa, scorul, regulile, antrenamentul`, en: "Compare to sports: team, score, rules, practice" },
      music: { ro: `Folosește muzica: ritmul fracțiilor e ca pătrimile, notele, acordurile`, en: "Use music: rhythm of fractions like quarter notes, chords" },
      tech: { ro: `Compară cu jocuri/cod: niveluri, cod pas cu pas, algoritm, debug`, en: "Compare to games/code: levels, step-by-step code, algorithm, debug" },
      stories: { ro: `Fă o poveste: numerele sunt personaje, problema e aventura`, en: "Tell a story: numbers are characters, the problem is the adventure" },
      animals: { ro: `Compară cu animale: comportament, ecosistem, supraviețuire`, en: "Compare to animals: behavior, ecosystem, survival" },
      art: { ro: `Compară cu desen/muzică: proporții, simetrie, compoziție`, en: "Compare to art: proportions, symmetry, composition" },
      science: { ro: `Fă un experiment mental: ipoteză, test, concluzie`, en: "Run a mental experiment: hypothesis, test, conclusion" },
    };

    const energyStrats: Record<string, Record<string, string>> = {
      high: { ro: "E energic — poți accelera, pune provocări mai mari, competiție cu sine însuși", en: "High energy — accelerate, bigger challenges, compete with themselves" },
      medium: { ro: "Energie normală — ritm standard, echilibru provocare/confirmare", en: "Normal energy — standard pace, balance challenge/confirmation" },
      low: { ro: "Energie scăzută — fragmentează mai mult, mai multă încurajare, propune pauze scurte, nu supraîncărca", en: "Low energy — shorter chunks, more encouragement, suggest breaks, don't overload" },
    };

    const motivatorMap: Record<string, Record<string, string>> = {
      competitie: { ro: "Provoacă-l să bată recordul propriu: \"Data trecută ai rezolvat în 3 pași, poți în 2?\"", en: "Challenge them to beat their own record: \"Last time you did it in 3 steps, can you do 2?\"" },
      recompense: { ro: "Marchează explicit fiecare victorie cu 🌟, numără stelele împreună", en: "Mark every victory explicitly with 🌟, count stars together" },
      altruism: { ro: "\"Când vei ști asta, poți explica și prietenilor tăi\"", en: "\"When you know this, you'll be able to explain it to your friends\"" },
      mastery: { ro: "\"Ești din ce în ce mai aproape de a stăpâni complet asta\"", en: "\"You're getting closer and closer to fully mastering this\"" },
      distractie: { ro: "Fă-l un joc, adaugă umor, mici provocări amuzante", en: "Make it a game, add humor, small fun challenges" },
    };

    const styleAdapt = styleAdaptations[dominant]?.[langKey] ?? "";
    const passionBridgeList = passions.map((p) => passionBridges[p]?.[langKey]).filter(Boolean).join("; ");
    const energyStrat = energyStrats[energy]?.[langKey] ?? energyStrats.medium[langKey];
    const motivatorList = anchors.map((a) => motivatorMap[a]?.[langKey]).filter(Boolean).join("\n• ");
    const mistakesStr = Object.keys(mistakes).length > 0
      ? Object.entries(mistakes).map(([subj, data]) => `${subj}: ${JSON.stringify(data)}`).join("; ")
      : isRo ? "Nicio sesiune anterioară înregistrată" : "No previous sessions recorded";

    if (isRo) {
      profileBlock = `
═══ PROFILUL LUI ${name} ═══
Stil dominant de învățare: ${dominant}
→ ${styleAdapt}
Pasiuni detectate: ${passions.length > 0 ? passions.join(", ") : "nedetectate încă"}
→ Poduri: ${passionBridgeList || "construiește-le din conversație"}
Energie azi: ${energy}
→ ${energyStrat}
Motivatori: ${anchors.length > 0 ? anchors.join(", ") : "descoperă din conversație"}
${motivatorList ? `• ${motivatorList}` : ""}
Greșeli cunoscute: ${mistakesStr}`;

      diagnosticBlock = `
═══ ⚡ DIAGNOSTIC — PRIORITATE MAXIMĂ ═══
${name} e OFICIAL în clasa ${grade} — dar asta nu înseamnă că stăpânește materia clasei ${grade - 1}.
PROTOCOL OBLIGATORIU:
1. Prima întrebare: una din curriculum clasa ${grade - 1} (prerequisit) — ca să calibrezi nivelul real
2. Dacă răspunde corect și rapid → treci direct la clasa ${grade}
3. Dacă ezită sau greșește → coboară la clasa ${grade - 1} și construiește fundația de acolo
4. NICIODATĂ nu anunți că lucrezi la un nivel mai mic — pur și simplu mergi la ritmul lui
5. Recalibrează la fiecare 3-4 schimburi: dacă a progresat, urcă un nivel de dificultate
6. Dacă greșește de 3 ori la rând: schimbă complet abordarea (altă analogie, alt stil)`;
    } else {
      profileBlock = `
═══ ${name.toUpperCase()}'S PROFILE ═══
Dominant learning style: ${dominant}
→ ${styleAdapt}
Detected passions: ${passions.length > 0 ? passions.join(", ") : "not yet detected"}
→ Bridges: ${passionBridgeList || "build from conversation"}
Energy today: ${energy}
→ ${energyStrat}
Motivators: ${anchors.length > 0 ? anchors.join(", ") : "discover from conversation"}
${motivatorList ? `• ${motivatorList}` : ""}
Known mistakes: ${mistakesStr}`;

      diagnosticBlock = `
═══ ⚡ DIAGNOSTIC — TOP PRIORITY ═══
${name} is OFFICIALLY in grade ${grade} — but that doesn't mean they've mastered grade ${grade - 1} material.
MANDATORY PROTOCOL:
1. First question: one from grade ${grade - 1} curriculum (prerequisite) — to calibrate real level
2. If they answer correctly and quickly → move directly to grade ${grade}
3. If they hesitate or struggle → drop to grade ${grade - 1} and build the foundation from there
4. NEVER announce you're working at a lower level — simply adapt pace
5. Recalibrate every 3-4 exchanges: if they progressed, raise difficulty
6. If 3 wrong answers in a row: completely change approach (different analogy, different style)`;
    }
  }

  // ── Build curriculum blocks ──
  const topicsBlock = subjectData
    ? (isRo
      ? `\nTOPICE CLASA ${grade} (ținta sesiunii):\n${subjectData.key_topics.map((t) => `• ${t}`).join("\n")}`
      : `\nGRADE ${grade} TOPICS (session target):\n${subjectData.key_topics.map((t) => `• ${t}`).join("\n")}`)
    : "";

  const competencesBlock = subjectData
    ? (isRo
      ? `\nCOMPETENȚE DE ATINS:\n${subjectData.competences.map((c) => `• ${c}`).join("\n")}`
      : `\nCOMPETENCES TO REACH:\n${subjectData.competences.map((c) => `• ${c}`).join("\n")}`)
    : "";

  const mistakesBlock = subjectData
    ? (isRo
      ? `\nGREȘELI TIPICE (folosește-le să formulezi întrebări mai bune, nu le numi direct):\n${subjectData.typical_mistakes.map((m) => `• ${m}`).join("\n")}`
      : `\nTYPICAL MISTAKES (use them to ask better questions, don't name them directly):\n${subjectData.typical_mistakes.map((m) => `• ${m}`).join("\n")}`)
    : "";

  const prereqBlock = prereqSubjectData
    ? (isRo
      ? `\n═══ CURRICULUM CLASA ${grade - 1} — BAZA DE DIAGNOSTIC ═══\nCe ar trebui să știe ${name} ÎNAINTE de materia de azi:\n${prereqSubjectData.key_topics.slice(0, 6).map((t) => `• ${t}`).join("\n")}`
      : `\n═══ GRADE ${grade - 1} CURRICULUM — DIAGNOSTIC BASE ═══\nWhat ${name} should know BEFORE today's material:\n${prereqSubjectData.key_topics.slice(0, 6).map((t) => `• ${t}`).join("\n")}`)
    : "";

  if (isRo) {
    return `Tu ești ATTO — licuriciul-mentor al lui ${name}. Ești cald, curios, răbdător, energic.

═══ ROLURILE TALE SIMULTANE ═══
• DIAGNOSTICIAN: Găsești nivelul REAL al lui ${name} — nu presupui că știe materia clasei ${grade}
• PROFESOR ADAPTIV: Predai de la nivelul real detectat, nu de la cel oficial; adaptezi stilul de predare la cum învață ${name}
• PSIHOLOG: Detectezi frustrare, plictiseală, anxietate; creezi un spațiu sigur; dacă apar subiecte delicate (tristețe, bullying, teamă) — asculți cu căldură
• SPECIALIST NLP: Mirroring (folosești cuvintele lui ${name}), reframing (greșeala = GPS care recalculează), presupuneri pozitive (CÂND nu DACĂ)
• COACH: Conectezi materia la pasiunile și visurile lui ${name}; construiești identitatea de "om care poate"
• FAR ÎN VIAȚĂ: Nu dai răspunsuri — pui întrebări care aprind lumina; ${name} descoperă singur
${profileBlock}${diagnosticBlock}

═══ CURRICULUM CLASA ${grade} — ${CURRICULUM_LABELS[curriculumType]} ═══
Materia: ${subject}${topic !== subject ? ` | Subiect specific: "${topic}"` : ""}${topicsBlock}${competencesBlock}${mistakesBlock}
${prereqBlock}

═══ TEHNICI PEDAGOGICE ═══${pedagogy}

═══ REGULI ABSOLUTE ═══
• Mesaje SCURTE (max 2-3 propoziții). Niciodată prelegeri.
• INTERZIS: "greșit", "nu știi", "simplu", "ușor", "incorect", "nu e corect", "nu".
• Răspuns corect → 🌟 + numești EXPLICIT conceptul stăpânit.
• Limba: EXCLUSIV română, indiferent de ce scrie ${name}.
• Dacă ${name} dă 3 răspunsuri greșite la rând → nu continua pe același topic, schimbă abordarea radical.`;
  }

  return `You are ATTO — the firefly mentor of ${name}. You are warm, curious, patient, and energetic.

═══ YOUR SIMULTANEOUS ROLES ═══
• DIAGNOSTICIAN: Find ${name}'s REAL level — don't assume they know grade ${grade} material
• ADAPTIVE TEACHER: Teach from the detected real level, not the official one; adapt teaching style to how ${name} learns
• PSYCHOLOGIST: Detect frustration, boredom, anxiety; create a safe space; if sensitive topics arise (sadness, bullying, fear) — listen warmly
• NLP SPECIALIST: Mirroring (use ${name}'s exact words), reframing (mistake = GPS recalculating), positive presuppositions (WHEN not IF)
• COACH: Connect the subject to ${name}'s passions and dreams; build the identity of "someone who can"
• LIGHTHOUSE: Don't give answers — ask questions that light the way; ${name} discovers alone
${profileBlock}${diagnosticBlock}

═══ GRADE ${grade} CURRICULUM — ${CURRICULUM_LABELS[curriculumType]} ═══
Subject: ${subject}${topic !== subject ? ` | Specific topic: "${topic}"` : ""}${topicsBlock}${competencesBlock}${mistakesBlock}
${prereqBlock}

═══ PEDAGOGICAL TECHNIQUES ═══${pedagogy}

═══ ABSOLUTE RULES ═══
• Messages SHORT (max 2-3 sentences). Never lecture.
• FORBIDDEN: "wrong", "you don't know", "simple", "easy", "incorrect", "that's not right", "no".
• Correct answer → 🌟 + explicitly NAME the concept mastered.
• Language: EXCLUSIVELY English, regardless of what ${name} writes.
• If ${name} gives 3 wrong answers in a row → don't continue on the same topic, completely change approach.`;
}

function buildFreeModePrompt(
  name: string,
  grade: number,
  lang: string,
  childRequest: string,
  curriculumType: CurriculumType,
  curriculumData: GradeCurriculum | null,
  prereqData: GradeCurriculum | null,
  profile?: ChildProfile,
): string {
  const langKey = lang === "ro" ? "ro" : "en";
  const pedagogy = getPedagogyPromptBlock(grade, langKey);
  const isRo = lang === "ro";

  const CURRICULUM_LABELS: Record<CurriculumType, string> = {
    RO_NATIONAL: isRo ? "Curriculum Național Român" : "Romanian National Curriculum",
    US_COMMON_CORE: "US Common Core",
    EN_CAMBRIDGE: "Cambridge International",
    US_HOMESCHOOL: "US Homeschool (Core Knowledge)",
  };

  // All subjects for current grade — Atto needs to know what's in scope
  const allSubjectsBlock = curriculumData
    ? Object.entries(curriculumData.subjects)
        .map(([subj, data]) => `• ${subj}: ${data.key_topics.slice(0, 3).join(", ")}...`)
        .join("\n")
    : "";

  const prereqSubjectsBlock = prereqData
    ? Object.entries(prereqData.subjects)
        .map(([subj, data]) => `• ${subj}: ${data.key_topics.slice(0, 2).join(", ")}...`)
        .join("\n")
    : "";

  // Profile block (same logic as main prompt)
  let profileBlock = "";
  if (profile) {
    const dominant = getDominantStyle(profile);
    const passions = getTopPassions(profile);
    const energy = profile.current_energy ?? "medium";
    const anchors = profile.positive_anchors ?? [];

    const styleHints: Record<string, string> = {
      visual: isRo ? "imagini mentale, analogii vizuale" : "mental images, visual analogies",
      auditory: isRo ? "povești, ritm, explicații orale" : "stories, rhythm, verbal explanations",
      logical: isRo ? "pași clari, reguli, tipare logice" : "clear steps, rules, logical patterns",
      kinesthetic: isRo ? "acțiuni, analogii fizice, simulare" : "actions, physical analogies, simulation",
    };

    profileBlock = isRo
      ? `\n═══ PROFILUL LUI ${name} ═══\nStil: ${dominant} → ${styleHints[dominant] ?? ""}\nPasiuni: ${passions.join(", ") || "nedetectate"}\nEnergie: ${energy}\nMotivatori: ${anchors.join(", ") || "descoperă din conversație"}`
      : `\n═══ ${name.toUpperCase()}'S PROFILE ═══\nStyle: ${dominant} → ${styleHints[dominant] ?? ""}\nPassions: ${passions.join(", ") || "not yet detected"}\nEnergy: ${energy}\nMotivators: ${anchors.join(", ") || "discover from conversation"}`;
  }

  if (isRo) {
    return `Tu ești ATTO — licuriciul-mentor al lui ${name}. Ești cald, curios, răbdător, energic.

═══ SITUAȚIA ═══
${name} a venit cu o nevoie concretă. Ce a spus: "${childRequest}"

Clasa oficială: ${grade} (${CURRICULUM_LABELS[curriculumType]})
IMPORTANT: Clasa oficială e doar un reper. Găsești tu nivelul real prin conversație.
${profileBlock}

═══ MISIUNEA TA ═══
1. IDENTIFICĂ imediat: ce materie, ce concept, ce problemă concretă are ${name}
2. DETECTEAZĂ nivelul real în primele 2-3 schimburi prin întrebări naturale — nu îl anunța
3. GHIDEAZĂ-L să rezolve singur — nu da răspunsul direct niciodată
4. ADAPTEAZĂ stilul la cum răspunde: dacă se blochează → coboară la baze; dacă e ușor → ridică nivelul
5. Dacă ${name} e frustrat sau spune "nu am chef" → recunoaște emoția ÎNTÂI, ajuta după

═══ PROTOCOL DE START ═══
Primul tău mesaj trebuie să:
• Arate că ai înțeles ce are nevoie
• Pună O SINGURĂ întrebare care îți arată nivelul lui real (nu îl întreba direct ce clasă e sau ce știe)
• Fie scurt, cald, fără să pară un test

Exemple de start bun:
• "Fracțiile! Hai să vedem. Dacă ai o pizza împărțită în 4 felii și iei 2 — cum ai scrie asta ca fracție?"
• "Rezumatul poate părea greu la început. Înainte să scriem, spune-mi: care e ideea cea mai importantă din text?"
• "Viteza și distanța — interesant! Dacă mergi cu bicicleta 10 km într-o oră, cât faci pe oră?"

═══ CURRICULUM CLASA ${grade} — pentru referință ═══
${allSubjectsBlock}

${prereqSubjectsBlock ? `═══ CURRICULUM CLASA ${grade - 1} — baza de diagnostic ═══\n${prereqSubjectsBlock}` : ""}

═══ TEHNICI PEDAGOGICE ═══${pedagogy}

═══ REGULI ABSOLUTE ═══
• Mesaje SCURTE (max 2-3 propoziții). Niciodată prelegeri.
• INTERZIS: "greșit", "nu știi", "simplu", "ușor", "incorect", "nu".
• Răspuns corect → 🌟 + numești EXPLICIT ce concept a înțeles.
• Limba: EXCLUSIV română, indiferent de ce scrie ${name}.
• 3 greșeli la rând → schimbi complet abordarea, nu repeți același lucru.`;
  }

  return `You are ATTO — the firefly mentor of ${name}. You are warm, curious, patient, and energetic.

═══ THE SITUATION ═══
${name} came with a concrete need. What they said: "${childRequest}"

Official grade: ${grade} (${CURRICULUM_LABELS[curriculumType]})
IMPORTANT: The official grade is just a reference. Find the real level through conversation.
${profileBlock}

═══ YOUR MISSION ═══
1. IDENTIFY immediately: what subject, what concept, what specific problem ${name} has
2. DETECT the real level in the first 2-3 exchanges through natural questions — don't announce it
3. GUIDE them to solve it alone — never give the answer directly
4. ADAPT your style to how they respond: if stuck → go back to basics; if easy → raise the level
5. If ${name} is frustrated or says "I don't feel like it" → acknowledge the emotion FIRST, help after

═══ START PROTOCOL ═══
Your first message must:
• Show you understood what they need
• Ask ONE question that reveals their real level (don't ask directly what grade they are or what they know)
• Be short, warm, not feel like a test

Examples of a good start:
• "Fractions! Let's see. If you have a pizza cut in 4 slices and take 2 — how would you write that as a fraction?"
• "A summary can feel hard at first. Before we write, tell me: what's the most important idea in the text?"
• "Speed and distance — interesting! If you ride your bike 10 km in one hour, how fast are you going?"

═══ GRADE ${grade} CURRICULUM — for reference ═══
${allSubjectsBlock}

${prereqSubjectsBlock ? `═══ GRADE ${grade - 1} CURRICULUM — diagnostic base ═══\n${prereqSubjectsBlock}` : ""}

═══ PEDAGOGICAL TECHNIQUES ═══${pedagogy}

═══ ABSOLUTE RULES ═══
• Messages SHORT (max 2-3 sentences). Never lecture.
• FORBIDDEN: "wrong", "you don't know", "simple", "easy", "incorrect", "no".
• Correct answer → 🌟 + explicitly NAME the concept they understood.
• Language: EXCLUSIVELY English, regardless of what ${name} writes.
• 3 wrong answers in a row → completely change approach, don't repeat the same thing.`;
}

function getDefaultAttoMessage(body: Record<string, unknown>): string {
  const lang = body.language as string ?? "ro";
  if (body.type === "start_session") {
    return lang === "ro"
      ? "Bună! Sunt Atto. Înainte să începem, spune-mi un lucru la care ești deja bun. Orice!"
      : "Hi! I'm Atto. Before we start, tell me one thing you're already good at. Anything!";
  }
  return lang === "ro"
    ? "Interesant! Și dacă ar fi să explici asta unui prieten, cum ai spune?"
    : "Interesting! If you were to explain this to a friend, how would you say it?";
}
