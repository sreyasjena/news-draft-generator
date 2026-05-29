import os
from litellm import completion
from dotenv import load_dotenv
import json

load_dotenv()

LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o")


def optimize_seo(article: dict) -> dict:
    prompt = f"""
You are an SEO expert specializing in news articles. Analyze this article and provide SEO optimization.

HEADLINE: {article.get('headline', '')}
LEDE: {article.get('lede', '')}
BODY: {' '.join(article.get('body', []))}
CURRENT TAGS: {', '.join(article.get('tags', []))}

RESPOND ONLY IN THIS EXACT JSON FORMAT:
{{
    "seo_title": "...",
    "meta_description": "...",
    "primary_keyword": "...",
    "secondary_keywords": ["kw1", "kw2", "kw3", "kw4", "kw5"],
    "slug": "...",
    "keyword_density": "...",
    "seo_score": 0,
    "improvements": ["improvement1", "improvement2", "improvement3"]
}}

seo_title: optimized title under 60 characters
meta_description: compelling description under 160 characters
slug: URL-friendly version of the title
seo_score: integer from 0 to 100
"""
    response = completion(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)