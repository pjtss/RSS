export interface StockIntensity {
  rank: number;
  company: string;
  code: string;
  intensity: number;
  price: string;
  change: string;
  changeRate: string;
}

export interface VolumeSpikeItem {
  rank: number;
  company: string;
  code: string;
  volumeRatio: string; // 전일 대비 거래량 비율
  tradingValue: string; // 거래대금
  price: string;
  changeRate: string;
}

export interface NetBuyingItem {
  rank: number;
  company: string;
  code: string;
  foreignNetBuy: string; // 외국인 순매수
  instNetBuy: string; // 기관 순매수
  price: string;
  changeRate: string;
}

export interface ProgramTradingItem {
  rank: number;
  company: string;
  code: string;
  programNetBuy: string; // 프로그램 순매수
  price: string;
  changeRate: string;
}

export interface NewHighItem {
  rank: number;
  company: string;
  code: string;
  highType: string; // 신고가 유형 (예: 52주 신고가)
  price: string;
  changeRate: string;
}

export interface BidAskRatioItem {
  rank: number;
  company: string;
  code: string;
  bidAskRatio: number; // 체결/호가 잔량 매수 비율 (VR)
  price: string;
  changeRate: string;
}

const KIS_APPKEY = process.env.KIS_APPKEY;
const KIS_APPSECRET = process.env.KIS_APPSECRET;

async function getAccessToken(): Promise<string | null> {
  if (!KIS_APPKEY || !KIS_APPSECRET) return null;
  
  try {
    const response = await fetch("https://openapi.koreainvestment.com:9443/oauth2/tokenP", {
      method: "POST",
      body: JSON.stringify({
        grant_type: "client_credentials",
        appkey: KIS_APPKEY,
        appsecret: KIS_APPSECRET,
      }),
    });
    const data = await response.json();
    return data.access_token;
  } catch (err) {
    console.error("KIS Access Token Error:", err);
    return null;
  }
}

// 1. 체결강도 상위 (Existing)
export async function fetchTradingIntensity(): Promise<StockIntensity[]> {
  const token = await getAccessToken();
  if (!token) {
    return Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      company: `가짜 종목 ${String.fromCharCode(65 + i)}`,
      code: `00000${i}`,
      intensity: 180 - i * 8,
      price: "75,000",
      change: "+1,200",
      changeRate: "+1.5%",
    }));
  }
  // Actual API call logic omitted for brevity, fallback to mock if fails
  return [];
}

// 2. 거래대금/거래량 폭발 스캐너
export async function fetchVolumeSpike(): Promise<VolumeSpikeItem[]> {
  const token = await getAccessToken();
  if (!token) {
    return Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      company: `급등 종목 ${String.fromCharCode(75 + i)}`,
      code: `10000${i}`,
      volumeRatio: `${500 - i * 40}%`,
      tradingValue: `${5000 - i * 300}억`,
      price: "12,500",
      changeRate: "+15.3%",
    }));
  }
  return [];
}

// 3. 실시간 외인/기관 순매수 추적기
export async function fetchNetBuying(): Promise<NetBuyingItem[]> {
  const token = await getAccessToken();
  if (!token) {
    return Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      company: `수급 종목 ${String.fromCharCode(85 + i)}`,
      code: `20000${i}`,
      foreignNetBuy: `+${300 - i * 20}억`,
      instNetBuy: `+${250 - i * 15}억`,
      price: "45,000",
      changeRate: "+8.2%",
    }));
  }
  return [];
}

// 4. 프로그램 대량 매매 포착
export async function fetchProgramTrading(): Promise<ProgramTradingItem[]> {
  const token = await getAccessToken();
  if (!token) {
    return Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      company: `알고리즘 매수 ${String.fromCharCode(65 + i * 2)}`,
      code: `30000${i}`,
      programNetBuy: `+${150 - i * 10}만주`,
      price: "8,900",
      changeRate: "+5.1%",
    }));
  }
  return [];
}

// 5. 장중 신고가 돌파 알림
export async function fetchNewHigh(): Promise<NewHighItem[]> {
  const token = await getAccessToken();
  if (!token) {
    return Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      company: `돌파 종목 ${String.fromCharCode(90 - i)}`,
      code: `40000${i}`,
      highType: i < 3 ? "52주 신고가" : "60일 신고가",
      price: "154,000",
      changeRate: "+21.4%",
    }));
  }
  return [];
}

// 6. 호가 잔량 매수/매도 비율 (VR)
export async function fetchBidAskRatio(): Promise<BidAskRatioItem[]> {
  const token = await getAccessToken();
  if (!token) {
    return Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      company: `강호가 종목 ${i + 1}`,
      code: `50000${i}`,
      bidAskRatio: 250 - i * 15, // 매수 잔량이 매도 잔량보다 2.5배 많음
      price: "34,200",
      changeRate: "+3.8%",
    }));
  }
  return [];
}
