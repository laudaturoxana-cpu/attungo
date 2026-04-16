"""
Detectare pasiuni din conversații — pasivă, fără a întreba direct.
"""
import re

PASSION_KEYWORDS = {
    "tech": [
        "minecraft", "roblox", "gaming", "joc", "game", "calculator", "computer",
        "cod", "code", "programare", "robot", "lego", "youtube", "video",
        "telefon", "app", "fortnite", "valorant",
    ],
    "sport": [
        "fotbal", "baschet", "tenis", "înot", "alergat", "bicicletă", "sport",
        "echipă", "antrenament", "meci", "gol", "campion", "football", "basketball",
        "swimming", "running", "bike", "training", "match",
    ],
    "music": [
        "muzică", "cântec", "chitară", "pian", "tobă", "concert", "trupă",
        "ascultat", "melodie", "music", "guitar", "piano", "drums", "song",
        "spotify", "playlist",
    ],
    "art": [
        "desen", "pictură", "culori", "artă", "sculptură", "craft", "origami",
        "design", "draw", "paint", "art", "color", "creative",
    ],
    "stories": [
        "carte", "poveste", "citit", "personaj", "roman", "fantasy", "harry potter",
        "book", "story", "reading", "character", "novel", "adventure",
    ],
    "animals": [
        "câine", "pisică", "animal", "natură", "păsări", "pești", "cal",
        "dog", "cat", "animal", "nature", "birds", "fish", "horse", "pet",
    ],
    "science": [
        "experiment", "știință", "chimie", "fizică", "biologie", "spațiu",
        "planetă", "science", "experiment", "chemistry", "physics", "space", "planet",
        "dinozaur", "dinosaur",
    ],
}


def detect_passions_in_message(message: str) -> dict[str, int]:
    """
    Scanează un mesaj și returnează pasiunile detectate cu scorul lor.
    Scor = numărul de keyword-uri găsite per categorie.
    """
    message_lower = message.lower()
    detected: dict[str, int] = {}

    for passion, keywords in PASSION_KEYWORDS.items():
        count = sum(
            1 for kw in keywords
            if re.search(r"\b" + re.escape(kw) + r"\b", message_lower)
        )
        if count > 0:
            detected[passion] = count

    return detected


def merge_passion_signals(
    existing: dict[str, int],
    new_signals: dict[str, int],
) -> dict[str, int]:
    """Combină semnalele noi cu cele existente (cumulativ)."""
    merged = dict(existing)
    for passion, score in new_signals.items():
        merged[passion] = merged.get(passion, 0) + score
    return merged
