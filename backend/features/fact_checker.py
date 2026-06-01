import os
import requests
from dotenv import load_dotenv
from litellm import completion
import json

load_dotenv()

NEWS_API_KEY = os.getenv("NEWS_API_KEY")
GOOGLE_FACT_CHECK_API_KEY = os.getenv("GOOGLE_FACT_CHECK_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY


# ── STEP 1: ENRICH FACTS ──────────────────────────────────────────────────────

def enrich_facts(facts: list[str]) -> list[str]:
    try:
        n = len(facts)
        numbered = "\n".join([f"{i+1}. {f}" for i, f in enumerate(facts)])

        prompt = f"""You will receive exactly {n} facts written by a user.
Your job is to fix ONLY spelling mistakes and grammar errors in each fact.

STRICT RULES:
- Return EXACTLY {n} facts. No more, no less.
- Keep the same order.
- Do NOT add dates, names, locations, or any detail not already in the original.
- Do NOT merge two facts into one.
- Do NOT split one fact into two.
- Do NOT change the meaning of any fact.
- If a fact is already correct, return it as-is.

INPUT FACTS:
{numbered}

Return ONLY this JSON format:
{{
    "enriched_facts": [
        "fact 1 corrected",
        "fact 2 corrected"
    ]
}}"""

        response = completion(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        enriched = result.get("enriched_facts", [])

        if len(enriched) != n:
            print(f"[WARN] Enrichment returned {len(enriched)} facts, expected {n}. Using originals.")
            return facts

        return enriched

    except Exception as e:
        print(f"[ERROR] Fact enrichment failed: {e}. Using original facts.")
        return facts


# ── STEP 2: API SEARCH FUNCTIONS ──────────────────────────────────────────────

def search_wikipedia(query: str) -> dict:
    try:
        clean_query = ' '.join([w for w in query.split() if len(w) > 2][:6])
        url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + clean_query.replace(' ', '_')
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            return {
                "found": True,
                "summary": data.get('extract', '')[:500],
                "url": data.get('content_urls', {}).get('desktop', {}).get('page', '')
            }

        search_url = "https://en.wikipedia.org/w/api.php"
        params = {"action": "query", "list": "search", "srsearch": clean_query,
                  "format": "json", "srlimit": 2}
        res2 = requests.get(search_url, params=params, timeout=5)
        if res2.status_code == 200:
            results = res2.json().get('query', {}).get('search', [])
            if results:
                title = results[0]['title']
                summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title.replace(' ', '_')}"
                res3 = requests.get(summary_url, timeout=5)
                if res3.status_code == 200:
                    data = res3.json()
                    return {
                        "found": True,
                        "summary": data.get('extract', '')[:500],
                        "url": data.get('content_urls', {}).get('desktop', {}).get('page', '')
                    }

        return {"found": False, "summary": "", "url": ""}
    except Exception as e:
        print(f"[ERROR] Wikipedia: {e}")
        return {"found": False, "summary": "", "url": ""}


def search_news(query: str) -> list:
    try:
        if not NEWS_API_KEY:
            return []
        clean_query = ' '.join(query.split()[:5])
        res = requests.get(
            "https://newsapi.org/v2/everything",
            params={"q": clean_query, "apiKey": NEWS_API_KEY,
                    "pageSize": 3, "sortBy": "relevancy"},
            timeout=5
        )
        if res.status_code == 200:
            articles = res.json().get("articles", [])
            return [
                {
                    "title": a.get("title", ""),
                    "source": a.get("source", {}).get("name", ""),
                    "url": a.get("url", ""),
                    "description": a.get("description", "")
                }
                for a in articles if a.get("title")
            ]
        return []
    except Exception as e:
        print(f"[ERROR] NewsAPI: {e}")
        return []


def search_google_fact_check(query: str) -> list:
    try:
        if not GOOGLE_FACT_CHECK_API_KEY:
            return []
        clean_query = ' '.join(query.split()[:5])
        res = requests.get(
            "https://factchecktools.googleapis.com/v1alpha1/claims:search",
            params={"query": clean_query, "key": GOOGLE_FACT_CHECK_API_KEY},
            timeout=5
        )
        if res.status_code == 200:
            claims = res.json().get("claims", [])
            results = []
            for c in claims[:2]:
                review = c.get("claimReview", [{}])[0]
                results.append({
                    "claim": c.get("text", ""),
                    "rating": review.get("textualRating", ""),
                    "publisher": review.get("publisher", {}).get("name", ""),
                    "url": review.get("url", "")
                })
            return results
        return []
    except Exception as e:
        print(f"[ERROR] Google Fact Check: {e}")
        return []


# ── STEP 3: SCORE BASED ON RELEVANT API EVIDENCE ONLY ────────────────────────

def score_fact(fact: str, wiki: dict, news: list, factchecks: list) -> dict:
    sources_found = []
    evidence_text = ""

    # Keywords from the fact — used to check relevance of API results
    fact_keywords = set(w.lower() for w in fact.split() if len(w) > 3)

    # Wikipedia — only count if summary contains at least 2 keywords from fact
    if wiki.get("found"):
        wiki_words = set(wiki["summary"].lower().split())
        overlap = fact_keywords & wiki_words
        if len(overlap) >= 2:
            sources_found.append({
                "type": "Wikipedia",
                "title": fact[:60],
                "url": wiki.get("url", ""),
                "source": "Wikipedia"
            })
            evidence_text += f"Wikipedia: {wiki['summary'][:300]}\n"

    # NewsAPI — only count if title+description contains at least 2 keywords from fact
    for article in news[:2]:
        if article.get("title"):
            article_words = set(
                (article["title"] + " " + article.get("description", "")).lower().split()
            )
            overlap = fact_keywords & article_words
            if len(overlap) >= 2:
                sources_found.append({
                    "type": "NewsAPI",
                    "title": article["title"],
                    "url": article["url"],
                    "source": article["source"]
                })
                evidence_text += f"News ({article['source']}): {article['title']}. {article.get('description', '')[:150]}\n"

    # Google Fact Check — only count if claim contains at least 2 keywords from fact
    for fc in factchecks[:1]:
        if fc.get("claim"):
            fc_words = set(fc["claim"].lower().split())
            overlap = fact_keywords & fc_words
            if len(overlap) >= 2:
                sources_found.append({
                    "type": "Fact Check",
                    "title": fc["claim"][:80],
                    "url": fc["url"],
                    "source": fc["publisher"]
                })
                evidence_text += f"Fact Check ({fc['publisher']}): {fc['claim']} — Rating: {fc['rating']}\n"

    # ── Scoring based purely on relevant source count ──
    count = len(sources_found)

    if count >= 3:
        status = "Verified"
        confidence = 85
    elif count == 2:
        status = "Likely True"
        confidence = 60
    elif count == 1:
        status = "Needs Verification"
        confidence = 35
    else:
        status = "Unverified"
        confidence = 12
        return {
            "claim": fact,
            "status": status,
            "confidence": confidence,
            "explanation": "No relevant supporting evidence found in Wikipedia, NewsAPI, or Google Fact Check. This claim could not be verified against any published source.",
            "supported_by": "No sources found",
            "sources": []
        }

    # GPT-4o only writes the explanation — does NOT score
    try:
        explanation_prompt = f"""A fact-checking system found the following evidence for this claim.
Write a 1-2 sentence plain English explanation of what the evidence shows.
Do NOT change the verdict. Do NOT add your own knowledge.
Only summarise what the evidence says.

CLAIM: {fact}
EVIDENCE:
{evidence_text}
VERDICT ALREADY DECIDED: {status} ({confidence}% confidence)

Write only the explanation sentence(s). No JSON, no extra text."""

        response = completion(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": explanation_prompt}],
            temperature=0.0
        )
        explanation = response.choices[0].message.content.strip()
    except Exception:
        explanation = f"Found {count} relevant source(s) that relate to this claim."

    return {
        "claim": fact,
        "status": status,
        "confidence": confidence,
        "explanation": explanation,
        "supported_by": ", ".join([s["source"] for s in sources_found]),
        "sources": sources_found
    }


# ── MAIN ENTRY POINT ──────────────────────────────────────────────────────────

def check_facts(facts: list[str]) -> dict:
    try:
        # Step 1 — Enrich facts (grammar fix only, exact count preserved)
        enriched_facts = enrich_facts(facts)

        # Step 2 & 3 — Search + Score each fact
        results = []
        all_sources = []

        for fact in enriched_facts:
            wiki = search_wikipedia(fact)
            news = search_news(fact)
            factchecks = search_google_fact_check(fact)

            result = score_fact(fact, wiki, news, factchecks)
            results.append(result)
            all_sources.extend(result.get("sources", []))

        # Overall confidence = average of all individual scores
        scores = [r["confidence"] for r in results]
        overall = round(sum(scores) / len(scores)) if scores else 0

        return {
            "verified_claims": results,
            "overall_confidence": overall,
            "sources": all_sources,
            "enriched_facts": enriched_facts,
            "original_facts": facts
        }

    except Exception as e:
        print(f"[ERROR] check_facts: {e}")
        return {
            "verified_claims": [],
            "overall_confidence": 0,
            "sources": [],
            "enriched_facts": facts,
            "original_facts": facts
        }