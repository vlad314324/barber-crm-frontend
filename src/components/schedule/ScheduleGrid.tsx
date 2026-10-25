import { ReactNode, useEffect, useRef, useState } from 'react';
import { Appointment, EmployeeBreak } from '../../api/types';
import { SLOTS, SLOT_MIN, PX_PER_SLOT, TOTAL_H, toMin, place, isActive, BREAK_PATTERN, PREP_PATTERN } from './scheduleTime';


export interface HeaderMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}

export interface ScheduleColumn {
  key: string;
  header: ReactNode;
  menuItems: HeaderMenuItem[];
  dayOff: boolean;
  dayOffLabel: string;
  highlight?: boolean;
  appointments: Appointment[];
  breaks: EmployeeBreak[];
  onSlotClick: (time: string) => void;
  onBreakClick?: () => void;
}

interface Props {
  columns: ScheduleColumn[];
  emptyText: string;
  breakLabel: string;
  prepLabel: (minutes: number) => string;
  renderAppointment: (appt: Appointment, heightPx: number) => ReactNode;
  onAppointmentClick: (appt: Appointment) => void;
}

// Сітка календаря: колонки (майстри дня або дні тижня одного майстра) ×
// 30-хвилинні рядки 08:00–20:00. Записи й перерви позиціонуються абсолютно
// за хвилинами, тож запис о 10:15 малюється там, де він є.
const ScheduleGrid = ({ columns, emptyText, breakLabel, prepLabel, renderAppointment, onAppointmentClick }: Props) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openMenu) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenMenu(null); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [openMenu]);

  // Клітинка [slot, slot+30) зайнята, якщо її перетинає активний запис (разом
  // із підготовкою після нього) або перерва.
  const slotBlocked = (col: ScheduleColumn, slot: string) => {
    const s = toMin(slot);
    const e = s + SLOT_MIN;
    return col.appointments.some(a => isActive(a) && s < toMin(a.startTime) + a.totalDuration + (a.prepTime ?? 0) && toMin(a.startTime) < e)
      || col.breaks.some(b => s < toMin(b.endTime) && toMin(b.startTime) < e);
  };

  return (
    <div className="overflow-x-auto">
      <div style={{
        display: 'grid',
        gridTemplateColumns: columns.length > 0 ? `4rem repeat(${columns.length}, minmax(100px, 1fr))` : '4rem 1fr',
      }}>
        {/* ── шапка ── */}
        <div className="border-r border-r-line border-b border-b-line bg-canvas-soft" />
        {columns.length === 0
          ? <div className="py-4 text-sm text-ink-muted text-center border-b border-b-line bg-canvas-soft">{emptyText}</div>
          : columns.map(col => (
            <div key={col.key} className={`relative border-l border-l-line border-b border-b-line bg-canvas-soft ${col.highlight ? 'shadow-[inset_0_-2px_0_rgb(var(--color-brand))]' : ''}`}
              ref={openMenu === col.key ? menuRef : undefined}>
              {col.menuItems.length > 0 ? (
                <button type="button" onClick={() => setOpenMenu(m => (m === col.key ? null : col.key))}
                  aria-haspopup="menu" aria-expanded={openMenu === col.key}
                  className="w-full py-2 px-2 text-center hover:bg-line/40 transition-colors">
                  {col.header}
                </button>
              ) : (
                <div className="py-2 px-2 text-center">{col.header}</div>
              )}
              {openMenu === col.key && (
                <div role="menu" className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-30 min-w-[200px] bg-surface border border-line rounded-md shadow-lg py-1 text-left">
                  {col.menuItems.map(item => (
                    <button key={item.label} type="button" role="menuitem"
                      onClick={() => { setOpenMenu(null); item.onClick(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-secondary hover:bg-canvas-soft hover:text-ink">
                      {item.icon} {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

        {/* ── шкала часу ── */}
        <div className="border-r border-r-line">
          {SLOTS.map(slot => (
            <div key={slot} className={`pr-2 pt-0.5 text-right border-t ${slot.endsWith(':00') ? 'border-t-line' : 'border-t-line/50'}`}
              style={{ height: PX_PER_SLOT }}>
              {slot.endsWith(':00') && <span className="text-xs text-ink-muted leading-none">{slot}</span>}
            </div>
          ))}
        </div>

        {/* ── колонки ── */}
        {columns.map(col => (
          <div key={col.key} className="relative border-l border-l-line/50" style={{ height: TOTAL_H }}>
            {SLOTS.map(slot => {
              const topColor = slot.endsWith(':00') ? 'border-t-line' : 'border-t-line/50';
              const blocked = col.dayOff || slotBlocked(col, slot);
              return (
                <div key={slot} style={{ height: PX_PER_SLOT }}
                  className={`border-t ${topColor} ${col.dayOff ? 'bg-canvas-soft cursor-not-allowed'
                    : blocked ? '' : 'cursor-pointer hover:bg-brand-extra-soft transition-colors'}`}
                  onClick={() => !blocked && col.onSlotClick(slot)} />
              );
            })}

            {col.dayOff && (
              <div className="absolute inset-0 z-[4] flex items-center justify-center bg-canvas-soft/70 pointer-events-none">
                <span className="text-sm text-ink-muted font-medium">{col.dayOffLabel}</span>
              </div>
            )}

            {!col.dayOff && col.breaks.map(b => {
              const pos = place(toMin(b.startTime), toMin(b.endTime));
              if (!pos) return null;
              return (
                <div key={b._id}
                  onClick={col.onBreakClick}
                  title={`${b.comment || breakLabel} · ${b.startTime}–${b.endTime}`}
                  style={{ top: pos.top + 1, height: pos.height - 2, left: 4, right: 4, background: BREAK_PATTERN }}
                  className={`absolute z-[3] rounded border-l-4 border-line-medium px-1.5 py-0.5 text-xs text-ink-secondary overflow-hidden
                    ${col.onBreakClick ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}>
                  <p className="font-semibold truncate leading-tight">{b.comment || breakLabel}</p>
                  {pos.height > 28 && <p className="truncate leading-tight opacity-80">{b.startTime}–{b.endTime}</p>}
                </div>
              );
            })}

            {/* Скасовані/неявки — під активними, щоб новий запис на тому ж часі був зверху */}
            {[...col.appointments].sort((a, b) => Number(isActive(a)) - Number(isActive(b))).map(a => {
              const start = toMin(a.startTime);
              const end = start + Math.max(a.totalDuration, 15);
              const pos = place(start, end);
              // Підготовка місця після клієнта — окремою смугою під записом
              // (лише в активних: скасований запис час не тримає).
              const prep = isActive(a) && (a.prepTime ?? 0) > 0 ? place(end, end + (a.prepTime ?? 0)) : null;
              if (!pos && !prep) return null;
              return (
                <div key={a._id}>
                  {pos && (
                    <div
                      onClick={e => { e.stopPropagation(); onAppointmentClick(a); }}
                      style={{ top: pos.top + 1, height: pos.height - (prep ? 1 : 2), left: 4, right: 4 }}
                      className={`absolute ${isActive(a) ? 'z-[6]' : 'z-[5]'}`}>
                      {renderAppointment(a, pos.height - 2)}
                    </div>
                  )}
                  {prep && (
                    <div
                      onClick={e => { e.stopPropagation(); onAppointmentClick(a); }}
                      title={prepLabel(a.prepTime ?? 0)}
                      style={{ top: prep.top, height: prep.height - 1, left: 4, right: 4, background: PREP_PATTERN }}
                      className="absolute z-[6] rounded-b border-l-4 border-brand/40 px-1.5 text-[10px] leading-[14px] text-brand-dark overflow-hidden cursor-pointer hover:opacity-90">
                      {prep.height >= 14 && <span className="font-medium truncate block">{prepLabel(a.prepTime ?? 0)}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleGrid;
