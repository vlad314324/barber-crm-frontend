import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Copy, Check, Download, ExternalLink } from 'lucide-react';
import { useLocale } from '../i18n/LocaleContext';

interface BookingLinkCardProps {
  slug: string;
}

const BookingLinkCard = ({ slug }: BookingLinkCardProps) => {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const url = `${window.location.origin}/book/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API недоступний — нічого критичного, поле й так readonly з видимим текстом
    }
  };

  const handleDownloadQr = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qr-${slug}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-5">
      <div className="flex-shrink-0 flex flex-col items-center gap-2">
        <div className="p-2 bg-white rounded-sm border border-line">
          <QRCodeCanvas ref={canvasRef} value={url} size={120} />
        </div>
        <button onClick={handleDownloadQr} className="text-xs text-brand hover:text-brand-dark font-medium flex items-center gap-1">
          <Download size={12} /> {t('settings.bookingLink.downloadQr')}
        </button>
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <label className="field-label">{t('settings.bookingLink.urlLabel')}</label>
          <div className="flex gap-2">
            <input type="text" readOnly value={url} className="field-input flex-1 min-w-0 truncate" onFocus={e => e.target.select()} />
            <button onClick={handleCopy} className="btn btn-secondary flex-shrink-0" title={t('settings.bookingLink.copyBtn')}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          {copied && <p className="text-xs text-brand-dark mt-1">{t('settings.bookingLink.copiedLabel')}</p>}
        </div>
        <a href={url} target="_blank" rel="noreferrer" className="text-xs text-ink-secondary hover:text-brand flex items-center gap-1 w-fit">
          <ExternalLink size={12} /> {t('settings.bookingLink.previewLink')}
        </a>
      </div>
    </div>
  );
};

export default BookingLinkCard;
