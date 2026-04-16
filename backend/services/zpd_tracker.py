"""
ZPD Tracker — Zona de Dezvoltare Proximă (Vygotsky).
Actualizează statusul per concept după fiecare interacțiune.
"""
from typing import Any


def update_zpd(
    current_zpd: dict[str, Any],
    subject: str,
    concept: str,
    result: str,  # "success", "partial", "failed", "mastered"
) -> dict[str, Any]:
    """
    Actualizează ZPD-ul copilului pentru un concept specific.
    Returns updated ZPD dict.
    """
    if subject not in current_zpd:
        current_zpd[subject] = {}

    concept_data = current_zpd[subject].get(concept, {
        "status": "not_yet",
        "attempts": 0,
        "successful_attempts": 0,
    })

    concept_data["attempts"] = concept_data.get("attempts", 0) + 1

    if result == "success":
        concept_data["successful_attempts"] = concept_data.get("successful_attempts", 0) + 1
        success_rate = concept_data["successful_attempts"] / concept_data["attempts"]
        if success_rate >= 0.8 and concept_data["attempts"] >= 3:
            concept_data["status"] = "mastered"
        else:
            concept_data["status"] = "can_do_alone"

    elif result == "partial":
        concept_data["status"] = "with_help"

    elif result == "failed":
        consecutive_fails = concept_data.get("consecutive_fails", 0) + 1
        concept_data["consecutive_fails"] = consecutive_fails
        if consecutive_fails >= 3:
            concept_data["status"] = "not_yet"
        else:
            concept_data["status"] = "with_help"

    elif result == "mastered":
        concept_data["status"] = "mastered"
        concept_data["successful_attempts"] = concept_data["attempts"]

    current_zpd[subject][concept] = concept_data
    return current_zpd


def get_zpd_summary(zpd: dict[str, Any], subject: str) -> dict[str, list[str]]:
    """Returnează un rezumat al ZPD per materie pentru system prompt."""
    subject_zpd = zpd.get(subject, {})

    return {
        "can_do": [c for c, d in subject_zpd.items() if d.get("status") == "can_do_alone"],
        "with_help": [c for c, d in subject_zpd.items() if d.get("status") == "with_help"],
        "not_yet": [c for c, d in subject_zpd.items() if d.get("status") == "not_yet"],
        "mastered": [c for c, d in subject_zpd.items() if d.get("status") == "mastered"],
    }
