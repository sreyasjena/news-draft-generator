import os
import requests
from dotenv import load_dotenv

load_dotenv()

UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")


def search_unsplash(query: str, count: int = 8) -> list[dict]:
    try:
        url = "https://api.unsplash.com/search/photos"
        params = {
            "query": query,
            "per_page": count,
            "orientation": "landscape"
        }
        headers = {"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"}
        response = requests.get(url, params=params, headers=headers)
        data = response.json()
        images = []
        for photo in data.get("results", []):
            images.append({
                "url": photo["urls"]["regular"],
                "thumb": photo["urls"]["thumb"],
                "description": photo.get("alt_description", query),
                "photographer": photo["user"]["name"],
                "source": "Unsplash"
            })
        return images
    except Exception as e:
        print(f"Unsplash error: {e}")
        return []


def search_pexels(query: str, count: int = 8) -> list[dict]:
    try:
        url = "https://api.pexels.com/v1/search"
        params = {"query": query, "per_page": count, "orientation": "landscape"}
        headers = {"Authorization": PEXELS_API_KEY}
        response = requests.get(url, params=params, headers=headers)
        data = response.json()
        images = []
        for photo in data.get("photos", []):
            images.append({
                "url": photo["src"]["large"],
                "thumb": photo["src"]["medium"],
                "description": photo.get("alt", query),
                "photographer": photo["photographer"],
                "source": "Pexels"
            })
        return images
    except Exception as e:
        print(f"Pexels error: {e}")
        return []


def inject_images(article: dict, count: int = 15) -> dict:
    headline = article.get("headline", "")
    tags = article.get("tags", [])
    body = article.get("body", [])

    primary_query = headline
    secondary_query = tags[0] if tags else headline
    tertiary_query = tags[1] if len(tags) > 1 else tags[0] if tags else headline

    unsplash_images = search_unsplash(primary_query, 8)
    pexels_images = search_pexels(secondary_query, 8)
    unsplash_extra = search_unsplash(tertiary_query, 4)

    all_images = []
    seen_urls = set()
    for img in unsplash_images + pexels_images + unsplash_extra:
        if img["url"] not in seen_urls:
            all_images.append(img)
            seen_urls.add(img["url"])

    injected_body = []
    for i, paragraph in enumerate(body):
        para_data = {"text": paragraph, "image": None}
        if i < len(all_images) and i % 2 == 0:
            para_data["image"] = all_images[i // 2]
        injected_body.append(para_data)

    article["injected_body"] = injected_body
    article["all_images"] = all_images
    return article