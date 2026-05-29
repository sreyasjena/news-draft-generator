from backend.core.llm_engine import suggest_angles


def get_angles(facts: list[str]) -> list[dict]:
    return suggest_angles(facts)