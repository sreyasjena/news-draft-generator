import re


def flag_quotes(article: dict) -> dict:
    body = article.get("body", [])
    quotes = article.get("quotes", [])
    flagged_body = []

    for paragraph in body:
        flagged_para = paragraph
        # Find quoted text in paragraph
        quoted_texts = re.findall(r'"([^"]*)"', paragraph)
        for quote in quoted_texts:
            warning_tag = f' ⚠️[AI-GENERATED QUOTE — VERIFY BEFORE PUBLISHING]'
            flagged_para = flagged_para.replace(
                f'"{quote}"',
                f'"{quote}"{warning_tag}'
            )
        flagged_body.append(flagged_para)

    flagged_quotes = [
        {
            "quote": q,
            "warning": "AI-generated quote — verify with source before publishing",
            "verified": False
        }
        for q in quotes
    ]

    article["flagged_body"] = flagged_body
    article["flagged_quotes"] = flagged_quotes
    return article