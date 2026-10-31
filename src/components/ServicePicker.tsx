import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { Service } from '../api/types';
import { useLocale } from '../i18n/LocaleContext';

interface Props {
  // Уже впорядковані: основна, під нею її додаткові (allowedServices).
  services: Service[];
  selected: string[];
  onToggle: (id: string, on: boolean) => void;
  isLocked: (s: Service) => boolean;
  meta: (s: Service) => { price: string; duration: string };
  invalid?: boolean;
}

interface Group { name: string; items: Service[] }

// Додаткова послуга лишається в групі своєї основної (йде одразу за нею).
const groupByCategory = (list: Service[]): Group[] => {
  const groups: Group[] = [];
  let current: Group | undefined;
  for (const s of list) {
    const name = s.isAddon && current ? current.name : (s.category || '—');
    current = groups.find(g => g.name === name);
    if (!current) { current = { name, items: [] }; groups.push(current); }
    current.items.push(s);
  }
  return groups;
};

// Вибір послуг у записі: категорії, що згортаються, пошук і обрані
// чипами зверху — замість довгого списку з власним скролом.
const ServicePicker = ({ services, selected, onToggle, isLocked, meta, invalid }: Props) => {
  const { t } = useLocale();
  const [query, setQuery] = useState('');
  const groups = useMemo(() => groupByCategory(services), [services]);
  // Спершу відкриті групи з уже обраними; якщо послуг мало — усі.
  const [open, setOpen] = useState<Set<string>>(() => {
    const withSelected = groups.filter(g => g.items.some(s => selected.includes(s._id))).map(g => g.name);
    if (withSelected.length) return new Set(withSelected);
    return new Set(services.length <= 8 ? groups.map(g => g.name) : groups.slice(0, 1).map(g => g.name));
  });

  const q = query.trim().toLowerCase();
  const visible = groups
    .map(g => ({ ...g, items: q ? g.items.filter(s => s.name.toLowerCase().includes(q)) : g.items }))
    .filter(g => g.items.length > 0);
  const chosen = selected.map(id => services.find(s => s._id === id)).filter((s): s is Service => !!s);

  const toggleGroup = (name: string) => setOpen(prev => {
    const next = new Set(prev);
    if (next.has(name)) next.delete(name); else next.add(name);
    return next;
  });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
        <input type="search" className="field-input pl-9" value={query} onChange={e => setQuery(e.target.value)}
          placeholder={t('services.searchPlaceholder')} aria-label={t('services.searchPlaceholder')} />
      </div>

      {chosen.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chosen.map(s => (
            <span key={s._id} className="inline-flex items-center gap-1.5 h-8 pl-3 pr-1.5 rounded-full bg-brand-soft text-brand-dark text-xs font-semibold max-w-full">
              <span className="truncate">{s.name}</span>
              <button type="button" onClick={() => onToggle(s._id, false)} aria-label={t('common.delete')}
                className="w-5 h-5 rounded-full bg-brand/15 hover:bg-brand/25 flex items-center justify-center shrink-0">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className={`border rounded-md overflow-hidden ${invalid ? 'border-red-400' : 'border-line'}`}>
        {visible.length === 0 && <p className="px-4 py-3 text-sm text-ink-muted">{t('services.notFound')}</p>}
        {visible.map((g, i) => {
          const isOpen = q ? true : open.has(g.name);
          const count = g.items.filter(s => selected.includes(s._id)).length;
          return (
            <div key={g.name} className={i > 0 ? 'border-t border-line' : ''}>
              <button type="button" onClick={() => toggleGroup(g.name)} aria-expanded={isOpen}
                className="w-full flex items-center gap-3 px-4 py-3 bg-canvas-soft/60 hover:bg-canvas-soft text-left">
                <span className="flex-1 min-w-0 truncate text-sm font-bold text-ink">{g.name}</span>
                <span className={`text-xs font-semibold ${count ? 'text-brand-dark' : 'text-ink-secondary'}`}>
                  {count ? t('appointments.selectedCount', { count }) : g.items.length}
                </span>
                <ChevronDown size={16} className={`text-ink-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="p-1.5 space-y-0.5">
                  {g.items.map(s => {
                    const on = selected.includes(s._id);
                    const locked = isLocked(s);
                    const m = meta(s);
                    return (
                      <button key={s._id} type="button" disabled={locked} aria-pressed={on}
                        onClick={() => onToggle(s._id, !on)}
                        className={`w-full flex items-center gap-3 min-h-[44px] px-2.5 py-2 rounded-sm text-left transition-colors
                          ${s.isAddon ? 'pl-8' : ''}
                          ${locked ? 'opacity-50 cursor-not-allowed' : on ? 'bg-brand-extra-soft' : 'hover:bg-canvas-soft'}`}>
                        <span className={`w-5 h-5 shrink-0 rounded-[6px] border-[1.5px] flex items-center justify-center
                          ${on ? 'bg-brand border-brand text-white' : 'bg-surface border-line-medium'}`}>
                          {on && <Check size={13} strokeWidth={3} />}
                        </span>
                        <span className="flex-1 min-w-0 text-sm text-ink">{s.isAddon ? `+ ${s.name}` : s.name}</span>
                        <span className="text-xs text-ink-secondary whitespace-nowrap">{m.duration}</span>
                        <span className="text-sm font-bold text-ink whitespace-nowrap text-right min-w-[72px]">{m.price}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ServicePicker;
