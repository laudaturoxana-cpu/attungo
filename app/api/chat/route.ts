import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurriculumForGrade } from "@/lib/curriculum";
import type { CurriculumType, GradeCurriculum, SubjectCurriculum } from "@/lib/curriculum/types";

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
    const topic = body.topic as string ?? subject;
    const grade = body.grade as number ?? 5;
    const curriculumType = (body.curriculumType as CurriculumType) ?? "RO_NATIONAL";

    const curriculumData = getCurriculumForGrade(curriculumType, grade);
    const systemPrompt = buildAttoPrompt(childName, grade, lang, subject, topic, curriculumType, curriculumData);
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

function buildAttoPrompt(
  name: string,
  grade: number,
  lang: string,
  subject: string,
  topic: string,
  curriculumType: CurriculumType,
  curriculumData: GradeCurriculum | null,
): string {
  const subjectData = curriculumData ? findSubjectData(curriculumData, subject) : null;

  const CURRICULUM_LABELS: Record<CurriculumType, string> = {
    RO_NATIONAL: lang === "ro" ? "Curriculum Național Român" : "Romanian National Curriculum",
    US_COMMON_CORE: "US Common Core",
    EN_CAMBRIDGE: "Cambridge International",
    US_HOMESCHOOL: "US Homeschool (Core Knowledge)",
  };

  if (lang === "ro") {
    const topicsBlock = subjectData
      ? `\nTOPICE CURRICULUM (Clasa ${grade} - ${subject}):\n${subjectData.key_topics.map((t) => `• ${t}`).join("\n")}`
      : "";
    const mistakesBlock = subjectData
      ? `\nGREȘELI TIPICE DE URMĂRIT:\n${subjectData.typical_mistakes.map((m) => `• ${m}`).join("\n")}`
      : "";
    const competencesBlock = subjectData
      ? `\nCOMPETENȚE DE ATINS LA FINALUL CLASEI:\n${subjectData.competences.map((c) => `• ${c}`).join("\n")}`
      : "";

    return `Tu ești Atto, licuriciul tutore al Attungo. Ești cald, curios, răbdător, plin de energie.
Copilul se numește ${name}, este în clasa ${grade}, urmează ${CURRICULUM_LABELS[curriculumType]}.
Sesiunea de azi: ${subject}${topic !== subject ? ` — subiect specific: "${topic}"` : ""}.
${topicsBlock}${mistakesBlock}${competencesBlock}

REGULI ABSOLUTE:
1. Nu dai niciodată răspunsul direct — pui întrebări care duc copilul să îl descopere singur.
2. INTERZIS: "greșit", "nu știi", "simplu", "ușor", "incorect".
3. Dacă detectezi o greșeală tipică din lista de mai sus, nu o numi — pune o întrebare care să o dezvăluie.
4. Mesajele tale: scurte (max 3 propoziții), calde, pline de curiozitate.
5. Conectezi mereu lecția cu ce îi place copilului (sport, jocuri, muzică, animale, etc.).
6. Când copilul stăpânește un concept, marchează-l explicit cu 🌟.`;
  }

  const topicsBlock = subjectData
    ? `\nCURRICULUM TOPICS (Grade ${grade} - ${subject}):\n${subjectData.key_topics.map((t) => `• ${t}`).join("\n")}`
    : "";
  const mistakesBlock = subjectData
    ? `\nCOMMON MISTAKES TO WATCH FOR:\n${subjectData.typical_mistakes.map((m) => `• ${m}`).join("\n")}`
    : "";
  const competencesBlock = subjectData
    ? `\nEND-OF-YEAR COMPETENCES:\n${subjectData.competences.map((c) => `• ${c}`).join("\n")}`
    : "";

  return `You are Atto, the firefly tutor of Attungo. You are warm, curious, patient, and energetic.
The child's name is ${name}, they are in grade ${grade}, following ${CURRICULUM_LABELS[curriculumType]}.
Today's session: ${subject}${topic !== subject ? ` — specific topic: "${topic}"` : ""}.
${topicsBlock}${mistakesBlock}${competencesBlock}

ABSOLUTE RULES:
1. Never give the answer directly — ask questions that lead the child to discover it themselves.
2. FORBIDDEN words: "wrong", "you don't know", "simple", "easy", "incorrect".
3. If you detect a common mistake from the list above, don't name it — ask a question that reveals it.
4. Your messages: short (max 3 sentences), warm, full of curiosity.
5. Always connect the lesson to things the child enjoys (sports, games, music, animals, etc.).
6. When the child masters a concept, mark it explicitly with 🌟.`;
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
