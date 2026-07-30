"""Fetch the official BBC World News RSS feed for LinguaDay."""

from __future__ import annotations

import email.utils
import html
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path


FEED_URL = "https://feeds.bbci.co.uk/news/world/rss.xml"
OUTPUT = Path(__file__).resolve().parents[1] / "docs" / "bbc-news.json"


def plain_text(value: str | None) -> str:
    value = re.sub(r"<[^>]+>", " ", value or "")
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def iso_date(value: str | None) -> str:
    if not value:
        return ""
    try:
        parsed = email.utils.parsedate_to_datetime(value)
        return parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    except (TypeError, ValueError):
        return value


request = urllib.request.Request(
    FEED_URL,
    headers={"User-Agent": "LinguaDay-English-Learning/1.0 (+https://github.com/zrmastercn-code/linguaday-english)"},
)
with urllib.request.urlopen(request, timeout=30) as response:
    root = ET.fromstring(response.read())

items = []
for index, item in enumerate(root.findall("./channel/item")[:20]):
    title = plain_text(item.findtext("title"))
    description = plain_text(item.findtext("description"))
    link = plain_text(item.findtext("link"))
    guid = plain_text(item.findtext("guid")) or link or f"bbc-{index}"
    if title and description and link:
        items.append(
            {
                "id": guid,
                "title": title,
                "description": description,
                "link": link,
                "publishedAt": iso_date(item.findtext("pubDate")),
            }
        )

payload = {
    "source": "BBC News",
    "sourceUrl": "https://www.bbc.com/news",
    "feedUrl": FEED_URL,
    "updatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    "items": items,
}
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {len(items)} BBC News items to {OUTPUT}")
