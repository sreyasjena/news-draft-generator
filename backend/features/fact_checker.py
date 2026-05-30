import os
import requests
import asyncio
import aiohttp
from dotenv import load_dotenv
from litellm import completion
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

load_dotenv()

NEWS_API_KEY = os.getenv("NEWS_API_KEY")
GOOGLE_FACT_CHECK_API_KEY = os.getenv("GOOGLE_FACT_CHECK_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY


def search_wikipedia(query: str) -> str:
    try:
        clean_query = ' '.join([w for w in query.split() if len(w) > 2][:6])
        url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + clean_query.replace(' ', '_')
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            return data.get('extract', '')[:500]

        search_url = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "list": "search",
            "srsearch": clean_query,
            "format": "json",
            "srlimit": 2
        }
        res2 = requests.get(search_url, params=params, timeout=5)
        if res2.status_code == 200:
            results = res2.json().get('query', {}).get('search', [])
            if results:
                title = results[0]['title']
                summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title.replace(' ', '_')}"
                res3 = requests.get(summary_url, timeout=5)
                if res3.status_code == 200:
                    return res3.json().get('extract', '')[:500]
        return ""
    except Exception as e:
        print(f"Wikipedia error: {e}")
        return ""


def search_news(query: str) -> list:
    try:
        if not NEWS_API_KEY:
            return []
        short_query = ' '.join(query.split()[:5])
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": short_query,
            "apiKey": NEWS_API_KEY,
            "pageSize": 3,
            "language": "en",
            "sortBy": "relevancy"
        }
        res = requests.get(url, params=params, timeout=5)
        if res.status_code == 200:
            articles = res.json().get('articles', [])
            return [
                {
                    "title": a.get('title', ''),
                    "source": a.get('source', {}).get('name', ''),
                    "url": a.get('url', ''),
                    "description": a.get('description', '')[:200]
                }
                for a in articles if a.get('title')
            ]
        return []
    except Exception as e:
        print(f"NewsAPI error: {e}")
        return []


def search_google_fact_check(query: str) -> list:
    try:
        if not GOOGLE_FACT_CHECK_API_KEY:
            return []
        short_query = ' '.join(query.split()[:5])
        url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
        params = {
            "query": short_query,
            "key": GOOGLE_FACT_CHECK_API_KEY,
            "pageSize": 3
        }
        res = requests.get(url, params=params, timeout=5)
        if res.status_code == 200:
            claims = res.json().get('claims', [])
            results = []
            for claim in claims:
                for review in claim.get('claimReview', []):
                    results.append({
                        "claim": claim.get('text', ''),
                        "rating": review.get('textualRating', ''),
                        "publisher": review.get('publisher', {}).get('name', ''),
                        "url": review.get('url', '')
                    })
            return results
        return []
    except Exception as e:
        print(f"Google Fact Check error: {e}")
        return []


def check_single_claim(claim: str) -> dict:
    """Check a single claim across all 3 sources — used for parallel execution"""
    evidence = []
    sources = []

    # Wikipedia
    wiki_text = search_wikipedia(claim)
    if wiki_text:
        evidence.append(f"Wikipedia on '{claim[:50]}': {wiki_text[:300]}")
        sources.append({
            "type": "Wikipedia",
            "title": claim[:60],
            "url": "https://en.wikipedia.org/wiki/" + '_'.join(claim.split()[:4]),
            "source": "Wikipedia"
        })

    # NewsAPI
    news_results = search_news(claim)
    for article_result in news_results[:2]:
        if article_result.get('title'):
            evidence.append(
                f"News: {article_result['title']} - {article_result.get('description', '')[:200]}"
            )
            sources.append({
                "type": "NewsAPI",
                "title": article_result['title'],
                "url": article_result['url'],
                "source": article_result['source']
            })

    # Google Fact Check
    fact_checks = search_google_fact_check(claim)
    for fc in fact_checks[:1]:
        if fc.get('claim'):
            evidence.append(
                f"Fact Check: {fc['claim']} - Rating: {fc['rating']} by {fc['publisher']}"
            )
            sources.append({
                "type": "Fact Check",
                "title": fc['claim'][:80],
                "url": fc['url'],
                "source": fc['publisher']
            })

    return {
        "claim": claim,
        "evidence": evidence,
        "sources": sources
    }


def extract_claims(article: dict) -> list:
    try:
        text = f"""
Headline: {article.get('headline', '')}
Lede: {article.get('lede', '')}
Body: {' '.join(article.get('body', [])[:4])}
Background: {article.get('background', '')}
"""
        prompt = f"""Extract exactly 8 specific verifiable factual claims from this article.
Prioritize claims in this order:
1. FIRST — Specific numbers and statistics (most important to verify)
2. SECOND — Names and official titles of people
3. THIRD — Specific dates and places
4. FOURTH — Event outcomes and results
5. FIFTH — General statements and background facts

Rules:
- Each claim must be a single concrete verifiable statement
- Focus on facts that can be checked against real sources
- Do not extract opinions or predictions
- Do not extract duplicate or similar claims
- Make each claim specific enough to search for

ARTICLE:
{text}

Return ONLY this JSON:
{{
    "claims": [
        {{"claim": "specific verifiable claim", "priority": "statistics", "importance": "high"}},
        {{"claim": "specific verifiable claim", "priority": "names", "importance": "high"}},
        {{"claim": "specific verifiable claim", "priority": "dates", "importance": "medium"}},
        {{"claim": "specific verifiable claim", "priority": "events", "importance": "medium"}},
        {{"claim": "specific verifiable claim", "priority": "statistics", "importance": "high"}},
        {{"claim": "specific verifiable claim", "priority": "names", "importance": "medium"}},
        {{"claim": "specific verifiable claim", "priority": "events", "importance": "low"}},
        {{"claim": "specific verifiable claim", "priority": "general", "importance": "low"}}
    ]
}}"""

        response = completion(
            model=LLM_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You extract exactly 8 specific verifiable factual claims from news articles. You prioritize statistics, names, dates and specific events. You never extract opinions or predictions."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        result = json.loads(response.choices[0].message.content)
        claims_data = result.get("claims", [])

        # Extract just the claim text in priority order
        claims = [c["claim"] for c in claims_data if c.get("claim")]
        return claims[:8]

    except Exception as e:
        print(f"Extract claims error: {e}")
        return []


def verify_claims_parallel(claims: list) -> dict:
    try:
        all_evidence = []
        all_sources = []

        # Run all claim checks in parallel using ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=8) as executor:
            future_to_claim = {
                executor.submit(check_single_claim, claim): claim
                for claim in claims
            }

            claim_results = []
            for future in as_completed(future_to_claim):
                try:
                    result = future.result(timeout=10)
                    claim_results.append(result)
                    all_evidence.extend(result["evidence"])
                    all_sources.extend(result["sources"])
                except Exception as e:
                    print(f"Claim check error: {e}")

        # If no evidence found use GPT knowledge
        if not all_evidence:
            all_evidence = ["No external sources found. Using AI knowledge base for verification."]

        evidence_text = '\n'.join(all_evidence[:20])

        prompt = f"""You are an expert fact checker with knowledge up to May 2026.
Verify these claims using the evidence provided and your own knowledge.

CLAIMS TO VERIFY:
{json.dumps(claims, indent=2)}

EVIDENCE FOUND FROM APIS:
{evidence_text}

STRICT RULES:
- Use BOTH the evidence above AND your own knowledge to verify
- If evidence strongly supports → Verified (confidence 80-95)
- If your knowledge confirms it happened → Likely True (confidence 65-80)
- If it seems plausible but you cannot confirm → Needs Verification (confidence 40-65)
- If evidence contradicts or it seems wrong → Potentially False (confidence 10-40)
- NEVER give confidence 0 or null — absolute minimum is 30
- Past events that already happened get minimum 50 confidence
- Do NOT treat past events as future events
- Statistics and numbers that seem reasonable get minimum 40 confidence
- Use your knowledge of events up to May 2026

Return ONLY this JSON:
{{
    "verified_claims": [
        {{
            "claim": "exact claim text",
            "status": "Verified",
            "confidence": 85,
            "explanation": "why this status was given",
            "supported_by": "Wikipedia / NewsAPI / AI Knowledge / Multiple Sources"
        }}
    ],
    "overall_confidence": 75,
    "red_flags": ["any concerning issues found"],
    "recommendations": ["suggestions for the journalist"]
}}

status must be one of: Verified, Likely True, Needs Verification, Potentially False
overall_confidence must be between 30 and 95 — never 0 or null"""

        response = completion(
            model=LLM_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert fact checker with knowledge of world events up to May 2026. You verify claims about sports, politics, economics, science and current events. You always provide confidence scores between 30 and 95. You never give 0. You use both provided evidence and your own knowledge. You know about events like Operation Sindoor, IPL 2025, Virat Kohli retirement, India elections 2024 and other recent events."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)

        # Hard enforcement — never allow 0 confidence
        if result.get('overall_confidence', 0) < 30:
            result['overall_confidence'] = 40

        for claim in result.get('verified_claims', []):
            if claim.get('confidence', 0) < 30:
                claim['confidence'] = 35

        result['sources'] = all_sources[:10]
        result['total_sources_checked'] = len(all_sources)

        return result

    except Exception as e:
        print(f"Verify claims error: {e}")
        return {
            "verified_claims": [],
            "overall_confidence": 40,
            "red_flags": ["Fact checking service temporarily unavailable"],
            "recommendations": ["Please verify facts manually"],
            "sources": [],
            "total_sources_checked": 0
        }


def check_facts(article: dict) -> dict:
    try:
        # Extract 8 priority based claims
        claims = extract_claims(article)

        if not claims:
            return {
                "verified_claims": [],
                "overall_confidence": 40,
                "red_flags": ["Could not extract claims from article"],
                "recommendations": ["Please verify facts manually"],
                "sources": [],
                "total_sources_checked": 0
            }

        # Verify all claims in parallel
        return verify_claims_parallel(claims)

    except Exception as e:
        print(f"Fact check error: {e}")
        return {
            "verified_claims": [],
            "overall_confidence": 40,
            "red_flags": [str(e)],
            "recommendations": ["Please verify facts manually"],
            "sources": [],
            "total_sources_checked": 0
        }