import time
import re
import sqlite3
import feedparser
from pathlib import Path
from email.utils import parsedate_to_datetime

try:
    from win11toast import toast
    WIN_TOAST_AVAILABLE = True
except ImportError:
    WIN_TOAST_AVAILABLE = False


POLL_SECONDS = 15
USER_AGENT = "MySecWatcher/1.0 your_email@example.com"

LATEST_FILINGS_ATOM = (
    "https://www.sec.gov/cgi-bin/browse-edgar"
    "?action=getcurrent"
    "&company="
    "&count=100"
    "&dateb="
    "&output=atom"
    "&owner=include"
    "&start=0"
)

TARGET_FORMS = {
    "8-K", "10-K", "10-Q", "6-K", "S-1", "424B3", "SC 13D", "SC 13G", "13D", "13G"
}

DB_PATH = Path("sec_filings.db")


def get_conn():
    return sqlite3.connect(DB_PATH)


def init_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS filings (
            accession TEXT PRIMARY KEY,
            company TEXT,
            form_type TEXT,
            sentiment TEXT,
            published TEXT,
            title TEXT,
            link TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


def exists_accession(accession: str) -> bool:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM filings WHERE accession = ?", (accession,))
    row = cur.fetchone()
    conn.close()
    return row is not None


def insert_filing(item: dict):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT OR IGNORE INTO filings (
            accession, company, form_type, sentiment, published, title, link
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        item["accession"],
        item["company"],
        item["form_type"],
        item["sentiment"],
        item["published"],
        item["title"],
        item["link"],
    ))
    conn.commit()
    conn.close()


def parse_feed(url: str):
    return feedparser.parse(url, request_headers={"User-Agent": USER_AGENT})


def normalize_form_type(form_type: str) -> str:
    ft = (form_type or "").upper().strip()

    if ft == "424B3":
        return "424B3"
    if ft in {"SC 13D", "13D"}:
        return "SC 13D"
    if ft in {"SC 13G", "13G"}:
        return "SC 13G"
    return ft


def extract_form_type(entry) -> str:
    title = getattr(entry, "title", "").strip()
    summary = getattr(entry, "summary", "").strip()
    text = f"{title} {summary}"

    patterns = [
        r"\b8-K\b",
        r"\b10-K\b",
        r"\b10-Q\b",
        r"\b6-K\b",
        r"\bS-1\b",
        r"\b424B3\b",
        r"\bSC 13D\b",
        r"\bSC 13G\b",
        r"\b13D\b",
        r"\b13G\b",
    ]

    for p in patterns:
        m = re.search(p, text, re.I)
        if m:
            return normalize_form_type(m.group(0))

    tags = getattr(entry, "tags", [])
    for tag in tags:
        term = getattr(tag, "term", "")
        if term:
            return normalize_form_type(term.strip())

    return "UNKNOWN"


def extract_accession(entry) -> str:
    entry_id = getattr(entry, "id", "") or getattr(entry, "link", "")
    m = re.search(r"(\d{10}-\d{2}-\d{6})", entry_id)
    if m:
        return m.group(1)
    return entry_id.strip()


def extract_company(entry) -> str:
    title = getattr(entry, "title", "").strip()

    # 예: "8-K - Apple Inc. (0000320193) (Subject)"
    m = re.search(r"-\s+(.+?)\s+\(\d{10}\)", title)
    if m:
        return m.group(1).strip()

    return title[:120] if title else "UNKNOWN"


def classify_entry(form_type: str, title: str, summary: str) -> str:
    text = f"{form_type} {title} {summary}".upper()

    positive = [
        "ENTRY INTO A MATERIAL DEFINITIVE AGREEMENT",
        "RESULTS OF OPERATIONS",
        "EARNINGS",
        "DIVIDEND",
        "REPURCHASE",
        "COMPLETION OF ACQUISITION",
        "MATERIAL AGREEMENT",
    ]
    negative = [
        "BANKRUPTCY",
        "GOING CONCERN",
        "DEFAULT",
        "DELIST",
        "OFFERING",
        "DILUTION",
        "TERMINATION",
    ]

    if any(k in text for k in positive):
        return "호재가능"
    if any(k in text for k in negative):
        return "악재가능"

    if form_type in {"8-K", "10-K", "10-Q", "6-K"}:
        return "중요공시"

    return "일반공시"


def notify_windows(item: dict):
    if not WIN_TOAST_AVAILABLE:
        return

    title = f"[{item['form_type']}] {item['company']}"
    body = f"{item['sentiment']} | {item['published']}\n{item['title'][:180]}"

    try:
        toast(title, body, duration="short")
    except Exception as e:
        print("[WARN] 윈도우 알림 실패:", e)


def print_item(item: dict):
    print("=" * 120)
    print(
        f"{item['form_type']:<8} | {item['sentiment']:<8} | "
        f"{item['published']} | {item['company']}"
    )
    print(item["title"])
    print(item["link"])


def load_initial_seen_to_db():
    feed = parse_feed(LATEST_FILINGS_ATOM)

    print(f"[INIT] feed entries: {len(feed.entries)}")
    saved_count = 0

    for entry in feed.entries:
        accession = extract_accession(entry)
        if not accession:
            continue

        if exists_accession(accession):
            continue

        title = getattr(entry, "title", "").strip()
        summary = getattr(entry, "summary", "").strip()
        link = getattr(entry, "link", "").strip()
        published = getattr(entry, "published", "") or getattr(entry, "updated", "")
        form_type = extract_form_type(entry)
        company = extract_company(entry)
        sentiment = classify_entry(form_type, title, summary)

        item = {
            "accession": accession,
            "company": company,
            "form_type": form_type,
            "sentiment": sentiment,
            "published": published,
            "title": title,
            "link": link,
        }

        insert_filing(item)
        saved_count += 1

    print(f"[INIT] 초기 DB 적재 완료: {saved_count}건")
    print("[INIT] 초기 적재된 공시는 알림 보내지 않음")


def poll_latest_filings():
    feed = parse_feed(LATEST_FILINGS_ATOM)

    print(f"\n[DEBUG] polling... feed entries={len(feed.entries)}")

    new_count_all = 0
    filtered_target_count = 0
    notified_count = 0

    new_items = []

    for entry in feed.entries:
        accession = extract_accession(entry)
        if not accession:
            continue

        if exists_accession(accession):
            continue

        new_count_all += 1

        title = getattr(entry, "title", "").strip()
        summary = getattr(entry, "summary", "").strip()
        link = getattr(entry, "link", "").strip()
        published = getattr(entry, "published", "") or getattr(entry, "updated", "")
        form_type = extract_form_type(entry)
        company = extract_company(entry)
        sentiment = classify_entry(form_type, title, summary)

        item = {
            "accession": accession,
            "company": company,
            "form_type": form_type,
            "sentiment": sentiment,
            "published": published,
            "title": title,
            "link": link,
        }

        print(f"[NEW] {published} | {form_type} | {company}")
        print(f"      {title}")

        insert_filing(item)

        if form_type in TARGET_FORMS and sentiment == "호재가능":
            filtered_target_count += 1
            new_items.append(item)
        else:
            print(f"[SKIP] form={form_type}, sentiment={sentiment}")

    new_items.sort(key=lambda x: x["published"])

    for item in new_items:
        print_item(item)
        notify_windows(item)
        notified_count += 1

    print(
        f"[DEBUG] 새 공시 전체={new_count_all}, "
        f"관심폼={filtered_target_count}, "
        f"출력/알림={notified_count}"
    )

    if new_count_all == 0:
        print("[DEBUG] 이번 polling에서는 신규 공시가 없음")


if __name__ == "__main__":
    init_db()

    if WIN_TOAST_AVAILABLE:
        print("[INFO] 윈도우 알림 사용 가능")
    else:
        print("[INFO] win11toast 미설치 또는 사용 불가 -> 콘솔 출력만 진행")

    print("[INFO] SEC Latest Filings 초기 적재 시작")
    load_initial_seen_to_db()
    print("[INFO] SEC Latest Filings 전체 감시 시작")

    while True:
        try:
            poll_latest_filings()
        except Exception as e:
            print("[ERROR]", e)

        time.sleep(POLL_SECONDS)