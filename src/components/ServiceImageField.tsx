import { useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { ImagePlus } from 'lucide-react';
import { useLocale } from '../i18n/LocaleContext';

// Зміна фото, яку форма застосує після збереження самої послуги:
// новий обрізаний файл, видалення, або null — нічого не змінювати.
export type ServiceImageChange = { blob: Blob } | 'remove' | null;

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_MB = 10;
// Бекенд однаково стискає до 600×600 webp — більше слати немає сенсу.
const OUTPUT_MAX_SIDE = 1000;

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

async function getCroppedBlob(src: string, crop: Area): Promise<Blob> {
  const img = await loadImage(src);
  const side = Math.min(OUTPUT_MAX_SIDE, Math.round(crop.width));
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  // JPEG без альфа-каналу: прозорі PNG інакше стали б чорними.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, side, side);
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, side, side);
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.9);
  });
}

interface Props {
  existingUrl?: string;
  value: ServiceImageChange;
  onChange: (value: ServiceImageChange) => void;
}

// Поле фото послуги з ручним кадруванням 1:1. Кроппер показується прямо
// у формі, а не окремою модалкою: вкладена Modal ділила б Escape і
// фокус-трап з модалкою послуги.
const ServiceImageField = ({ existingUrl, value, onChange }: Props) => {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);

  const pendingBlob = value && value !== 'remove' ? value.blob : null;
  useEffect(() => {
    if (!pendingBlob) { setPendingPreview(null); return; }
    const url = URL.createObjectURL(pendingBlob);
    setPendingPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingBlob]);

  useEffect(() => () => { if (cropSrc) URL.revokeObjectURL(cropSrc); }, [cropSrc]);

  const previewUrl = pendingPreview ?? (value === 'remove' ? undefined : existingUrl);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) { setError(t('services.photoInvalidType')); return; }
    if (file.size > MAX_FILE_MB * 1024 * 1024) { setError(t('services.photoTooLarge')); return; }
    setError(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropSrc(URL.createObjectURL(file));
  };

  const applyCrop = async () => {
    if (!cropSrc || !croppedArea) return;
    try {
      const blob = await getCroppedBlob(cropSrc, croppedArea);
      onChange({ blob });
      setCropSrc(null);
    } catch {
      setError(t('services.cropError'));
    }
  };

  return (
    <div>
      <label className="field-label">{t('services.fieldPhoto')}</label>
      <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(',')} className="hidden" onChange={handleFile} />

      {cropSrc ? (
        <div className="space-y-3">
          <div className="relative h-64 bg-black rounded-md overflow-hidden">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, area) => setCroppedArea(area)}
            />
          </div>
          <label className="flex items-center gap-3 text-sm text-ink-secondary">
            {t('services.cropZoom')}
            <input type="range" min={1} max={3} step={0.05} value={zoom}
              onChange={e => setZoom(Number(e.target.value))} className="flex-1 accent-brand" />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCropSrc(null)} className="btn btn-secondary">{t('common.cancel')}</button>
            <button type="button" onClick={applyCrop} className="btn btn-primary">{t('services.cropApply')}</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => inputRef.current?.click()}
            className="w-24 h-24 shrink-0 rounded-md border border-line overflow-hidden bg-brand-extra-soft flex items-center justify-center text-brand hover:border-line-medium transition-colors"
            aria-label={previewUrl ? t('services.photoReplace') : t('services.photoUpload')}>
            {previewUrl
              ? <img src={previewUrl} alt="" className="w-full h-full object-cover" />
              : <ImagePlus size={28} strokeWidth={1.5} />}
          </button>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => inputRef.current?.click()}
                className="text-sm font-medium text-brand hover:text-brand-dark">
                {previewUrl ? t('services.photoReplace') : t('services.photoUpload')}
              </button>
              {previewUrl && (
                <button type="button" onClick={() => onChange(existingUrl ? 'remove' : null)}
                  className="text-sm font-medium text-red-500 hover:text-red-700">
                  {t('services.photoRemove')}
                </button>
              )}
            </div>
            <p className="text-xs text-ink-muted">{t('services.photoHint')}</p>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default ServiceImageField;
