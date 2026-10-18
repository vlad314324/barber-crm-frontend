// Рендер сторіс "Вільні віконця" (1080×1920) на Canvas 2D — без залежностей.
// Безпечні зони Instagram: верх ~200 px перекриває шапка профілю, низ —
// поле відповіді, тому картка з віконцями живе між ними, а брендинг hirnix
// стоїть під карткою дрібно, але читабельно.

export const STORY_W = 1080;
export const STORY_H = 1920;

export interface StoryDay { date: string; slots: string[] }

export type StoryThemeId = 'cream' | 'night' | 'blush' | 'minimal';

interface StoryTheme {
  bg: [string, string];
  blobs: string[];
  card: string;
  cardAlphaPhoto: number;
  ink: string;
  muted: string;
  accent: string;
  frame: string | null;
  arch: boolean;
  titleFont: 'serif' | 'sans';
  footerInk: string;
  footerMuted: string;
}

export const STORY_THEMES: Record<StoryThemeId, StoryTheme> = {
  cream: {
    bg: ['#f1e8de', '#ddcbb8'], blobs: ['rgba(255,255,255,0.55)', 'rgba(176,138,108,0.22)', 'rgba(255,248,240,0.6)'],
    card: '#f8f2eb', cardAlphaPhoto: 0.74, ink: '#3a2a20', muted: '#8b7363', accent: '#a47a5f',
    frame: 'rgba(164,122,95,0.35)', arch: true, titleFont: 'serif', footerInk: '#3a2a20', footerMuted: '#8b7363',
  },
  night: {
    bg: ['#24201d', '#100e0d'], blobs: ['rgba(201,163,106,0.16)', 'rgba(120,96,70,0.18)', 'rgba(201,163,106,0.08)'],
    card: '#1b1816', cardAlphaPhoto: 0.7, ink: '#f4ede3', muted: '#a8998a', accent: '#cfa86e',
    frame: 'rgba(207,168,110,0.4)', arch: true, titleFont: 'serif', footerInk: '#f4ede3', footerMuted: '#a8998a',
  },
  blush: {
    bg: ['#f8e8e5', '#e9c3c0'], blobs: ['rgba(255,255,255,0.6)', 'rgba(196,120,130,0.2)', 'rgba(255,236,232,0.7)'],
    card: '#fff7f5', cardAlphaPhoto: 0.74, ink: '#4a2b2f', muted: '#a07378', accent: '#c27a85',
    frame: 'rgba(194,122,133,0.35)', arch: true, titleFont: 'serif', footerInk: '#4a2b2f', footerMuted: '#a07378',
  },
  minimal: {
    bg: ['#f4f4f2', '#e7e7e4'], blobs: [],
    card: '#ffffff', cardAlphaPhoto: 0.86, ink: '#141414', muted: '#7a7a7a', accent: '#141414',
    frame: null, arch: false, titleFont: 'sans', footerInk: '#141414', footerMuted: '#7a7a7a',
  },
};

export type StoryCta =
  | { kind: 'booking'; label: string; url: string; qr: HTMLCanvasElement | null }
  | { kind: 'text'; text: string };

export interface StoryOptions {
  days: StoryDay[];
  title: string;
  subtitle: string;
  overline: string;
  theme: StoryThemeId;
  photo: HTMLImageElement | null;
  cta: StoryCta;
  locale: string;
  emptyText: string;
  brandCaption: string;
}

const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = 'Manrope, system-ui, sans-serif';
const SCRIPT = '"Marck Script", cursive';
const HIRNIX_GREEN = '#2f8f6b';

// ── шрифти ────────────────────────────────────────────────────────────────
// Декоративні шрифти потрібні лише сторіс, тож підвантажуються тут, а не в
// index.html (не гальмують решту застосунку).
let fontsReady: Promise<void> | null = null;
export function ensureStoryFonts(): Promise<void> {
  if (fontsReady) return fontsReady;
  fontsReady = new Promise<void>((resolve) => {
    const href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Marck+Script&display=swap';
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    const done = () => {
      const sample = 'Вільні віконця 0123 ABC';
      Promise.all([
        document.fonts.load(`600 100px "Cormorant Garamond"`, sample),
        document.fonts.load(`italic 500 40px "Cormorant Garamond"`, sample),
        document.fonts.load(`40px "Marck Script"`, sample),
        document.fonts.load(`500 40px Manrope`, sample),
        document.fonts.load(`700 40px Manrope`, sample),
        document.fonts.load(`800 40px Manrope`, sample),
      ]).catch(() => undefined).then(() => resolve());
    };
    link.onload = done;
    link.onerror = () => resolve();
    document.head.appendChild(link);
    // Мережа повільна/заблокована — малюємо запасними шрифтами.
    setTimeout(resolve, 5000);
  });
  return fontsReady;
}

// ── дрібні помічники ─────────────────────────────────────────────────────
type Ctx = CanvasRenderingContext2D;

function fitFont(ctx: Ctx, text: string, build: (size: number) => string, maxSize: number, minSize: number, maxWidth: number) {
  let size = maxSize;
  for (; size > minSize; size -= 2) {
    ctx.font = build(size);
    if (ctx.measureText(text).width <= maxWidth) break;
  }
  ctx.font = build(size);
  return size;
}

function spacedWidth(ctx: Ctx, text: string, spacing: number) {
  return ctx.measureText(text).width + spacing * Math.max(0, text.length - 1);
}

function drawSpaced(ctx: Ctx, text: string, cx: number, y: number, spacing: number) {
  let x = cx - spacedWidth(ctx, text, spacing) / 2;
  const prev = ctx.textAlign;
  ctx.textAlign = 'left';
  for (const ch of text) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + spacing;
  }
  ctx.textAlign = prev;
}

function heartPath(ctx: Ctx, cx: number, cy: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.42);
  ctx.bezierCurveTo(cx - s * 0.62, cy - s * 0.02, cx - s * 0.44, cy - s * 0.58, cx, cy - s * 0.22);
  ctx.bezierCurveTo(cx + s * 0.44, cy - s * 0.58, cx + s * 0.62, cy - s * 0.02, cx, cy + s * 0.42);
  ctx.closePath();
}

function ornament(ctx: Ctx, cx: number, y: number, halfWidth: number, color: string, minimal: boolean) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.75;
  const gap = minimal ? 0 : 26;
  ctx.beginPath();
  ctx.moveTo(cx - halfWidth, y);
  ctx.lineTo(cx - gap, y);
  ctx.moveTo(cx + gap, y);
  ctx.lineTo(cx + halfWidth, y);
  ctx.stroke();
  if (!minimal) {
    ctx.globalAlpha = 0.9;
    heartPath(ctx, cx, y + 1, 22);
    ctx.fill();
  }
  ctx.restore();
}

function cardPath(ctx: Ctx, x: number, y: number, w: number, h: number, arch: boolean, r: number) {
  ctx.beginPath();
  if (arch) {
    const ry = Math.min(190, h / 3);
    ctx.moveTo(x, y + h - r);
    ctx.lineTo(x, y + ry);
    ctx.ellipse(x + w / 2, y + ry, w / 2, ry, 0, Math.PI, 0);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
  }
  ctx.closePath();
}

function drawCover(ctx: Ctx, img: CanvasImageSource & { width: number; height: number }, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

let noiseCanvas: HTMLCanvasElement | null = null;
function noise(): HTMLCanvasElement {
  if (noiseCanvas) return noiseCanvas;
  const c = document.createElement('canvas');
  c.width = 540;
  c.height = 960;
  const nctx = c.getContext('2d')!;
  const data = nctx.createImageData(c.width, c.height);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.random() * 255;
    data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v; data.data[i + 3] = 255;
  }
  nctx.putImageData(data, 0, 0);
  noiseCanvas = c;
  return c;
}

// Розмите фото під "скляну" картку: зменшення й масштабування назад — це
// працює скрізь, на відміну від ctx.filter (немає в Safari).
function blurred(img: HTMLImageElement): HTMLCanvasElement {
  const small = document.createElement('canvas');
  small.width = 54;
  small.height = 96;
  drawCover(small.getContext('2d')!, img, small.width, small.height);
  const mid = document.createElement('canvas');
  mid.width = 270;
  mid.height = 480;
  const mctx = mid.getContext('2d')!;
  mctx.imageSmoothingQuality = 'high';
  mctx.drawImage(small, 0, 0, mid.width, mid.height);
  return mid;
}

// Марка hirnix: зелений скруглений квадрат із білою "h" і листком —
// векторно, бо public/icon.png лише 64 px.
export function drawHirnixMark(ctx: Ctx, x: number, y: number, s: number) {
  ctx.save();
  ctx.fillStyle = HIRNIX_GREEN;
  ctx.beginPath();
  ctx.roundRect(x, y, s, s, s * 0.26);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.fillStyle = '#fff';
  ctx.lineWidth = s * 0.115;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x + s * 0.32, y + s * 0.24);
  ctx.lineTo(x + s * 0.32, y + s * 0.77);
  ctx.moveTo(x + s * 0.32, y + s * 0.6);
  ctx.arc(x + s * 0.48, y + s * 0.6, s * 0.16, Math.PI, 0);
  ctx.lineTo(x + s * 0.64, y + s * 0.77);
  ctx.stroke();
  // листок угорі праворуч
  const lx = x + s * 0.53;
  const ly = y + s * 0.4;
  const tx = x + s * 0.8;
  const ty = y + s * 0.18;
  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.quadraticCurveTo(x + s * 0.56, y + s * 0.17, tx, ty);
  ctx.quadraticCurveTo(x + s * 0.8, y + s * 0.39, lx, ly);
  ctx.fill();
  ctx.restore();
}

// ── рядки з віконцями ────────────────────────────────────────────────────
interface Line { dayIdx: number; first: boolean; times: string[] }

function isoWeekKey(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7; // пн = 0
  return new Date(d.getTime() - day * 86400000).toISOString().slice(0, 10);
}

function layoutLines(ctx: Ctx, days: StoryDay[], fontSize: number, timesWidth: number) {
  ctx.font = `500 ${fontSize}px ${SANS}`;
  const sepW = fontSize * 1.1;
  const lines: Line[] = [];
  days.forEach((day, dayIdx) => {
    let current: string[] = [];
    let width = 0;
    let first = true;
    for (const t of day.slots) {
      const w = ctx.measureText(t).width;
      const next = current.length ? width + sepW + w : w;
      if (current.length && next > timesWidth) {
        lines.push({ dayIdx, first, times: current });
        first = false;
        current = [t];
        width = w;
      } else {
        current.push(t);
        width = next;
      }
    }
    lines.push({ dayIdx, first, times: current });
  });
  return lines;
}

// ── головний рендер ──────────────────────────────────────────────────────
export function renderStory(canvas: HTMLCanvasElement, o: StoryOptions) {
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext('2d')!;
  const th = STORY_THEMES[o.theme];
  const W = STORY_W;
  const H = STORY_H;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';

  // Фон
  if (o.photo) {
    drawCover(ctx, o.photo, W, H);
    const shade = ctx.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, 'rgba(0,0,0,0.28)');
    shade.addColorStop(0.5, 'rgba(0,0,0,0.05)');
    shade.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
    g.addColorStop(0, th.bg[0]);
    g.addColorStop(1, th.bg[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const spots: [number, number, number][] = [[W * 0.1, H * 0.12, 520], [W * 0.95, H * 0.55, 620], [W * 0.2, H * 0.92, 560]];
    th.blobs.forEach((color, i) => {
      const [x, y, r] = spots[i % spots.length];
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, color);
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    });
  }
  // Легке зерно — прибирає "пластиковість" градієнтів і фото.
  ctx.save();
  ctx.globalAlpha = o.theme === 'night' ? 0.05 : 0.035;
  ctx.drawImage(noise(), 0, 0, W, H);
  ctx.restore();

  // Картка
  const cx = W / 2;
  const cardX = 84;
  const cardW = W - cardX * 2;
  const cardTop = 196;
  const cardBottom = 1676;
  const cardH = cardBottom - cardTop;
  const radius = th.arch ? 44 : 40;

  ctx.save();
  ctx.shadowColor = 'rgba(40,24,12,0.16)';
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 24;
  cardPath(ctx, cardX, cardTop, cardW, cardH, th.arch, radius);
  ctx.fillStyle = th.card;
  if (o.photo) ctx.globalAlpha = 0.01; // тінь без заливки — заливка нижче
  ctx.fill();
  ctx.restore();

  ctx.save();
  cardPath(ctx, cardX, cardTop, cardW, cardH, th.arch, radius);
  ctx.clip();
  if (o.photo) {
    ctx.drawImage(blurred(o.photo), 0, 0, W, H);
    ctx.globalAlpha = th.cardAlphaPhoto;
  }
  ctx.fillStyle = th.card;
  ctx.fillRect(cardX, cardTop, cardW, cardH);
  ctx.restore();

  if (th.frame) {
    ctx.save();
    ctx.strokeStyle = th.frame;
    ctx.lineWidth = 2;
    const inset = 22;
    cardPath(ctx, cardX + inset, cardTop + inset, cardW - inset * 2, cardH - inset * 2, th.arch, radius - 12);
    ctx.stroke();
    ctx.restore();
  }

  const innerW = cardW - 150;
  // Довгий період — компактна шапка й заклик, щоб віконцям лишилось місце.
  const dayCount = o.days.filter((d) => d.slots.length).length;
  const compact = dayCount > 7;
  let y = cardTop + (th.arch ? (compact ? 104 : 118) : (compact ? 84 : 96));

  // Сердечко-орнамент угорі (контур), як на рукописних сторіс
  if (th.arch) {
    ctx.save();
    ctx.strokeStyle = th.accent;
    ctx.lineWidth = 3;
    heartPath(ctx, cx, y - 14, compact ? 38 : 46);
    ctx.stroke();
    ctx.restore();
    y += compact ? 56 : 66;
  }

  // Над заголовком: салон · майстер
  if (o.overline) {
    ctx.fillStyle = th.muted;
    const text = o.overline.toUpperCase();
    let size = 26;
    for (; size > 16; size--) {
      ctx.font = `700 ${size}px ${SANS}`;
      if (spacedWidth(ctx, text, size * 0.28) <= innerW - 80) break;
    }
    drawSpaced(ctx, text, cx, y, size * 0.28);
    y += 34;
  }

  // Заголовок: по слову на рядок, якщо слів два, як "ВІЛЬНІ / ВІКОНЦЯ"
  const titleText = th.titleFont === 'serif' ? o.title.toUpperCase() : o.title;
  const words = titleText.trim().split(/\s+/);
  const titleFontFn = (s: number) => th.titleFont === 'serif' ? `600 ${s}px ${SERIF}` : `800 ${s}px ${SANS}`;
  const oneLineMax = th.titleFont === 'serif' ? 112 : 92;
  let titleLines = words.length === 2 && !compact ? words : [titleText.trim()];
  if (compact && words.length === 2) {
    ctx.font = titleFontFn(oneLineMax);
    // Навіть дрібніше не влазить в один рядок — лишаємо два.
    if (ctx.measureText(titleText).width > innerW * 1.25) titleLines = words;
  }
  const longest = titleLines.reduce((a, b) => (a.length >= b.length ? a : b), '');
  const titleMax = compact ? oneLineMax : (th.titleFont === 'serif' ? 150 : 118);
  const titleSize = fitFont(ctx, longest, titleFontFn, titleMax, 48, innerW);
  ctx.fillStyle = th.ink;
  const titleLh = titleSize * (th.titleFont === 'serif' ? 0.98 : 1.04);
  y += titleSize * 0.86;
  titleLines.forEach((line, i) => {
    ctx.font = titleFontFn(titleSize);
    ctx.fillText(line, cx, y + i * titleLh);
  });
  y += (titleLines.length - 1) * titleLh;

  if (o.subtitle) {
    y += compact ? 54 : 64;
    ctx.fillStyle = th.muted;
    fitFont(ctx, o.subtitle, (s) => th.titleFont === 'serif' ? `italic 500 ${s}px ${SERIF}` : `500 ${s}px ${SANS}`, th.titleFont === 'serif' ? 50 : 36, 26, innerW);
    ctx.fillText(o.subtitle, cx, y);
  }
  y += compact ? 46 : 56;
  ornament(ctx, cx, y, innerW / 2 - 40, th.accent, !th.arch);
  const rowsTop = y + (compact ? 36 : 50);

  // Заклик унизу картки
  const ctaHeight = o.cta.kind === 'booking' ? (compact ? 196 : 236) : (compact ? 124 : 150);
  const ctaTop = cardBottom - (compact ? 58 : 70) - ctaHeight;
  ornament(ctx, cx, ctaTop - 6, innerW / 2 - 40, th.accent, !th.arch);
  drawCta(ctx, o.cta, th, cx, ctaTop + 30, ctaHeight - 30, innerW, compact);
  const rowsBottom = ctaTop - (compact ? 36 : 50);

  // Віконця
  const days = o.days.filter((d) => d.slots.length);
  if (!days.length) {
    ctx.fillStyle = th.muted;
    fitFont(ctx, o.emptyText, (s) => `italic 500 ${s}px ${SERIF}`, 56, 30, innerW);
    ctx.fillText(o.emptyText, cx, (rowsTop + rowsBottom) / 2);
  } else {
    drawRows(ctx, days, th, o.locale, rowsTop, rowsBottom, innerW);
  }

  // Брендинг hirnix під карткою
  drawBrand(ctx, o, th, cx, cardBottom + 96);
}

interface RowLabel { date: string; wd: string }

interface ColumnPlan {
  lines: Line[];
  height: number;
  blockW: number;
  prefixW: number;
  dateW: number;
  wdW: number;
}

const ROW_LH = 1.62;
const WEEK_GAP = 1.35;

// Розкладка однієї колонки рядків при заданому кеглі й ширині.
function planColumn(ctx: Ctx, days: StoryDay[], labels: RowLabel[], weekKeys: string[], size: number, width: number): ColumnPlan {
  ctx.font = `700 ${size}px ${SANS}`;
  const dateW = Math.max(...labels.map((l) => ctx.measureText(l.date).width));
  ctx.font = `500 ${size * 0.62}px ${SANS}`;
  const wdW = Math.max(...labels.map((l) => ctx.measureText(l.wd).width));
  const prefixW = dateW + size * 0.4 + wdW + size * 1.95;
  const lines = layoutLines(ctx, days, size, width - prefixW);
  const breaks = weekKeys.filter((k, i) => i > 0 && k !== weekKeys[i - 1]).length;
  ctx.font = `500 ${size}px ${SANS}`;
  const sepW = size * 1.1;
  const timesW = (times: string[]) => times.reduce((acc, t, i) => acc + ctx.measureText(t).width + (i ? sepW : 0), 0);
  return {
    lines,
    height: lines.length * size * ROW_LH + breaks * size * WEEK_GAP,
    blockW: Math.max(...lines.map((l) => prefixW + timesW(l.times))),
    prefixW, dateW, wdW,
  };
}

// Розбиття на дві колонки — по межі тижня, найближчій до середини.
function splitAtWeek(weekKeys: string[]) {
  let best = Math.ceil(weekKeys.length / 2);
  let bestDist = Infinity;
  weekKeys.forEach((k, i) => {
    if (i > 0 && k !== weekKeys[i - 1]) {
      const dist = Math.abs(i - weekKeys.length / 2);
      if (dist < bestDist) { bestDist = dist; best = i; }
    }
  });
  return bestDist <= weekKeys.length / 4 ? best : Math.ceil(weekKeys.length / 2);
}

type RowsPlan = { size: number; cols: { from: number; to: number; plan: ColumnPlan }[] };

function drawRows(ctx: Ctx, days: StoryDay[], th: StoryTheme, locale: string, top: number, bottom: number, innerW: number) {
  const wdFmt = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  const labels: RowLabel[] = days.map((d) => {
    const [, m, day] = d.date.split('-');
    return { date: `${day}.${m}`, wd: wdFmt.format(new Date(`${d.date}T00:00:00Z`)).replace('.', '') };
  });
  const weekKeys = days.map((d) => isoWeekKey(d.date));
  const avail = bottom - top;
  const colGap = 56;

  // Кегль підбираємо від більшого до меншого: спершу одна колонка без
  // переносів часу (найчистіше), далі з переносами, далі дві колонки.
  const single = (size: number, allowWrap: boolean): RowsPlan | null => {
    const plan = planColumn(ctx, days, labels, weekKeys, size, innerW);
    if (plan.height > avail) return null;
    if (!allowWrap && plan.lines.length > days.length) return null;
    return { size, cols: [{ from: 0, to: days.length, plan }] };
  };
  const double = (size: number): RowsPlan | null => {
    if (days.length < 2) return null;
    const cut = splitAtWeek(weekKeys);
    const colW = (innerW + 60 - colGap) / 2;
    const cols = [[0, cut], [cut, days.length]].map(([from, to]) => ({
      from, to,
      plan: planColumn(ctx, days.slice(from, to), labels.slice(from, to), weekKeys.slice(from, to), size, colW),
    }));
    if (cols.some((c) => c.plan.height > avail)) return null;
    return { size, cols };
  };
  let chosen: RowsPlan | null = null;
  for (let s = 56; s >= 34 && !chosen; s--) chosen = single(s, false);
  for (let s = 50; s >= 30 && !chosen; s--) chosen = single(s, true);
  for (let s = 40; s >= 22 && !chosen; s--) chosen = double(s);
  for (let s = 29; s >= 14 && !chosen; s--) chosen = single(s, true);
  if (!chosen) chosen = { size: 14, cols: [{ from: 0, to: days.length, plan: planColumn(ctx, days, labels, weekKeys, 14, innerW) }] };

  const size = chosen.size;
  const lh = size * ROW_LH;
  const weekGap = size * WEEK_GAP;
  const totalW = chosen.cols.reduce((acc, c, i) => acc + c.plan.blockW + (i ? colGap : 0), 0);
  let left = STORY_W / 2 - totalW / 2;
  const sepW = size * 1.1;

  ctx.textAlign = 'left';
  for (const col of chosen.cols) {
    const { plan } = col;
    const keys = weekKeys.slice(col.from, col.to);
    const labs = labels.slice(col.from, col.to);
    let y = top + Math.max(0, (avail - plan.height) / 2) + lh * 0.62;
    plan.lines.forEach((line, i) => {
      if (i > 0 && line.first && keys[line.dayIdx] !== keys[plan.lines[i - 1].dayIdx]) {
        ornament(ctx, left + plan.blockW / 2, y - lh * 0.62 + weekGap * 0.5 - size * 0.12, Math.min(plan.blockW / 2, 200), th.accent, !th.arch);
        y += weekGap;
      }
      if (line.first) {
        const lab = labs[line.dayIdx];
        ctx.fillStyle = th.ink;
        ctx.font = `700 ${size}px ${SANS}`;
        ctx.fillText(lab.date, left, y);
        ctx.fillStyle = th.muted;
        ctx.font = `500 ${size * 0.62}px ${SANS}`;
        ctx.fillText(lab.wd, left + plan.dateW + size * 0.4, y);
        ctx.fillStyle = th.accent;
        ctx.font = `500 ${size}px ${SANS}`;
        ctx.fillText('—', left + plan.dateW + size * 0.4 + plan.wdW + size * 0.32, y);
      }
      let x = left + plan.prefixW;
      ctx.font = `500 ${size}px ${SANS}`;
      line.times.forEach((t, ti) => {
        if (ti) {
          ctx.fillStyle = th.accent;
          ctx.beginPath();
          ctx.arc(x + sepW / 2, y - size * 0.34, Math.max(2.5, size * 0.07), 0, Math.PI * 2);
          ctx.fill();
          x += sepW;
        }
        ctx.fillStyle = th.ink;
        ctx.fillText(t, x, y);
        x += ctx.measureText(t).width;
      });
      y += lh;
    });
    left += plan.blockW + colGap;
  }
  ctx.textAlign = 'center';
}

function drawCta(ctx: Ctx, cta: StoryCta, th: StoryTheme, cx: number, top: number, height: number, innerW: number, compact = false) {
  if (cta.kind === 'text') {
    ctx.fillStyle = th.ink;
    const size = fitFont(ctx, cta.text, (s) => `${s}px ${SCRIPT}`, 84, 40, innerW - 90);
    const w = ctx.measureText(cta.text).width;
    const baseline = top + height / 2 + size * 0.3;
    ctx.fillText(cta.text, cx - 30, baseline);
    ctx.fillStyle = th.accent;
    heartPath(ctx, cx - 30 + w / 2 + 44, baseline - size * 0.3, 40);
    ctx.fill();
    return;
  }
  const qrSize = cta.qr ? (compact ? 160 : 196) : 0;
  const gap = cta.qr ? 44 : 0;
  ctx.font = `600 54px ${SERIF}`;
  const labelW = ctx.measureText(cta.label).width;
  ctx.font = `700 30px ${SANS}`;
  const urlW = ctx.measureText(cta.url).width;
  const textW = Math.min(Math.max(labelW, urlW), innerW - qrSize - gap);
  const groupW = qrSize + gap + textW;
  const left = cx - groupW / 2;
  const mid = top + height / 2;
  if (cta.qr) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.08)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(left, mid - qrSize / 2, qrSize, qrSize, 22);
    ctx.fill();
    ctx.restore();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cta.qr, left + 18, mid - qrSize / 2 + 18, qrSize - 36, qrSize - 36);
    ctx.imageSmoothingEnabled = true;
  }
  ctx.textAlign = cta.qr ? 'left' : 'center';
  const tx = cta.qr ? left + qrSize + gap : cx;
  ctx.fillStyle = th.ink;
  fitFont(ctx, cta.label, (s) => th.titleFont === 'serif' ? `600 ${s}px ${SERIF}` : `800 ${s}px ${SANS}`, th.titleFont === 'serif' ? 58 : 44, 30, textW);
  ctx.fillText(cta.label, tx, mid - 6);
  ctx.fillStyle = th.accent;
  fitFont(ctx, cta.url, (s) => `700 ${s}px ${SANS}`, 30, 18, textW);
  ctx.fillText(cta.url, tx, mid + 44);
  ctx.textAlign = 'center';
}

function drawBrand(ctx: Ctx, o: StoryOptions, th: StoryTheme, cx: number, y: number) {
  const onPhoto = !!o.photo;
  const ink = onPhoto ? '#ffffff' : th.footerInk;
  const muted = onPhoto ? 'rgba(255,255,255,0.82)' : th.footerMuted;
  const mark = 52;
  ctx.save();
  if (onPhoto) {
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 16;
  }
  ctx.font = `500 26px ${SANS}`;
  const capW = ctx.measureText(o.brandCaption).width;
  ctx.font = `800 40px ${SANS}`;
  const nameW = ctx.measureText('hirnix').width;
  const total = capW + 18 + mark + 14 + nameW;
  let x = cx - total / 2;
  ctx.textAlign = 'left';
  ctx.fillStyle = muted;
  ctx.font = `500 26px ${SANS}`;
  ctx.fillText(o.brandCaption, x, y + 9);
  x += capW + 18;
  ctx.restore();
  drawHirnixMark(ctx, x, y - mark / 2 - 4, mark);
  x += mark + 14;
  ctx.save();
  if (onPhoto) {
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 16;
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = ink;
  ctx.font = `800 40px ${SANS}`;
  ctx.fillText('hirnix', x, y + 12);
  ctx.restore();
}
