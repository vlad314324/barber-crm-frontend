import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '../Modal';
import { breakApi } from '../../api';
import { BreakInterval, Employee, EmployeeBreak } from '../../api/types';
import { useLocale } from '../../i18n/LocaleContext';
import { getErrorMessage } from '../../utils/errors';
import { toMin, validateBreaks } from './scheduleTime';

interface Props {
  employee: Employee | null;
  date: Date | null;
  dateKey: string; // "YYYY-MM-DD"
  breaks: EmployeeBreak[];
  onClose: () => void;
  onSaved: () => void;
}

const DEFAULT_INTERVAL: BreakInterval = { startTime: '13:00', endTime: '14:00', comment: '' };

// Діалог перерв майстра на один день: список інтервалів "від–до + коментар",
// зберігається цілим набором (PUT /breaks/:employeeId/:date).
const BreaksModal = ({ employee, date, dateKey, breaks, onClose, onSaved }: Props) => {
  const { t, lang } = useLocale();
  const [rows, setRows] = useState<BreakInterval[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isOpen = !!employee && !!date;

  useEffect(() => {
    if (!isOpen) return;
    setRows(breaks.length > 0
      ? breaks.map(b => ({ startTime: b.startTime, endTime: b.endTime, comment: b.comment || '' }))
      : [{ ...DEFAULT_INTERVAL }]);
    setError(null);
  // Ініціалізуємо лише при відкритті для конкретного майстра/дня.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, employee?._id, dateKey]);

  const update = (i: number, patch: Partial<BreakInterval>) =>
    setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const addRow = () => {
    // Новий інтервал — одразу після останнього, якщо є місце; інакше 13:00–14:00.
    const last = rows[rows.length - 1];
    if (last && toMin(last.endTime) + 60 <= 24 * 60) {
      const s = toMin(last.endTime);
      const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      setRows(prev => [...prev, { startTime: fmt(s), endTime: fmt(s + 60), comment: '' }]);
    } else {
      setRows(prev => [...prev, { ...DEFAULT_INTERVAL }]);
    }
  };

  const handleSave = async () => {
    if (!employee) return;
    const invalid = validateBreaks(rows);
    if (invalid) { setError(t(invalid)); return; }
    setSaving(true);
    setError(null);
    try {
      await breakApi.saveDay(employee._id, dateKey, rows.map(r => ({ ...r, comment: r.comment.trim() })));
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err) || t('appointments.breaksSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const title = employee && date
    ? `${t('appointments.breaksTitle')} · ${employee.name} · ${date.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', { weekday: 'short', day: 'numeric', month: 'long' })}`
    : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-ink-muted">{t('appointments.noBreaks')}</p>}
        {rows.map((r, i) => (
          <div key={i} className="flex flex-wrap sm:flex-nowrap items-end gap-2">
            <label className="w-[calc(50%-4px)] sm:w-28">
              <span className="field-label">{t('appointments.breakFrom')}</span>
              <input type="time" step={300} className="field-input" value={r.startTime}
                onChange={e => update(i, { startTime: e.target.value })} />
            </label>
            <label className="w-[calc(50%-4px)] sm:w-28">
              <span className="field-label">{t('appointments.breakTo')}</span>
              <input type="time" step={300} className="field-input" value={r.endTime}
                onChange={e => update(i, { endTime: e.target.value })} />
            </label>
            <label className="flex-1 min-w-0">
              <span className="field-label">{t('appointments.breakComment')}</span>
              <input type="text" maxLength={100} className="field-input" value={r.comment}
                placeholder={t('appointments.breakCommentPlaceholder')}
                onChange={e => update(i, { comment: e.target.value })} />
            </label>
            <button type="button" onClick={() => setRows(prev => prev.filter((_, idx) => idx !== i))}
              aria-label={t('common.delete')}
              className="p-2.5 rounded-sm text-ink-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <button type="button" onClick={addRow} className="btn btn-secondary">
          <Plus size={16} /> {t('appointments.addInterval')}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2 border-t border-line">
          <button type="button" onClick={onClose} className="btn btn-secondary">{t('common.cancel')}</button>
          <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BreaksModal;
