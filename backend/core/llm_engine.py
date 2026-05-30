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
        depth_rule = "Cover each fact in exactly 2 sentences. Be concise and direct. Total article body: 150-200 words."
        depth_label = "Brief"
    elif "long" in size:
        depth_rule = "Cover each fact in 5-6 sentences. Include context, impact, analysis and expert perspective for each fact. Total article body: 800-1000 words."
        depth_label = "In-depth"
    else:
        depth_rule = "Cover each fact in 3-4 sentences. Include relevant context for each fact. Total article body: 400-500 words."
        depth_label = "Standard"

    style_rules = {
        "news article": {
            "structure": "Follow inverted pyramid structure. Most important facts first. Objective third-person voice.",
            "headline_style": "Factual and informative headline",
            "lede_style": "Answer who, what, when, where, why in the first sentence",
            "tone_note": "Neutral and objective throughout"
        },
        "breaking news": {
            "structure": "Lead with the most urgent fact immediately. Use present tense where possible. Keep paragraphs very short.",
            "headline_style": "Urgent action-oriented headline with strong verb",
            "lede_style": "Single punchy sentence with the most critical fact",
            "tone_note": "Urgent and immediate tone throughout"
        },
        "feature story": {
            "structure": "Start with a compelling scene or anecdote. Build narrative around the facts. End with a forward-looking statement.",
            "headline_style": "Creative engaging headline that tells a story",
            "lede_style": "Narrative opening that draws the reader in",
            "tone_note": "Storytelling voice with human interest angle"
        },
        "opinion piece": {
            "structure": "Open with a strong thesis statement. Support with facts. Build to a clear conclusion and call to action.",
            "headline_style": "Bold opinionated headline that takes a clear stance",
            "lede_style": "Strong thesis statement that clearly states the argument",
            "tone_note": "First person or strong editorial voice. Take a clear position."
        },
        "press release": {
            "structure": "Start with FOR IMMEDIATE RELEASE. Use formal corporate structure. Include who what when where why in order.",
            "headline_style": "Professional announcement headline",
            "lede_style": "City, Date — formal opening sentence with organization name",
            "tone_note": "Formal corporate language throughout"
        }
    }

    sr = style_rules.get(style, style_rules["news article"])

    prompt = f"""You are a professional journalist writing a {style.upper()}.

WRITING STYLE: {style.upper()}
STRUCTURE: {sr['structure']}
HEADLINE STYLE: {sr['headline_style']}
LEDE STYLE: {sr['lede_style']}
TONE: {tone} — {sr['tone_note']}
DEPTH: {depth_label} — {depth_rule}

FACTS TO COVER:
{chr(10).join(f"- {fact}" for fact in facts)}

STRICT RULES:
- Follow the {style} format exactly
- Apply {tone} tone throughout
- {depth_rule}
- Every sentence must be complete and meaningful
- Do not add facts that were not provided

Return ONLY this JSON:
{{
    "headline": "{sr['headline_style']}",
    "lede": "{sr['lede_style']}",
    "body": ["paragraph 1", "paragraph 2", "paragraph 3", "paragraph 4"],
    "background": "background and context sentence",
    "quotes": ["relevant quote 1", "relevant quote 2"],
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "word_count": 0
}}"""

    response = completion(
        model=LLM_MODEL,
        messages=[
            {
                "role": "system",
                "content": f"You are an expert journalist specializing in {style} writing. You strictly follow {style} format and structure. You always write in {tone} tone. You cover each fact with exactly the depth specified."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.5,
        response_format={"type": "json_object"}
    )

    result = json.loads(response.choices[0].message.content)
    result["word_count"] = sum(len(p.split()) for p in result.get("body", []))
    return result


def refine_tone(article_text: str, target_tone: str) -> str:
    prompt = f"""Rewrite this article in a {target_tone} tone. Keep all facts exactly the same. Return only the rewritten text.

ARTICLE:
{article_text}"""

    response = completion(
        model=LLM_MODEL,
        messages=[
            {
                "role": "system",
                "content": f"You are an expert editor. You rewrite articles in different tones while keeping all facts identical."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.5
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
        "twitter": "Write 3 tweets. Each tweet under 240 characters. Include 2 relevant hashtags per tweet.",
        "instagram": "Write 1 caption of 80-120 words. Engaging storytelling tone. Add 10 relevant hashtags separately.",
        "facebook": "Write 1 post of 100-150 words. Conversational tone. End with a question to drive engagement.",
        "linkedin": "Write 1 post of 150-250 words. Professional insightful tone. Start with a bold statement. End with a thought-provoking question.",
        "whatsapp": "Write 1 bulletin under 100 words. Use *bold* for headline. Use - for bullet points. End with source line."
    }

    rule = platform_rules.get(platform, platform_rules["twitter"])

    prompt = f"""Create a {platform} post for this news article.

HEADLINE: {article.get('headline', '')}
LEDE: {article.get('lede', '')}
TAGS: {', '.join(article.get('tags', []))}
BODY SUMMARY: {' '.join(article.get('body', [])[:1])}

RULE: {rule}

Return ONLY this JSON:
{{
    "platform": "{platform}",
    "posts": ["post content here"],
    "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
}}"""

    response = completion(
        model=LLM_MODEL,
        messages=[
            {
                "role": "system",
                "content": f"You are an expert social media manager for a major news organization. You create platform-specific content that maximizes engagement."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
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
        messages=[
            {
                "role": "system",
                "content": "You are an expert media bias analyst with deep knowledge of political framing, loaded language and journalistic objectivity standards."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.5,
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)


def score_engagement(article: dict) -> dict:
    prompt = f"""Score this article for predicted digital engagement.

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
        messages=[
            {
                "role": "system",
                "content": "You are a digital media analyst with expertise in content performance, SEO and social media engagement metrics."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.5,
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)