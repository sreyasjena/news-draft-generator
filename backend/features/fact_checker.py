import os
import requests
from litellm import completion
from dotenv import load_dotenv
import json

load_dotenv()

LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
GOOGLE_FACT_CHECK_API_KEY = os.getenv("GOOGLE_FACT_CHECK_API_KEY")


# ── Wikipedia Search ──────────────────────────────────────
def search_wikipedia(query: str) -> dict:
    try:
        url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + query.replace(" ", "_")
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return {
                "found": True,
                "title": data.get("title", ""),
                "summary": data.get("extract", "")[:500],
                "url": data.get("content_urls", {}).get("desktop", {}).get("page", ""),
                "source": "Wikipedia"
            }
        # Try search if direct lookup fails
        search_url = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "format": "json",
            "srlimit": 1
        }
        search_res = requests.get(search_url, params=params, timeout=5)
        search_data = search_res.json()
        results = search_data.get("query", {}).get("search", [])
        if results:
            title = results[0]["title"]
            page_url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
            snippet = results[0].get("snippet", "").replace('<span class="searchmatch">', "").replace("</span>", "")
            return {
                "found": True,
                "title": title,
                "summary": snippet[:500],
                "url": page_url,
                "source": "Wikipedia"
            }
        return {"found": False}
    except Exception as e:
        return {"found": False, "error": str(e)}


# ── NewsAPI Search ────────────────────────────────────────
def search_news(query: str) -> list[dict]:
    try:
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": query,
            "sortBy": "relevancy",
            "pageSize": 3,
            "language": "en",
            "apiKey": NEWS_API_KEY
        }
        response = requests.get(url, params=params, timeout=5)
        data = response.json()
        articles = []
        for article in data.get("articles", []):
            if article.get("title") and article.get("title") != "[Removed]":
                articles.append({
                    "title": article["title"],
                    "source": article["source"]["name"],
                    "url": article.get("url", ""),
                    "published_at": article.get("publishedAt", ""),
                    "description": article.get("description", "")[:200]
                })
        return articles
    except Exception as e:
        return []


# ── Google Fact Check API ─────────────────────────────────
def search_fact_check(query: str) -> list[dict]:
    try:
        if not GOOGLE_FACT_CHECK_API_KEY:
            return []
        url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
        params = {
            "query": query,
            "key": GOOGLE_FACT_CHECK_API_KEY,
            "pageSize": 3
        }
        response = requests.get(url, params=params, timeout=5)
        data = response.json()
        results = []
        for claim in data.get("claims", []):
            for review in claim.get("claimReview", []):
                results.append({
                    "claim": claim.get("text", ""),
                    "rating": review.get("textualRating", ""),
                    "publisher": review.get("publisher", {}).get("name", ""),
                    "url": review.get("url", ""),
                    "source": "Google Fact Check"
                })
        return results
    except Exception as e:
        return []


# ── Extract Key Claims ────────────────────────────────────
def extract_key_claims(article: dict) -> list[str]:
    headline = article.get("headline", "")
    lede = article.get("lede", "")
    body = article.get("body", [])
    all_text = f"{headline}. {lede}. {' '.join(body[:2])}"

    prompt = f"""
Extract 5 specific, verifiable factual claims from this news article text.
Focus on: names, numbers, dates, locations, statistics, events.
Return ONLY a JSON array of strings.
Example: ["Claim 1", "Claim 2", "Claim 3", "Claim 4", "Claim 5"]

TEXT: {all_text[:1500]}
"""
    try:
        response = completion(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )
        content = response.choices[0].message.content.strip()
        content = content.replace("```json", "").replace("```", "").strip()
        return json.loads(content)
    except:
        sentences = all_text.split(".")
        return [s.strip() for s in sentences[:5] if len(s.strip()) > 20]


# ── Main Fact Check Function ──────────────────────────────
def check_facts(article: dict) -> dict:
    claims = extract_key_claims(article)
    verified_claims = []
    all_sources = []

    for claim in claims:
        claim_data = {
            "claim": claim,
            "sources": [],
            "wikipedia": None,
            "news_articles": [],
            "fact_check_results": []
        }

        # Search Wikipedia
        wiki_query = " ".join(claim.split()[:6])
        wiki_result = search_wikipedia(wiki_query)
        if wiki_result.get("found"):
            claim_data["wikipedia"] = wiki_result
            all_sources.append({
                "type": "Wikipedia",
                "title": wiki_result["title"],
                "url": wiki_result["url"],
                "relevant_to": claim
            })

        # Search NewsAPI
        news_query = " ".join(claim.split()[:8])
        news_results = search_news(news_query)
        claim_data["news_articles"] = news_results[:2]
        for news in news_results[:2]:
            if news.get("url"):
                all_sources.append({
                    "type": "News",
                    "title": news["title"],
                    "source": news["source"],
                    "url": news["url"],
                    "relevant_to": claim
                })

        # Google Fact Check
        fact_check_results = search_fact_check(claim)
        claim_data["fact_check_results"] = fact_check_results
        for fc in fact_check_results:
            if fc.get("url"):
                all_sources.append({
                    "type": "Fact Check",
                    "title": f"{fc['publisher']}: {fc['rating']}",
                    "url": fc["url"],
                    "relevant_to": claim
                })

        verified_claims.append(claim_data)

    # Final GPT-4o analysis with all gathered evidence
    evidence_summary = ""
    for vc in verified_claims:
        evidence_summary += f"\nCLAIM: {vc['claim']}\n"
        if vc["wikipedia"] and vc["wikipedia"].get("found"):
            evidence_summary += f"Wikipedia: {vc['wikipedia']['summary'][:200]}\n"
        for news in vc["news_articles"][:1]:
            evidence_summary += f"News ({news['source']}): {news['description']}\n"
        for fc in vc["fact_check_results"][:1]:
            evidence_summary += f"Fact Check: {fc['rating']} by {fc['publisher']}\n"

    prompt = f"""
You are an expert fact-checker. Analyze these claims using the real evidence gathered from Wikipedia, NewsAPI, and Google Fact Check.

CLAIMS AND EVIDENCE:
{evidence_summary}

RESPOND ONLY IN THIS EXACT JSON FORMAT:
{{
    "overall_confidence": 0,
    "verified_claims": [
        {{
            "claim": "...",
            "status": "...",
            "confidence": 0,
            "explanation": "...",
            "supported_by": "..."
        }}
    ],
    "unverified_claims": [
        {{
            "claim": "...",
            "reason": "...",
            "suggestion": "..."
        }}
    ],
    "red_flags": ["flag1", "flag2"],
    "recommendations": ["rec1", "rec2"]
}}

status: one of "Verified", "Likely True", "Needs Verification", "Potentially False"
confidence: integer 0-100
overall_confidence: integer 0-100
supported_by: name of the source that supports this claim
"""
    try:
        response = completion(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        result = json.loads(response.choices[0].message.content)
        result["sources"] = all_sources
        result["total_sources_checked"] = len(all_sources)
        return result
    except Exception as e:
        return {
            "overall_confidence": 0,
            "verified_claims": [],
            "unverified_claims": [],
            "red_flags": ["Analysis failed"],
            "recommendations": [],
            "sources": all_sources,
            "total_sources_checked": len(all_sources),
            "error": str(e)
        }