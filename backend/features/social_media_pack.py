from backend.core.llm_engine import generate_social_pack


def get_social_pack(article: dict, platform: str = "twitter") -> dict:
    return generate_social_pack(article, platform)