import { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { addDays, endOfMonth, format } from 'date-fns';
import { Share2, Download, Copy, Check, Loader2 } from 'lucide-react';
import Modal from '../Modal';
import ImageCropField, { ImageChange } from '../ImageCropField';
import { appointmentApi } from '../../api';
import { Employee } from '../../api/types';
import { useLocale } from '../../i18n/LocaleContext';
import { getErrorMessage } from '../../utils/errors';
import { downloadBlob } from '../../utils/download';
import { getSiteUrl } from '../../utils/siteUrl';
import { getSalonSlug } from '../../utils/tenant';
import { ensureStoryFonts, renderStory, STORY_THEMES, StoryDay, StoryThemeId } from './storyRenderer';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  // Майстер (barber) робить сторіс лише про себе — вибору немає.
  fixedEmployeeId?: string;
  shopName?: string;
}

type Preset = '7' | '14' | 'month' | 'custom';
const STEPS = [60, 90, 120, 150, 180];
const THEMES = Object.keys(STORY_THEMES) as StoryThemeId[];
const ymd = (d: Date) => format(d, 'yyyy-MM-dd');

const presetRange = (preset: Preset): [string, string] => {
  const today = new Date();
  if (preset === '14') return [ymd(today), ymd(addDays(today, 13))];
  if (preset === 'month') return [ymd(today), ymd(endOfMonth(today))];
  return [ymd(today), ymd(addDays(today, 6))];
};

// Чи вміє браузер ділитися файлом (телефон → меню з Instagram).
const canShareFiles = (() => {
  try {
    const probe = new File([new Blob()], 'x.png', { type: 'image/png' });
    return typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [probe] });
  } catch {
    return false;
  }
})();

const StoryModal = ({ isOpen, onClose, employees, fixedEmployeeId, shopName }: Props) => {
  const { t, lang } = useLocale();
  const locale = lang === 'uk' ? 'uk-UA' : 'en-US';

  const [employeeId, setEmployeeId] = useState(fixedEmployeeId || '');
  const [preset, setPreset] = useState<Preset>('7');
  const [range, setRange] = useState<[string, string]>(() => presetRange('7'));
  const [step, setStep] = useState(120);
  const [days, setDays] = useState<StoryDay[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const [title, setTitle] = useState(t('story.defaultTitle'));
  const [theme, setTheme] = useState<StoryThemeId>('cream');
  const [photoChange, setPhotoChange] = useState<ImageChange>(null);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [ctaKind, setCtaKind] = useState<'booking' | 'text'>('booking');
  const [ctaText, setCtaText] = useState(t('story.ctaDefault'));
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<'share' | 'download' | null>(null);
  // Декоративні шрифти вантажаться кілька секунд — до першого рендеру
  // показуємо спінер замість порожнього кадру.
  const [rendered, setRendered] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);

  const slug = getSalonSlug() || '';
  const bookingUrl = `${getSiteUrl()}/book/${slug}?utm_source=instagram_story&utm_medium=story`;
  const bookingUrlLabel = `${new URL(getSiteUrl()).host}/book/${slug}`;

  // Першого майстра підставляємо, щойно список завантажився.
  useEffect(() => {
    if (!employeeId && employees.length) setEmployeeId(fixedEmployeeId || employees[0]._id);
  }, [employees, employeeId, fixedEmployeeId]);

  useEffect(() => {
    if (!isOpen || !employeeId) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    appointmentApi.freeWindows({ employeeId, from: range[0], to: range[1], step })
      .then((r) => { if (!cancelled) { setDays(r.days); setHidden(new Set()); } })
      .catch((err) => { if (!cancelled) setLoadError(getErrorMessage(err) || t('story.loadError')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, employeeId, range[0], range[1], step]);

  useEffect(() => {
    const blob = photoChange && photoChange !== 'remove' ? photoChange.blob : null;
    if (!blob) { setPhoto(null); return; }
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => setPhoto(img);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [photoChange]);

  const visibleDays = useMemo<StoryDay[]>(() => (days || [])
    .filter((d) => !hidden.has(d.date))
    .map((d) => ({ date: d.date, slots: d.slots.filter((s) => !hidden.has(`${d.date} ${s}`)) }))
    .filter((d) => d.slots.length), [days, hidden]);

  const subtitle = useMemo(() => {
    if (!visibleDays.length) return '';
    const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' });
    const a = new Date(`${visibleDays[0].date}T00:00:00Z`);
    const b = new Date(`${visibleDays[visibleDays.length - 1].date}T00:00:00Z`);
    if (a.getTime() === b.getTime()) return fmt.format(a);
    // formatRange дає "19–31 жовтня" замість "19 жовтня – 31 жовтня"
    const ranged = fmt as Intl.DateTimeFormat & { formatRange?: (x: Date, y: Date) => string };
    return ranged.formatRange ? ranged.formatRange(a, b) : `${fmt.format(a)} – ${fmt.format(b)}`;
  }, [visibleDays, locale]);

  const employee = employees.find((e) => e._id === employeeId);
  const overline = [shopName, employee?.name].filter(Boolean).join(' · ');

  // Перемальовуємо прев'ю на кожну зміну. Канвас той самий, що й для
  // експорту (1080×1920), CSS лише зменшує його.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    ensureStoryFonts().then(() => {
      if (cancelled || !canvasRef.current) return;
      renderStory(canvasRef.current, {
        days: visibleDays,
        title: title.trim() || t('story.defaultTitle'),
        subtitle,
        overline,
        theme,
        photo,
        cta: ctaKind === 'booking'
          ? { kind: 'booking', label: t('story.bookingLabel'), url: bookingUrlLabel, qr: qrRef.current }
          : { kind: 'text', text: ctaText.trim() || t('story.ctaDefault') },
        locale,
        emptyText: t('story.empty'),
        brandCaption: t('story.brandCaption'),
      });
      setRendered(true);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, visibleDays, title, subtitle, overline, theme, photo, ctaKind, ctaText, locale, bookingUrlLabel]);

  const toggle = (key: string) => setHidden((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const choosePreset = (p: Preset) => {
    setPreset(p);
    if (p !== 'custom') setRange(presetRange(p));
  };

  const toBlob = () => new Promise<Blob>((resolve, reject) => {
    const canvas = canvasRef.current;
    if (!canvas) return reject(new Error('no canvas'));
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
  const fileName = `hirnix-story-${range[0]}.png`;

  const handleShare = async () => {
    setBusy('share');
    try {
      const file = new File([await toBlob()], fileName, { type: 'image/png' });
      await navigator.share({ files: [file] });
    } catch {
      // Користувач закрив меню "Поділитися" — це не помилка.
    } finally {
      setBusy(null);
    }
  };

  const handleDownload = async () => {
    setBusy('download');
    try {
      downloadBlob(await toBlob(), fileName);
    } finally {
      setBusy(null);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard недоступний — посилання й так видно в полі
    }
  };

  const wdFmt = new Intl.DateTimeFormat(locale, { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' });
  const chip = (active: boolean) => `px-3 py-1.5 rounded-full text-sm border transition-colors ${active
    ? 'bg-brand text-white border-brand'
    : 'bg-surface text-ink-secondary border-line hover:border-line-medium'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('story.modalTitle')} size="xl">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Прев'ю */}
        <div className="md:order-2 flex flex-col items-center gap-3 md:sticky md:top-0 self-center md:self-start">
          <div className="relative w-[216px] sm:w-[252px] aspect-[9/16] rounded-lg overflow-hidden shadow-lg border border-line bg-canvas-soft">
            <canvas ref={canvasRef} width={1080} height={1920} className="w-full h-full" data-testid="story-canvas" />
            {(loading || !rendered) && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface/60">
                <Loader2 className="animate-spin text-brand" size={28} />
              </div>
            )}
          </div>
          <div className="flex gap-2 w-full">
            {canShareFiles && (
              <button type="button" onClick={handleShare} disabled={!!busy || loading || !rendered} className="btn btn-primary flex-1 justify-center">
                <Share2 size={16} /> {busy === 'share' ? t('story.preparing') : t('story.share')}
              </button>
            )}
            <button type="button" onClick={handleDownload} disabled={!!busy || loading || !rendered}
              className={`btn ${canShareFiles ? 'btn-secondary' : 'btn-primary'} flex-1 justify-center`}>
              <Download size={16} /> {canShareFiles ? 'PNG' : t('story.download')}
            </button>
          </div>
        </div>

        {/* Налаштування */}
        <div className="md:order-1 flex-1 min-w-0 space-y-5">
          {!fixedEmployeeId && employees.length > 1 && (
            <div>
              <label className="field-label">{t('story.master')}</label>
              <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="field-input">
                {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="field-label">{t('story.period')}</label>
            <div className="flex flex-wrap gap-2">
              {(['7', '14', 'month', 'custom'] as Preset[]).map((p) => (
                <button key={p} type="button" aria-pressed={preset === p} onClick={() => choosePreset(p)} className={chip(preset === p)}>
                  {t(p === '7' ? 'story.preset7' : p === '14' ? 'story.preset14' : p === 'month' ? 'story.presetMonth' : 'story.presetCustom')}
                </button>
              ))}
            </div>
            {preset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <label className="text-xs text-ink-muted">{t('story.from')}
                  <input type="date" value={range[0]} min={ymd(new Date())}
                    onChange={(e) => e.target.value && setRange([e.target.value, e.target.value > range[1] ? e.target.value : range[1]])}
                    className="field-input mt-1" />
                </label>
                <label className="text-xs text-ink-muted">{t('story.to')}
                  <input type="date" value={range[1]} min={range[0]} max={ymd(addDays(new Date(`${range[0]}T00:00:00`), 30))}
                    onChange={(e) => e.target.value && setRange([range[0], e.target.value])}
                    className="field-input mt-1" />
                </label>
              </div>
            )}
          </div>

          <div>
            <label className="field-label">{t('story.step')}</label>
            <div className="flex flex-wrap gap-2">
              {STEPS.map((s) => (
                <button key={s} type="button" aria-pressed={step === s} onClick={() => setStep(s)} className={chip(step === s)}>
                  {t('story.hours', { n: (s / 60).toLocaleString(locale) })}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">{t('story.slots')}</label>
            {loadError ? (
              <p className="text-sm text-red-600">{loadError}</p>
            ) : days && !days.some((d) => d.slots.length) ? (
              <p className="text-sm text-ink-muted">{t('story.noSlots')}</p>
            ) : (
              <>
                <p className="text-xs text-ink-muted mb-2">{t('story.slotsHint')}</p>
                <div className="max-h-56 overflow-y-auto rounded-md border border-line divide-y divide-line">
                  {(days || []).filter((d) => d.slots.length).map((d) => {
                    const dayHidden = hidden.has(d.date);
                    return (
                      <div key={d.date} className="flex items-start gap-3 px-3 py-2">
                        <button type="button" onClick={() => toggle(d.date)} aria-pressed={!dayHidden}
                          className={`w-24 shrink-0 text-left text-sm font-semibold pt-1 ${dayHidden ? 'text-ink-muted line-through' : 'text-ink'}`}>
                          {wdFmt.format(new Date(`${d.date}T00:00:00Z`))}
                        </button>
                        <div className="flex flex-wrap gap-1.5">
                          {d.slots.map((s) => {
                            const off = dayHidden || hidden.has(`${d.date} ${s}`);
                            return (
                              <button key={s} type="button" disabled={dayHidden} onClick={() => toggle(`${d.date} ${s}`)} aria-pressed={!off}
                                className={`px-2 py-1 rounded-xs text-xs font-medium border tabular-nums transition-colors ${off
                                  ? 'border-line text-ink-muted line-through bg-canvas-soft'
                                  : 'border-brand/40 text-brand-dark bg-brand-extra-soft'}`}>
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div>
            <label className="field-label">{t('story.titleLabel')}</label>
            <input type="text" value={title} maxLength={32} onChange={(e) => setTitle(e.target.value)} className="field-input" />
          </div>

          <div>
            <label className="field-label">{t('story.style')}</label>
            <div className="grid grid-cols-4 gap-2">
              {THEMES.map((id) => {
                const th = STORY_THEMES[id];
                return (
                  <button key={id} type="button" onClick={() => setTheme(id)} aria-pressed={theme === id}
                    className={`rounded-md border-2 p-1.5 transition-colors ${theme === id ? 'border-brand' : 'border-transparent hover:border-line-medium'}`}>
                    <span className="block h-12 rounded-sm relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${th.bg[0]}, ${th.bg[1]})` }}>
                      <span className="absolute inset-x-2 top-2 bottom-0 rounded-t-full" style={{ background: th.card, borderRadius: th.arch ? undefined : 4 }} />
                      <span className="absolute left-1/2 -translate-x-1/2 top-5 w-6 h-1 rounded-full" style={{ background: th.ink }} />
                      <span className="absolute left-1/2 -translate-x-1/2 top-7 w-4 h-0.5 rounded-full" style={{ background: th.accent }} />
                    </span>
                    <span className="block text-xs text-ink-secondary mt-1">{t(`story.themes.${id}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <ImageCropField
            label={t('story.photo')}
            hint={t('story.photoHint')}
            value={photoChange}
            onChange={setPhotoChange}
            aspect={9 / 16}
            maxOutputWidth={1080}
            previewClassName="w-14 h-24"
          />

          <div>
            <label className="field-label">{t('story.cta')}</label>
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={ctaKind === 'booking'} onClick={() => setCtaKind('booking')} className={chip(ctaKind === 'booking')}>
                {t('story.ctaBooking')}
              </button>
              <button type="button" aria-pressed={ctaKind === 'text'} onClick={() => setCtaKind('text')} className={chip(ctaKind === 'text')}>
                {t('story.ctaText')}
              </button>
            </div>
            {ctaKind === 'booking' ? (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <input type="text" readOnly value={bookingUrl} className="field-input flex-1 min-w-0 truncate" onFocus={(e) => e.target.select()} />
                  <button type="button" onClick={handleCopy} className="btn btn-secondary flex-shrink-0" title={t('story.copyLink')}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-xs text-ink-muted">{t('story.linkHint')}</p>
              </div>
            ) : (
              <input type="text" value={ctaText} maxLength={40} onChange={(e) => setCtaText(e.target.value)} className="field-input mt-3" />
            )}
          </div>
        </div>
      </div>

      {/* QR для сторіс — малюється в канвас, сам елемент прихований */}
      <div className="hidden" aria-hidden>
        <QRCodeCanvas ref={qrRef} value={bookingUrl} size={480} marginSize={0} fgColor="#141414" bgColor="#ffffff" level="M" />
      </div>
    </Modal>
  );
};

export default StoryModal;
