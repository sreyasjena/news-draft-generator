import os
import tempfile
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

from backend.core.llm_engine import (
    generate_news_draft,
    refine_tone,
    score_engagement,
    suggest_angles,
    generate_social_pack,
    detect_bias
)
from backend.features.seo_optimizer import optimize_seo
from backend.features.fact_checker import check_facts
from backend.features.image_injector import inject_images
from backend.features.plagiarism_checker import check_plagiarism
from backend.features.quote_warning import flag_quotes
from backend.features.tone_heatmap import generate_heatmap
from backend.features.trend_radar import get_trending_topics, get_all_trending
from backend.features.platform_adapter import adapt_for_platform
from backend.features.voice_to_draft import transcribe_audio

router = APIRouter()


# ── Request Models ────────────────────────────────────────────────────────────

class DraftRequest(BaseModel):
    facts: list[str]
    tone: str = "neutral"
    style: str = "news article"
    size: str = "medium (400-500 words)"

class ToneRequest(BaseModel):
    article_text: str
    target_tone: str

class ArticleRequest(BaseModel):
    article: dict

class TextRequest(BaseModel):
    text: str

class FactsRequest(BaseModel):
    facts: list[str]

class PlatformRequest(BaseModel):
    article: dict
    platform: str


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/health")
def health_check():
    return {"status": "ok", "message": "News Draft Generator API is running"}


@router.post("/generate")
def generate_draft(request: DraftRequest):
    try:
        draft = generate_news_draft(
            facts=request.facts,
            tone=request.tone,
            style=request.style,
            size=request.size
        )
        return {"success": True, "draft": draft}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refine-tone")
def refine_tone_route(request: ToneRequest):
    try:
        refined = refine_tone(request.article_text, request.target_tone)
        return {"success": True, "refined_article": refined}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/seo")
def seo_optimize(request: ArticleRequest):
    try:
        seo = optimize_seo(request.article)
        return {"success": True, "seo": seo}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/inject-images")
def image_inject(request: ArticleRequest):
    try:
        result = inject_images(request.article)
        return {"success": True, "article": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/plagiarism-check")
def plagiarism_check(request: TextRequest):
    try:
        result = check_plagiarism(request.text)
        return {"success": True, "plagiarism": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/flag-quotes")
def flag_quotes_route(request: ArticleRequest):
    try:
        result = flag_quotes(request.article)
        return {"success": True, "article": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tone-heatmap")
def tone_heatmap(request: ArticleRequest):
    try:
        result = generate_heatmap(request.article)
        return {"success": True, "heatmap": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends")
def trends():
    try:
        result = get_all_trending()
        return {"success": True, "trends": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends/category")
def trends_by_category(category: str = "general", country: str = "us"):
    try:
        result = get_trending_topics(category, country)
        return {"success": True, "trends": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/adapt-platform")
def adapt_platform(request: PlatformRequest):
    try:
        result = adapt_for_platform(request.article, request.platform)
        return {"success": True, "adapted": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fact-check")
def fact_check(request: ArticleRequest):
    try:
        facts = request.article.get("facts", [])
        if not facts:
            body = request.article.get("body", [])
            facts = body[:5]
        result = check_facts(facts)
        return {"success": True, "fact_check": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/voice-to-draft")
async def voice_draft(file: UploadFile = File(...)):
    try:
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        result = transcribe_audio(tmp_path)
        os.unlink(tmp_path)
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/engagement-score")
def engagement_score(request: ArticleRequest):
    try:
        result = score_engagement(request.article)
        return {"success": True, "score": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suggest-angles")
def suggest_angles_route(request: FactsRequest):
    try:
        result = suggest_angles(request.facts)
        return {"success": True, "angles": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/social-pack")
def social_pack(request: ArticleRequest):
    try:
        result = generate_social_pack(request.article)
        return {"success": True, "social_pack": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detect-bias")
def detect_bias_route(request: TextRequest):
    try:
        result = detect_bias(request.text)
        return {"success": True, "bias": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))