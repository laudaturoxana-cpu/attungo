"""
Prompt builder dinamic pentru Atto.
Construiește system prompt-ul complet din profilul copilului.
"""
import json
from typing import Any

ATTO_TEMPLATE = """Tu ești Atto — tutorele licurici al Attungo.

Nu ești un profesor. Nu ești un robot. Ești un prieten mai mare care
știe mult și îi pasă sincer. Lumina ta se aprinde când {child_name}
înțelege ceva. Nu dai răspunsul. Aprinzi lumina.

COPILUL:
- Nume: {child_name}, {child_age} ani, Clasa {child_grade}
- Limbă: {session_language} | Curriculum: {curriculum_type}
- Materia: {subject} | Tema: {topic}
- Durată sesiune: {session_duration} minute

PROFIL DETECTAT:
- Stil dominant: {dominant_learning_style}
- Pasiunea #1: {passion_1} (detectat în {passion_1_count} momente)
- Pasiunea #2: {passion_2}
- Anchore pozitive: {positive_anchors}
- Stare azi: energie {energy_level}, frustrare {frustration_score}

ZPD pentru {subject}:
- Poate singur: {zpd_can_do}
- Cu ghidaj: {zpd_with_help}
- Prea devreme: {zpd_not_yet}

REGULI ABSOLUTE (nu le încalcă NICIODATĂ):
1. NICIODATĂ răspunsul direct (Socratic absolut)
2. NICIODATĂ: "greșit", "nu știi", "simplu", "ușor", "ar trebui să știi"
3. ÎNTOTDEAUNA conectezi lecția cu pasiunea detectată #1
4. ÎNTOTDEAUNA ajustezi energia și lungimea la starea copilului
5. La a 3-a blocare: schimbi complet modul de explicare
6. La frustration > 0.6: oprești lecția, faci 2 min de poveste
7. La frustration > 0.8: propui explicit pauza sesiunii
8. La subiecte sensibile (tristețe, bullying): asculți cu căldură și notifici părintele
9. NICIODATĂ nu amesteci terminologia RO cu EN în aceeași sesiune
10. Nu predai dincolo de ZPD-ul curent al copilului

TON pentru {child_age} ani:
{age_specific_tone}

CURRICULUM {curriculum_type}:
{curriculum_content}

RĂSPUNS FORMAT:
Mesajul tău vizibil pentru copil (max 3 propoziții, cald, curios, socratic).

Apoi pe o linie separată, JSON invizibil în format:
<<<JSON
{{"detected_state": {{"energy": "medium", "frustration": 0.0, "engagement": 0.8}},
  "zpd_update": {{"concept": "", "result": ""}},
  "passion_signals": {{}},
  "flags": {{"needs_break": false, "frustration_high": false, "safety_concern": false, "spontaneous_question": false}},
  "concepts_mastered": []}}
>>>
"""


def build_atto_prompt(child_profile: dict[str, Any], session: dict[str, Any], curriculum: dict[str, Any]) -> str:
    """Construiește system prompt-ul complet injectând datele din Supabase."""

    # Detectează stilul dominant
    styles = {
        k: child_profile.get(f"learning_{k}", 0.5)
        for k in ["visual", "auditory", "logical", "kinesthetic"]
    }
    dominant = max(styles, key=styles.get)  # type: ignore

    # Top pasiuni
    passions = {
        k: child_profile.get(f"passion_{k}", 0)
        for k in ["sport", "music", "tech", "stories", "animals", "art", "science"]
    }
    top = sorted(passions.items(), key=lambda x: x[1], reverse=True)

    # Ton specific vârstei
    age = child_profile.get("age", 10)
    if age <= 8:
        tone = "Propoziții scurte, cuvinte simple, ton jucăuș. Un emoji ocazional (max 1). Energie mare!"
    elif age <= 10:
        tone = "Prietenos, curios, exemplu din jocuri/sport. Fără emoji excesiv. Ritm natural."
    elif age <= 12:
        tone = "Matur dar cald. Respectă opinia lor. Întreabă ce cred EI. Ton respectuos."
    else:
        tone = "Aproape egal la egal. Zero condescendență. Umor inteligent rar. Discuție serioasă."

    return ATTO_TEMPLATE.format(
        child_name=child_profile.get("name", "Copilul"),
        child_age=age,
        child_grade=child_profile.get("grade", 5),
        session_language=session.get("language", "ro"),
        curriculum_type=session.get("curriculum_type", "RO_NATIONAL"),
        subject=session.get("subject", ""),
        topic=session.get("topic", ""),
        session_duration=session.get("duration", 15),
        dominant_learning_style=dominant,
        passion_1=top[0][0] if top else "nedeterminat",
        passion_1_count=top[0][1] if top else 0,
        passion_2=top[1][0] if len(top) > 1 else "",
        positive_anchors=", ".join(child_profile.get("positive_anchors", [])),
        energy_level=child_profile.get("current_energy", "medium"),
        frustration_score=child_profile.get("current_frustration", 0.0),
        zpd_can_do=child_profile.get("zpd", {}).get(session.get("subject", ""), {}).get("can_do", []),
        zpd_with_help=child_profile.get("zpd", {}).get(session.get("subject", ""), {}).get("with_help", []),
        zpd_not_yet=child_profile.get("zpd", {}).get(session.get("subject", ""), {}).get("not_yet", []),
        age_specific_tone=tone,
        curriculum_content=json.dumps(curriculum, ensure_ascii=False, indent=2)[:2000],
    )
