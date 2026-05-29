import os
from litellm import completion
from dotenv import load_dotenv
import json

load_dotenv()

LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o")


def check_plagiarism(article_text: str) -> dict:
    prompt = f"""
You are a plagiarism detection expert. Analyze this news article for potential plagiarism issues.

ARTICLE:
{article_text}

RESPOND ONLY IN THIS EXACT JSON FORMAT:
{{
    "originality_score": 0,
    "risk_level": "...",
    "flagged_phrases": [
        {{"phrase": "...", "reason": "..."}}
    ],
    "common_expressions": ["phrase1", "phrase2"],
    "assessment": "...",
    "recommendations": ["rec1", "rec2", "rec3"]
}}

originality_score: integer from 0 to 100 (100 = completely original)
risk_level: one of "Low", "Medium", "High"
"""
    response = completion(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)