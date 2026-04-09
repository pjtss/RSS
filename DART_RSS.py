import re
import time
import sqlite3
import feedparser
import pandas as pd
from win11toast import toast

RSS_URL = "https://dart.fss.or.kr/api/todayRSS.xml"
POLL_SECONDS = 10
DB_PATH = "dart_temp.db"

IMPORTANT_KEYWORDS = [
    "단일판매", "공급계약", "영업이익", "매출액", "잠정",
    "자기주식", "자사주", "합병", "분할", "최대주주",
    "투자판단관련", "영업정지", "유상증자", "전환사채",
    "무상증자", "조회공시", "불성실", "소송", "회생",
    "특허", "계약", "수주"
]

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS disclosures (
            link TEXT PRIMARY KEY,
            company_name TEXT NOT NULL,
            title TEXT NOT NULL,
            judgment TEXT NOT NULL,
            keywords TEXT,
            published_at TEXT
        )
    """)
    conn.commit()
    return conn

def show_windows_notification(row: dict):
    title = f"[{row['판단']}] {row['회사명']}"
    body = f"{row['공시제목']}\n{row['공시시각']}"

    try:
        _ = toast(title, body)
    except Exception as e:
        print(f"알림 오류: {e}")

def extract_company(title: str) -> str:
    title = (title or "").strip()

    # 앞에 (기타), [정정], [기재정정] 같은 머리표 제거
    title = re.sub(r"^\s*(\([^)]+\)|\[[^\]]+\])\s*", "", title)

    # "회사명 - 공시제목" 에서 회사명만 추출
    match = re.match(r"^\s*([^-]{1,40}?)\s*-\s*", title)
    if match:
        return match.group(1).strip()

    # 하이픈 구조가 없으면 앞부분만 fallback
    match = re.match(r"^\s*([^\(\)\[\]:]{2,40})", title)
    if match:
        return match.group(1).strip()

    return "종목명미확인"

def classify_title(title: str) -> str:
    title = (title or "").strip()

    negative_keywords = [
        "유상증자", "전환사채", "신주인수권부사채", "교환사채", "감자",
        "소송", "피소", "회생", "파산", "영업정지", "불성실", "불성실공시",
        "관리종목", "상장적격성", "투자주의", "투자경고", "투자위험", "단기과열",
        "최대주주변경", "최대주주 변경", "지분변동", "주식등의대량보유상황보고서",
        "해지", "철회", "정정", "조회공시", "조회공시요구",
        "반기보고서", "분기보고서", "사업보고서", "감사보고서",
        "주주총회", "주주총회소집", "참고사항", "안내공시"
    ]

    strong_positive_keywords = [
        "단일판매ㆍ공급계약체결", "단일판매·공급계약체결", "단일판매공급계약체결",
        "공급계약체결", "단일판매계약체결", "대규모수주", "수주",
        "특허권취득", "특허 취득", "자기주식취득", "자기주식 취득", "자사주 취득",
        "무상증자", "현금ㆍ현물배당결정", "현금·현물배당결정", "배당결정",
        "흑자전환", "영업이익 증가", "매출액 증가", "당기순이익 증가",
        "대규모 공급계약", "계약체결"
    ]

    weak_positive_keywords = [
        "투자판단관련 주요경영사항",
        "투자판단관련주요경영사항",
        "잠정실적",
        "영업이익",
        "매출액"
    ]

    if any(k in title for k in negative_keywords):
        return "악재"
    if any(k in title for k in strong_positive_keywords):
        return "최강호재"
    if any(k in title for k in weak_positive_keywords):
        return "호재가능"
    return "중립"

def extract_keywords(title: str) -> str:
    hits = [k for k in IMPORTANT_KEYWORDS if k in title]
    return ", ".join(hits) if hits else ""

def load_dart_rss_dataframe():
    feed = feedparser.parse(RSS_URL)
    rows = []

    for entry in feed.entries:
        title = getattr(entry, "title", "").strip()
        link = getattr(entry, "link", "").strip()
        published = getattr(entry, "published", "").strip()

        judgment = classify_title(title)
        if judgment not in ["최강호재", "호재가능"]:
            continue

        rows.append({
            "회사명": extract_company(title),
            "공시제목": title,
            "판단": judgment,
            "키워드": extract_keywords(title),
            "공시시각": published,
            "링크": link
        })

    return pd.DataFrame(rows)

def exists_link(conn, link: str) -> bool:
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM disclosures WHERE link = ?", (link,))
    return cur.fetchone() is not None

def save_disclosure(conn, row: dict):
    cur = conn.cursor()
    cur.execute("""
        INSERT OR IGNORE INTO disclosures (
            link, company_name, title, judgment, keywords, published_at
        ) VALUES (?, ?, ?, ?, ?, ?)
    """, (
        row["링크"],
        row["회사명"],
        row["공시제목"],
        row["판단"],
        row["키워드"],
        row["공시시각"]
    ))
    conn.commit()

def poll_dart_rss():
    conn = init_db()
    print("DART RSS polling 시작")

    while True:
        try:
            df = load_dart_rss_dataframe()

            if df.empty:
                print("호재 공시 없음")
            else:
                new_rows = []

                for _, row in df.iterrows():
                    row_dict = row.to_dict()
                    if not exists_link(conn, row_dict["링크"]):
                        new_rows.append(row_dict)

                if new_rows:
                    new_df = pd.DataFrame(new_rows)
                    print("\n[새 호재 공시 감지]")
                    print(new_df.to_string(index=False))

                    for row in new_rows:
                        show_windows_notification(row)
                        save_disclosure(conn, row)
                else:
                    print("새 호재 공시 없음")

        except Exception as e:
            print(f"오류 발생: {e}")

        time.sleep(POLL_SECONDS)

if __name__ == "__main__":
    poll_dart_rss()
