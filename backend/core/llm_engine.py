import os
from litellm import completion
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o")

os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY


def generate_news_draft(facts: list[str], tone: str = "neutral", style: str = "news article", size: str = "medium (400-500 words)") -> dict:

    if "short" in size:
        word_instruction = """STRICT WORD COUNT REQUIREMENT: Write EXACTLY 150-200 words in the body paragraphs combined.
        - Write EXACTLY 2 short body paragraphs
        - Each paragraph must be 2-3 sentences only
        - Do NOT write more than 200 words total in body"""
        num_paragraphs = "EXACTLY 2 paragraphs"

    elif "long" in size:
        word_instruction = """STRICT WORD COUNT REQUIREMENT: Write EXACTLY 800-1000 words in the body paragraphs combined.
        - Write EXACTLY 7-8 detailed body paragraphs
        - Each paragraph must be 4-6 sentences long
        - Include detailed context, analysis, quotes integration and background
        - Do NOT write less than 800 words total in body"""
        num_paragraphs = "EXACTLY 7-8 paragraphs"

    else:
        word_instruction = """STRICT WORD COUNT REQUIREMENT: Write EXACTLY 400-500 words in the body paragraphs combined.
        - Write EXACTLY 4-5 body paragraphs
        - Each paragraph must be 3-4 sentences long
        - Do NOT write less than 400 words total in body"""
        num_paragraphs = "EXACTLY 4-5 paragraphs"

    prompt = f"""
You are an expert journalist. Generate a complete, publish-ready news article.

TONE: {tone}
STYLE: {style}
SIZE REQUIREMENT: {size}

{word_instruction}

FACTS PROVIDED:
{chr(10).join(f"- {fact}" for fact in facts)}

CRITICAL INSTRUCTIONS:
- Follow the inverted pyramid structure
- Write a compelling headline (under 12 words)
- Write a strong lede (who, what, when, where, why in 1-2 sentences)
- Body must have {num_paragraphs} — this is MANDATORY
- Add a background/context paragraph at the end
- Generate 2 realistic quotes relevant to the story
- Suggest 5 relevant tags
- STRICTLY follow the word count — do not deviate

RESPOND ONLY IN THIS EXACT JSON FORMAT:
{{
    "headline": "...",
    "lede": "...",
    "body": ["paragraph1", "paragraph2", "paragraph3", "paragraph4", "paragraph5"],
    "background": "...",
    "quotes": ["quote1", "quote2"],
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "word_count": 0
}}
"""
    response = completion(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        response_format={"type": "json_object"}
    )

    import json
    result = json.loads(response.choices[0].message.content)
    result["word_count"] = sum(len(p.split()) for p in result.get("body", []))
    return result


def refine_tone(article_text: str, target_tone: str) -> str:
    prompt = f"""
You are an expert editor. Rewrite the following news article in a {target_tone} tone.
Keep all the facts exactly the same. Only change the writing style and tone.
Return only the rewritten article text, nothing else.

ARTICLE:
{article_text}
"""
    response = completion(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )
    return response.choices[0].message.content


def suggest_angles(facts: list[str]) -> list[dict]:
    prompt = f"""
You are a senior journalist. Given these facts, suggest 4 different story angles.

FACTS:
{chr(10).join(f"- {fact}" for fact in facts)}

RESPOND ONLY IN THIS EXACT JSON FORMAT:
{{
    "angles": [
        {{"title": "...", "angle_type": "...", "description": "...", "sample_headline": "..."}},
        {{"title": "...", "angle_type": "...", "description": "...", "sample_headline": "..."}},
        {{"title": "...", "angle_type": "...", "description": "...", "sample_headline": "..."}},
        {{"title": "...", "angle_type": "...", "description": "...", "sample_headline": "..."}}
    ]
}}
"""
    response = completion(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
        response_format={"type": "json_object"}
    )
    import json
    return json.loads(response.choices[0].message.content)["angles"]


def generate_social_pack(article: dict, platform: str = "twitter") -> dict:
    platform_rules = {
        "twitter": """
Generate 3 tweets for Twitter/X.
STRICT RULES:
- Each tweet MUST be under 240 characters total including spaces and punctuation
- Count characters carefully before returning
- Short, punchy, newsworthy sentences only
- No filler words
- Can include 1-2 hashtags inside the tweet itself
RESPOND IN THIS JSON FORMAT:
{{
    "platform": "twitter",
    "posts": ["tweet1 under 240 chars", "tweet2 under 240 chars", "tweet3 under 240 chars"],
    "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
}}""",

        "instagram": """
Generate 1 Instagram caption.
STRICT RULES:
- 80-120 words maximum
- Engaging, visual, storytelling tone
- Start with a hook sentence
- End with a question or call to action to boost engagement
- Emojis allowed and encouraged (2-4 max)
- Do NOT include hashtags in the caption body
RESPOND IN THIS JSON FORMAT:
{{
    "platform": "instagram",
    "posts": ["single instagram caption 80-120 words"],
    "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8", "#tag9", "#tag10"]
}}""",

        "facebook": """
Generate 1 Facebook post.
STRICT RULES:
- 100-150 words
- Conversational, community-friendly tone
- Include a question at the end to drive comments
- Warm and engaging, not too formal
- Can use 1-2 emojis
RESPOND IN THIS JSON FORMAT:
{{
    "platform": "facebook",
    "posts": ["single facebook post 100-150 words"],
    "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
}}""",

        "linkedin": """
Generate 1 LinkedIn post.
STRICT RULES:
- 150-250 words
- Professional, insightful tone
- Start with a bold statement or surprising fact
- Include 1 key takeaway or lesson
- End with a thought-provoking question
- Use short paragraphs, one idea per paragraph
RESPOND IN THIS JSON FORMAT:
{{
    "platform": "linkedin",
    "posts": ["single linkedin post 150-250 words"],
    "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
}}""",

        "whatsapp": """
Generate 1 WhatsApp bulletin message.
STRICT RULES:
- Maximum 100 words
- Formatted as a news bulletin
- Bold the headline using *headline* markdown
- Use bullet points with - for key facts
- End with source attribution line
- No hashtags needed
RESPOND IN THIS JSON FORMAT:
{{
    "platform": "whatsapp",
    "posts": ["single whatsapp bulletin formatted with *bold* and - bullets"],
    "hashtags": []
}}"""
    }

    rules = platform_rules.get(platform, platform_rules["twitter"])

    prompt = f"""
You are an expert social media manager for a major news organization.
Generate a social media post for this news article.

ARTICLE HEADLINE: {article.get('headline', '')}
ARTICLE LEDE: {article.get('lede', '')}
ARTICLE TAGS: {', '.join(article.get('tags', []))}
ARTICLE BODY SUMMARY: {' '.join(article.get('body', [])[:2])}

TARGET PLATFORM: {platform.upper()}

{rules}

HASHTAG RULES (apply to all platforms except WhatsApp):
- Make hashtags TRENDING and RELEVANT to the topic
- Mix broad hashtags (#BreakingNews #Cricket) with specific ones (#ICCChampionsTrophy2026)
- Research what would actually trend for this topic
- Always include at least one location-based hashtag if relevant
- Always include one time-based hashtag if relevant (#2026)
"""

    response = completion(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
        response_format={"type": "json_object"}
    )
    import json
    return json.loads(response.choices[0].message.content)


def detect_bias(article_text: str) -> dict:
    prompt = f"""
You are an expert media bias analyst. Analyze this news article for bias.

ARTICLE:
{article_text}

RESPOND ONLY IN THIS EXACT JSON FORMAT:
{{
    "bias_score": 0,
    "bias_direction": "Center",
    "biased_sentences": [
        {{"sentence": "...", "reason": "...", "suggestion": "..."}}
    ],
    "emotional_words": ["word1", "word2"],
    "overall_assessment": "..."
}}

bias_score: integer from -100 (far left) to +100 (far right), 0 = center
bias_direction: one of "Far Left", "Left", "Center-Left", "Center", "Center-Right", "Right", "Far Right"
"""
    response = completion(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"}
    )
    import json
    return json.loads(response.choices[0].message.content)


def score_engagement(article: dict) -> dict:
    prompt = f"""
You are a digital media analyst. Score this news article for predicted engagement.

HEADLINE: {article.get('headline', '')}
LEDE: {article.get('lede', '')}
WORD COUNT: {article.get('word_count', 0)}
TAGS: {', '.join(article.get('tags', []))}

RESPOND ONLY IN THIS EXACT JSON FORMAT:
{{
    "overall_score": 0,
    "headline_strength": 0,
    "readability_score": 0,
    "seo_score": 0,
    "shareability_score": 0,
    "estimated_read_time": "...",
    "reading_level": "...",
    "improvements": ["suggestion1", "suggestion2", "suggestion3"]
}}

All scores are integers from 0 to 100.
reading_level: one of "General Audience", "Specialist", "Academic"
"""
    response = completion(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"}
    )
    import json
    return json.loads(response.choices[0].message.content)