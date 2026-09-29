import { AxiosInstance } from 'axios';

// Мовчазний трекінг воронки публічної сторінки бронювання — дані видно
// лише в platform-admin (окрема автентифікація на бекенді), власник салону
// й майстри в CRM цього не бачать. Best-effort: жоден виклик тут не має
// впливати на UX сторінки бронювання (немає throw, немає loading-стану).

export type BookingFunnelEvent =
  | 'page_view'
  | 'master_selected'
  | 'service_selected'
  | 'slot_selected'
  | 'contacts_entered'
  | 'submit_success'
  | 'submit_failed';

const VISITOR_ID_KEY = 'hirnix_visitor_id';
const SESSION_ID_KEY = 'hirnix_session_id';
const ATTRIBUTION_KEY = 'hirnix_attribution';

const randomId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Переживає окремі відвідування того самого браузера — localStorage.
export const getVisitorId = (): string | undefined => {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return undefined; // приватний режим тощо — трекінг просто пропускає visitorId
  }
};

// Одна "сесія" бронювання = одна вкладка — sessionStorage.
export const getSessionId = (): string | undefined => {
  try {
    let id = sessionStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = randomId();
      sessionStorage.setItem(SESSION_ID_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
};

interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}

// BookingPage — one-page state machine без переходів між URL, тож utm/
// referrer читаємо один раз (при першому виклику в сесії) і кешуємо —
// інакше кроки воронки після першого не мали б параметрів запиту в адресі.
export const getAttribution = (): Attribution => {
  try {
    const cached = sessionStorage.getItem(ATTRIBUTION_KEY);
    if (cached) return JSON.parse(cached);
  } catch {
    // ignore — рахуємо наново нижче
  }

  const params = new URLSearchParams(window.location.search);
  const attribution: Attribution = {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
    referrer: document.referrer ? document.referrer.slice(0, 500) : undefined,
  };

  try {
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {
    // приватний режим тощо — просто не кешуємо, наступний виклик порахує знову
  }

  return attribution;
};

export const trackEvent = (api: AxiosInstance, event: BookingFunnelEvent, meta?: Record<string, unknown>) => {
  const attribution = getAttribution();
  api.post('/booking/event', {
    event,
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    ...attribution,
    meta,
  }).catch(() => {});
};
