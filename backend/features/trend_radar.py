import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

NEWS_API_KEY = os.getenv("NEWS_API_KEY")


def get_trending_topics(category: str = "general", country: str = "us") -> dict:
    try:
        url = "https://newsapi.org/v2/top-headlines"
        params = {
            "country": country,
            "category": category,
            "pageSize": 10,
            "apiKey": NEWS_API_KEY
        }
        response = requests.get(url, params=params)
        data = response.json()

        articles = data.get("articles", [])
        topics = []
        for article in articles:
            if article.get("title") and article.get("title") != "[Removed]":
                topics.append({
                    "title": article["title"],
                    "source": article["source"]["name"],
                    "published_at": article.get("publishedAt", ""),
                    "url": article.get("url", ""),
                    "description": article.get("description", "")
                })

        return {
            "category": category,
            "country": country,
            "topics": topics,
            "total": len(topics),
            "fetched_at": datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e), "topics": []}


def get_all_trending() -> dict:
    categories = ["general", "technology", "business", "science", "health"]
    all_trends = {}
    for category in categories:
        all_trends[category] = get_trending_topics(category)
    return all_trends