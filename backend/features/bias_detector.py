from backend.core.llm_engine import detect_bias


def get_bias_analysis(article_text: str) -> dict:
    return detect_bias(article_text)