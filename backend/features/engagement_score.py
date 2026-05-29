from backend.core.llm_engine import score_engagement


def get_engagement_score(article: dict) -> dict:
    return score_engagement(article)