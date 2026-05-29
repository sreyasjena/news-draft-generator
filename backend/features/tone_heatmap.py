import os
from litellm import completion
from dotenv import load_dotenv
import json

load_dotenv()

LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o")


def generate_heatmap(article: dict) -> dict:
    body = article.get("body", [])

    prompt = f"""
You are an expert in emotional tone analysis. Analyze each paragraph of this news article.

PARAGRAPHS:
{json.dumps(body)}

RESPOND ONLY IN THIS EXACT JSON FORMAT:
{{
    "paragraphs": [
        {{
            "index": 0,
            "text": "...",
            "tone": "...",
            "color": "...",
            "intensity": 0,
            "dominant_emotion": "..."
        }}
    ],
    "overall_tone": "...",
    "tone_distribution": {{
        "alarming": 0,
        "neutral": 0,
        "positive": 0,
        "informative": 0
    }}
}}

tone: one of "alarming", "neutral", "positive", "informative"
color: one of "#ff4444" (alarming), "#888888" (neutral), "#44bb44" (positive), "#4488ff" (informative)
intensity: integer from 0 to 100
dominant_emotion: single word describing the emotion
tone_distribution values: percentages that add up to 100
"""
    response = completion(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)