import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Client } from '../api/types';

interface Props {
  clients: Client[];
  value: string;                 // clientId, '' — не обрано
  onChange: (id: string) => void;
  placeholder: string;
  emptyText?: string;
}

const MAX_RESULTS = 8;
const digitsOf = (s: string) => s.replace(/\D/g, '');

// Ті самі поля, що й серверний пошук на сторінці "Клієнти"
// (clientRoutes.js: name/phone/email/instagram). Кілька слів — кожне має
// знайтись ("Oksana Sem"); у телефоні порівнюються ще й самі цифри,
// щоб "+420 723" знаходило "+420723…".
const matches = (c: Client, words: string[]) => {
  const hay = [c.name, c.phone, c.email, c.instagram].filter(Boolean).join(' ').toLowerCase();
  const phoneDigits = digitsOf(c.phone || '');
  return words.every(w => {
    const word = w.replace(/^@/, '');
    if (hay.includes(word)) return true;
    const d = digitsOf(word);
    return d.length >= 3 && d.length === word.replace(/[\s+()-]/g, '').length && phoneDigits.includes(d);
  });
};

// Пошуковий вибір клієнта замість довгого <select> — список фільтрується
// з уже завантажених клієнтів, без запитів на кожну літеру.
const ClientPicker = ({ clients, value, onChange, placeholder, emptyText }: Props) => {
  const selected = clients.find(c => c._id === value);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const results = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const list = words.length ? clients.filter(c => matches(c, words)) : clients;
    return list.slice(0, MAX_RESULTS);
  }, [clients, query]);

  const pick = (c: Client) => {
    onChange(c._id);
    setQuery('');
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && open && results[active]) { e.preventDefault(); pick(results[active]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  if (selected && !open) {
    return (
      <div className="field-input flex items-center gap-2">
        <button type="button" className="flex-1 min-w-0 text-left truncate" onClick={() => setOpen(true)}>
          {selected.name} <span className="text-ink-muted">· {selected.phone}</span>
        </button>
        <button type="button" onClick={() => onChange('')} aria-label="Clear"
          className="text-ink-muted hover:text-ink flex-shrink-0">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
        <input type="search" className="field-input pl-8" autoComplete="off"
          placeholder={placeholder} value={query} autoFocus={!!selected}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setActive(0); setOpen(true); }}
          onKeyDown={onKeyDown} />
      </div>
      {open && (
        <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-sm border border-line bg-surface shadow-lg py-1">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ink-muted">{emptyText || '—'}</li>
          ) : results.map((c, i) => (
            <li key={c._id}>
              <button type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => pick(c)}
                onMouseEnter={() => setActive(i)}
                className={`w-full text-left px-3 py-1.5 text-sm ${i === active ? 'bg-canvas-soft' : ''} ${c._id === value ? 'font-semibold' : ''}`}>
                <span className="text-ink">{c.name}</span>
                <span className="text-ink-muted"> · {c.phone}</span>
                {c.email && <span className="block text-xs text-ink-muted truncate">{c.email}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClientPicker;
