import os
from litellm import completion
from dotenv import load_dotenv
import json

load_dotenv()

LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o")


def adapt_for_platform(article: dict, platform: str) -> dict:
    platforms = {
        "newsletter": "email newsletter (friendly, conversational, 200-300 words, with a clear CTA)",
        "social_media": "social media post (punchy, engaging, under 100 words)",
        "breaking_news": "breaking news bulletin (urgent, factual, under 150 words, AP wire style)",
        "long_form": "long-form feature article (detailed, narrative, 800-1000 words)",
        "press_release": "formal press release (third-person, structured, 400-500 words)"
    }

    platform_desc = platforms.get(platform, "news article")

    prompt = f"""
You are an expert content adapter. Reformat this news article for {platform_desc}.

ORIGINAL HEADLINE: {article.get('headline', '')}
ORIGINAL LEDE: {article.get('lede', '')}
ORIGINAL BODY: {' '.join(article.get('body', []))}

RESPOND ONLY IN THIS EXACT JSON FORMAT:
{{
    "platform": "{platform}",
    "adapted_title": "...",
    "adapted_content": "...",
    "word_count": 0,
    "format_notes": "..."
}}
"""
    response = completion(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)