from backend.core.llm_engine import refine_tone


def refine_article_tone(article_text: str, target_tone: str) -> str:
    return refine_tone(article_text, target_tone)