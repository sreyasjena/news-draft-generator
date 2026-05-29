import os
import json
from litellm import completion
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o")

os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY


def generate_news_draft(facts: list[str], tone: str = "neutral", style: str = "news article", size: str = "medium (400-500 words)") -> dict:

    if "short" in size:
        size_rule = "Write 2 body paragraphs. Each paragraph has 2 sentences. Total body: 150-200 words."
    elif "long" in size:
        size_rule = "Write 7 body paragraphs. Each paragraph has 5 sentences. Total body: 800-1000 words."
    else:
        size_rule = "Write 4 body paragraphs. Each paragraph has 4 sentences. Total body: 400-500 words."

    prompt = f"""You are a professional journalist. Write a {style} in {tone} tone.

SIZE RULE: {size_rule}

FACTS:
{chr(10).join(f"- {fact}" for fact in facts)}

Return ONLY this JSON:
{{
    "headline": "headline under 12 words",
    "lede": "1 sentence summary",
    "body": ["paragraph 1", "paragraph 2"],
    "background": "1 sentence context",
    "quotes": ["quote 1", "quote 2"],
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "word_count": 0
}}"""

    response = completion(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        response_format={"type": "json_object"}
    )

    result = json.loads(response.choices[0].message.content)
    result["word_count"] = sum(len(p.split()) for p in result.get("body", []))
    return result


def refine_tone(article_text: str, target_tone: str) -> str:
    prompt = f"""Rewrite this article in a {target_tone} tone. Keep all facts the same. Return only the rewritten text.

ARTICLE:
{article_text}"""

    response = completion(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )
    return response.choices[0].message.content


def suggest_angles(facts: list[str]) -> list[dict]:
    prompt = f"""Suggest 4 different story angles for these facts.

FACTS:
{chr(10).join(f"- {fact}" for fact in facts)}

Return ONLY this JSON:
{{
    "angles": [
        {{"title": "...", "angle_type": "...", "description": "...", "sample_headline": "..."}},
        {{"title": "...", "angle_type": "...", "description": "...", "sample_headline": "..."}},
        {{"title": "...", "angle_type": "...", "description": "...", "sample_headline": "..."}},
        {{"title": "...", "angle_type": "...", "description": "...", "sample_headline": "..."}}
    ]
}}"""

    response = completion(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)["angles"]


def generate_social_pack(article: dict, platform: str = "twitter") -> dict:

    platform_rules = {
        "twitter": "Write 3 tweets. Each tweet under 240 characters. Include 2 hashtags per tweet.",
        "instagram": "Write 1 caption of 80-120 words. Add 10 hashtags separately.",
        "facebook": "Write 1 post of 100-150 words. End with a question.",
        "linkedin": "Write 1 post of 150-250 words. Professional tone. End with insight.",
        "whatsapp": "Write 1 bulletin under 100 words. Use *bold* for headline. Use - for bullet points."
    }

    rule = platform_rules.get(platform, platform_rules["twitter"])

    prompt = f"""You are a social media manager. Create a {platform} post for this article.

HEADLINE: {article.get('headline', '')}
LEDE: {article.get('lede', '')}
TAGS: {', '.join(article.get('tags', []))}

RULE: {rule}

Return ONLY this JSON:
{{
    "platform": "{platform}",
    "posts": ["post content here"],
    "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
}}"""

    response = completion(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)


def detect_bias(article_text: str) -> dict:
    prompt = f"""Analyze this article for political bias.

ARTICLE:
{article_text}

Return ONLY this JSON:
{{
    "bias_score": 0,
    "bias_direction": "Center",
    "biased_sentences": [
        {{"sentence": "...", "reason": "...", "suggestion": "..."}}
    ],
    "emotional_words": ["word1", "word2"],
    "overall_assessment": "one paragraph assessment"
}}

bias_score: -100 (far left) to +100 (far right). 0 = center.
bias_direction: one of Far Left, Left, Center-Left, Center, Center-Right, Right, Far Right."""

    response = completion(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)


def score_engagement(article: dict) -> dict:
    prompt = f"""Score this article for digital engagement.

HEADLINE: {article.get('headline', '')}
LEDE: {article.get('lede', '')}
WORD COUNT: {article.get('word_count', 0)}
TAGS: {', '.join(article.get('tags', []))}

Return ONLY this JSON:
{{
    "overall_score": 0,
    "headline_strength": 0,
    "readability_score": 0,
    "seo_score": 0,
    "shareability_score": 0,
    "estimated_read_time": "X min read",
    "reading_level": "General Audience",
    "improvements": ["tip1", "tip2", "tip3"]
}}

All scores are 0-100. reading_level is one of: General Audience, Specialist, Academic."""

    response = completion(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)