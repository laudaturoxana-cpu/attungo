"""
Detectare stare emoțională din mesaje.
"""
import re

FRUSTRATION_SIGNALS = [
    "nu înțeleg", "nu știu", "nu pot", "e greu", "e prea greu", "urăsc", "nu îmi place",
    "i don't understand", "i don't know", "i can't", "it's hard", "too hard", "i hate",
    "nu vreau", "plictisitor", "stupid", "idiot", "i don't want", "boring",
    "!!", "???", "ugh", "aaa", "hmm",
]

HIGH_ENERGY_SIGNALS = [
    "wow", "super", "tare", "cool", "amazing", "grozav", "știu", "da!", "yes!",
    "înțeleg", "i understand", "got it", "perfect", "excellent", "bravo",
    "!!!", "😊", "❤️", "🔥", "⭐",
]

LOW_ENERGY_SIGNALS = [
    "...", "ok", "da", "nu", "mda", "whatever", "nu știu", "poate",
    "yes", "no", "maybe", "idk", "fine",
]

SAFETY_KEYWORDS = [
    "trist", "plâng", "plâns", "singur", "bullying", "bătut", "urâsc școala",
    "mă doare", "nu mai vreau", "sad", "crying", "alone", "hurt", "bully",
    "scared", "frică", "teamă",
]


def detect_emotional_state(message: str) -> dict:
    """
    Analizează mesajul și returnează starea emoțională detectată.
    """
    message_lower = message.lower()
    words = len(message.split())

    # Frustration score (0-1)
    frustration_count = sum(
        1 for sig in FRUSTRATION_SIGNALS
        if sig in message_lower
    )
    frustration = min(frustration_count * 0.25, 1.0)

    # Energy detection
    high_signals = sum(1 for sig in HIGH_ENERGY_SIGNALS if sig in message_lower)
    low_signals = sum(1 for sig in LOW_ENERGY_SIGNALS if sig in message_lower)

    if words <= 3 and low_signals > 0:
        energy = "low"
    elif high_signals > 0:
        energy = "high"
    elif words <= 5:
        energy = "low"
    else:
        energy = "medium"

    # Engagement (based on message length and enthusiasm)
    if words >= 20 or high_signals >= 2:
        engagement = 0.9
    elif words >= 10:
        engagement = 0.75
    elif words >= 5:
        engagement = 0.6
    else:
        engagement = 0.4

    # Safety concern
    safety_concern = any(kw in message_lower for kw in SAFETY_KEYWORDS)

    return {
        "energy": energy,
        "frustration": frustration,
        "engagement": engagement,
        "safety_concern": safety_concern,
        "needs_break": frustration > 0.6,
    }
