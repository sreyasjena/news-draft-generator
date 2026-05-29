from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import tempfile
import os

from backend.core.llm_engine import generate_news_draft
from backend.features.seo_optimizer import optimize_seo
from backend.features.image_injector import inject_images
from backend.features.plagiarism_checker import check_plagiarism
from backend.features.quote_warning import flag_quotes
from backend.features.tone_heatmap import generate_heatmap
from backend.features.trend_radar import get_all_trending, get_trending_topics
from backend.features.platform_adapter import adapt_for_platform
from backend.features.fact_checker import check_facts
from backend.features.voice_to_draft import transcribe_audio
from backend.features.engagement_score import get_engagement_score
from backend.features.angle_suggester import get_angles
from backend.features.social_media_pack import get_social_pack
from backend.features.bias_detector import get_bias_analysis
from backend.features.tone_refiner import refine_article_tone

router = APIRouter()


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

class TrendRequest(BaseModel):
    category: str = "general"
    country: str = "us"

class SocialPackRequest(BaseModel):
    article: dict
    platform: str = "twitter"


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
        refined = refine_article_tone(request.article_text, request.target_tone)
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
        return {"success": True, "result": result}
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
def get_trends():
    try:
        result = get_all_trending()
        return {"success": True, "trends": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trends/category")
def get_trends_by_category(request: TrendRequest):
    try:
        result = get_trending_topics(request.category, request.country)
        return {"success": True, "trends": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/adapt-platform")
def platform_adapt(request: PlatformRequest):
    try:
        result = adapt_for_platform(request.article, request.platform)
        return {"success": True, "adapted": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fact-check")
def fact_check(request: ArticleRequest):
    try:
        result = check_facts(request.article)
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
        result = get_engagement_score(request.article)
        return {"success": True, "score": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suggest-angles")
def suggest_angles(request: FactsRequest):
    try:
        result = get_angles(request.facts)
        return {"success": True, "angles": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/social-pack")
def social_pack(request: SocialPackRequest):
    try:
        result = get_social_pack(request.article, request.platform)
        return {"success": True, "social_pack": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detect-bias")
def detect_bias(request: TextRequest):
    try:
        result = get_bias_analysis(request.text)
        return {"success": True, "bias": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))