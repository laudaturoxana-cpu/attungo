import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
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
    });

    if (!res.ok) {
      // Fallback: direct Gemini call if backend unavailable
      return fallbackGemini(body);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // Backend not available — use direct Gemini
    return fallbackGemini(body);
  }
}

async function fallbackGemini(body: Record<string, unknown>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: getDefaultAttoMessage(body) });
  }

  try {
    const lang = body.language as string ?? "ro";
    const childName = body.childName as string ?? "Copilul";
    const subject = body.subject as string ?? "";
    const grade = body.grade as number ?? 5;

    const systemPrompt = buildSimpleAttoPrompt(childName, grade, lang, subject);
    const history = (body.conversationHistory as Array<{ role: string; content: string }>) ?? [];

    const contents = [
      ...history.map((m) => ({
        role: m.role === "model" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    ];

    if (body.type === "message") {
      contents.push({ role: "user", parts: [{ text: body.message as string }] });
    }

    const geminiBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: contents.length > 0 ? contents : [{
        role: "user",
        parts: [{ text: lang === "ro" ? "Salut Atto!" : "Hi Atto!" }],
      }],
      generationConfig: { maxOutputTokens: 300, temperature: 0.8 },
    };

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      }
    );

    if (!geminiRes.ok) {
      return NextResponse.json({ message: getDefaultAttoMessage(body) });
    }

    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? getDefaultAttoMessage(body);

    return NextResponse.json({
      message: text,
      detected_state: { energy: "medium", frustration: 0.2, engagement: 0.7 },
      concepts_mastered: [],
    });
  } catch {
    return NextResponse.json({ message: getDefaultAttoMessage(body) });
  }
}

function buildSimpleAttoPrompt(name: string, grade: number, lang: string, subject: string): string {
  if (lang === "ro") {
    return `Tu ești Atto — licuriciul tutore al Attungo. Ești cald, curios, răbdător.
Copilul se numește ${name}, este în clasa ${grade} și studiem ${subject}.
REGULA ABSOLUTĂ: Nu dai niciodată răspunsul direct. Pui întrebări care duc copilul să îl găsească singur.
INTERZIS: "greșit", "nu știi", "simplu", "ușor".
Mesajele tale sunt scurte (max 3 propoziții), calde, pline de curiozitate.
Conectezi mereu lecția cu pasiunile copilului (Minecraft, sport, muzică).`;
  }
  return `You are Atto — the firefly tutor of Attungo. You are warm, curious, patient.
The child's name is ${name}, they are in grade ${grade} and we're studying ${subject}.
ABSOLUTE RULE: You never give the answer directly. You ask questions that lead the child to find it themselves.
FORBIDDEN: "wrong", "you don't know", "simple", "easy".
Your messages are short (max 3 sentences), warm, full of curiosity.
You always connect the lesson to the child's passions (Minecraft, sport, music).`;
}

function getDefaultAttoMessage(body: Record<string, unknown>): string {
  const lang = body.language as string ?? "ro";
  if (body.type === "start_session") {
    return lang === "ro"
      ? "Bună! Sunt Atto. Înainte să începem — spune-mi un lucru la care ești deja bun. Orice!"
      : "Hi! I'm Atto. Before we start — tell me one thing you're already good at. Anything!";
  }
  return lang === "ro"
    ? "Interesant! Și dacă ar fi să explici asta unui prieten, cum ai spune?"
    : "Interesting! If you were to explain this to a friend, how would you say it?";
}
