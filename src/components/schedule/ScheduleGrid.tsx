import { ReactNode, useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { Appointment, EmployeeBreak } from '../../api/types';
import { SLOTS, SLOT_MIN, PX_PER_SLOT, TOTAL_H, DAY_START, DAY_END, toMin, minToTime, place, isActive, BREAK_PATTERN, PREP_PATTERN } from './scheduleTime';

const SNAP_MIN = 15;
const DRAG_THRESHOLD_PX = 5;
const TOUCH_HOLD_MS = 350;
const AUTOSCROLL_EDGE_PX = 48;

// Найближчий предок, що скролиться по вертикалі (у Layout це <main>).
const scrollParent = (el: HTMLElement | null): HTMLElement | null => {
  for (let p = el?.parentElement; p; p = p.parentElement) {
    const oy = getComputedStyle(p).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight) return p;
  }
  return null;
};

interface DragState {
  appt: Appointment;
  fromCol: string;
  pointerId: number;
  x0: number;
  y0: number;
  grabMin: number;     // де всередині блока схопили, хв від його початку
  started: boolean;
  holdTimer?: number;
}

interface Ghost {
  apptId: string;
  colKey: string;
  start: number;
  ok: boolean;
}


export interface HeaderMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}

export interface ScheduleColumn {
  key: string;
  employeeId: string;  // куди потрапляє запис, перетягнутий у цю колонку
  date: Date;
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
  // Підпис кнопки «i» на скасованих/перенесених записах.
  inactiveInfoLabel: string;
  // Колір і підказка вузької смужки, якою малюється скасований/перенесений
  // запис, що припадає на перерву.
  inactiveStrip?: (appt: Appointment) => { className: string; title: string };
  renderAppointment: (appt: Appointment, heightPx: number) => ReactNode;
  onAppointmentClick: (appt: Appointment) => void;
  // Перетягування записів; без onAppointmentDrop сітка лише для перегляду.
  canDrag?: (appt: Appointment) => boolean;
  canDrop?: (appt: Appointment, colKey: string, startTime: string) => boolean;
  onAppointmentDrop?: (appt: Appointment, colKey: string, startTime: string) => void;
}

const spanOf = (a: Appointment): [number, number] => {
  const s = toMin(a.startTime);
  return [s, s + Math.max(a.totalDuration, 15)];
};
const overlapsSpan = (a: Appointment, s: number, e: number) => {
  const [as, ae] = spanOf(a);
  return as < e && s < ae;
};

// Ширина видимої смужки неактивного запису під активним (з кнопкою «i»).
const GHOST_W = 26;
// Крок між вузькими смужками неактивних записів на перерві.
const STRIP_STEP = 14;

// Неактивні (скасовані/перенесені) записи, що перетинаються між собою,
// розкладаємо на доріжки каскадом, як у Google Calendar: кожна наступна
// зсунута праворуч, тож «i» кожного лишається видимою.
function inactiveLanes(appts: Appointment[]) {
  const list = appts.filter(a => !isActive(a))
    .sort((a, b) => toMin(a.startTime) - toMin(b.startTime) || a._id.localeCompare(b._id));
  const laneEnd: number[] = [];
  const lane = new Map<string, number>();
  for (const a of list) {
    const [s, e] = spanOf(a);
    let i = laneEnd.findIndex(end => end <= s);
    if (i < 0) i = laneEnd.length;
    laneEnd[i] = e;
    lane.set(a._id, i);
  }
  const out = new Map<string, { lane: number; lanes: number }>();
  for (const a of list) {
    const [s, e] = spanOf(a);
    const n = 1 + Math.max(...list.filter(b => overlapsSpan(b, s, e)).map(b => lane.get(b._id)!));
    out.set(a._id, { lane: lane.get(a._id)!, lanes: n });
  }
  return out;
}

// Скільки доріжок неактивних записів зачіпає інтервал [s, e).
const lanesIn = (appts: Appointment[], lanes: Map<string, { lane: number }>, s: number, e: number) =>
  appts.reduce((n, a) => (!isActive(a) && overlapsSpan(a, s, e) ? Math.max(n, lanes.get(a._id)!.lane + 1) : n), 0);

// Сітка календаря: колонки (майстри дня або дні тижня одного майстра) ×
// 30-хвилинні рядки 08:00–20:00. Записи й перерви позиціонуються абсолютно
// за хвилинами, тож запис о 10:15 малюється там, де він є.
const ScheduleGrid = ({ columns, emptyText, breakLabel, prepLabel, inactiveInfoLabel, inactiveStrip, renderAppointment, onAppointmentClick, canDrag, canDrop, onAppointmentDrop }: Props) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const colRefs = useRef(new Map<string, HTMLDivElement>());
  const drag = useRef<DragState | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const ghostRef = useRef<Ghost | null>(null);
  const suppressClick = useRef(false);
  // Обробники на window живуть увесь drag — беруть свіжі props через ref.
  const live = useRef({ columns, canDrop, onAppointmentDrop });
  live.current = { columns, canDrop, onAppointmentDrop };

  const showGhost = (g: Ghost | null) => { ghostRef.current = g; setGhost(g); };

  // Точка курсора -> колонка і початок запису, прив'язаний до 15 хв.
  const locate = (d: DragState, x: number, y: number): Ghost | null => {
    for (const col of live.current.columns) {
      const r = colRefs.current.get(col.key)?.getBoundingClientRect();
      if (!r || x < r.left || x >= r.right) continue;
      const dur = Math.max(d.appt.totalDuration, SNAP_MIN);
      const raw = DAY_START + ((y - r.top) / PX_PER_SLOT) * SLOT_MIN - d.grabMin;
      const start = Math.max(DAY_START, Math.min(Math.round(raw / SNAP_MIN) * SNAP_MIN, DAY_END - dur));
      const ok = !col.dayOff && (live.current.canDrop?.(d.appt, col.key, minToTime(start)) ?? true);
      return { apptId: d.appt._id, colKey: col.key, start, ok };
    }
    return null;
  };

  const endDrag = (commit: boolean) => {
    const d = drag.current;
    if (!d) return;
    window.clearTimeout(d.holdTimer);
    const g = ghostRef.current;
    if (commit && d.started && g && g.ok && (g.colKey !== d.fromCol || g.start !== toMin(d.appt.startTime))) {
      live.current.onAppointmentDrop?.(d.appt, g.colKey, minToTime(g.start));
    }
    if (d.started) {
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 0);
    }
    drag.current = null;
    showGhost(null);
  };

  const beginDrag = (d: DragState, x: number, y: number) => {
    d.started = true;
    showGhost(locate(d, x, y));
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.pointerId) return;
      if (!d.started) {
        const moved = Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > DRAG_THRESHOLD_PX;
        // Тач: рух до кінця утримання — це скрол сторінки, не drag.
        if (e.pointerType === 'touch') { if (moved) endDrag(false); return; }
        if (!moved) return;
        beginDrag(d, e.clientX, e.clientY);
      }
      const scroller = scrollParent(colRefs.current.values().next().value ?? null);
      const top = scroller ? scroller.getBoundingClientRect().top : 0;
      const bottom = scroller ? scroller.getBoundingClientRect().bottom : window.innerHeight;
      const step = e.clientY < top + AUTOSCROLL_EDGE_PX ? -16 : e.clientY > bottom - AUTOSCROLL_EDGE_PX ? 16 : 0;
      if (step) (scroller ?? window).scrollBy(0, step);
      showGhost(locate(d, e.clientX, e.clientY));
    };
    const onUp = (e: PointerEvent) => { if (drag.current?.pointerId === e.pointerId) endDrag(true); };
    const onCancel = (e: PointerEvent) => { if (drag.current?.pointerId === e.pointerId) endDrag(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') endDrag(false); };
    // Під час drag пальцем сторінка не повинна скролитись.
    const onTouchMove = (e: TouchEvent) => { if (drag.current?.started) e.preventDefault(); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchmove', onTouchMove);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onApptPointerDown = (e: React.PointerEvent, a: Appointment, colKey: string) => {
    if (!onAppointmentDrop || !canDrag?.(a) || e.button !== 0 || drag.current) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const d: DragState = {
      appt: a, fromCol: colKey, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY,
      grabMin: ((e.clientY - rect.top) / PX_PER_SLOT) * SLOT_MIN, started: false,
    };
    drag.current = d;
    if (e.pointerType === 'touch') {
      d.holdTimer = window.setTimeout(() => {
        if (drag.current === d) { beginDrag(d, d.x0, d.y0); navigator.vibrate?.(20); }
      }, TOUCH_HOLD_MS);
    } else {
      e.preventDefault(); // без виділення тексту під час drag мишею
    }
  };
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
          <div key={col.key} className="relative border-l border-l-line/50" style={{ height: TOTAL_H }}
            ref={el => { if (el) colRefs.current.set(col.key, el); else colRefs.current.delete(col.key); }}>
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
              // Звільняємо праве поле під смужки неактивних записів.
              const strips = lanesIn(col.appointments, inactiveLanes(col.appointments), toMin(b.startTime), toMin(b.endTime));
              return (
                <div key={b._id}
                  onClick={col.onBreakClick}
                  title={`${b.comment || breakLabel} · ${b.startTime}–${b.endTime}`}
                  style={{ top: pos.top + 1, height: pos.height - 2, left: 4, right: strips ? 6 + STRIP_STEP * strips : 4, background: BREAK_PATTERN }}
                  className={`absolute z-[3] rounded border-l-4 border-line-medium px-1.5 py-0.5 text-xs text-ink-secondary overflow-hidden
                    ${col.onBreakClick ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}>
                  <p className="font-semibold truncate leading-tight">{b.comment || breakLabel}</p>
                  {pos.height > 28 && <p className="truncate leading-tight opacity-80">{b.startTime}–{b.endTime}</p>}
                </div>
              );
            })}

            {/* Скасовані/перенесені — другорядні: під активними, клік по них
                проходить на клітинку (нове бронювання), деталі — лише кнопкою «i».
                Активний запис, що їх перекриває, зсунутий праворуч, як у Google
                Calendar, щоб зліва було видно смужку старого запису. */}
            {(() => {
              // Порядок малювання: неактивні за доріжками (наступна поверх
              // попередньої), потім активні.
              const order = inactiveLanes(col.appointments);
              const rank = (x: Appointment) => isActive(x) ? 1000 : (order.get(x._id)?.lane ?? 0);
              return [...col.appointments].sort((a, b) => rank(a) - rank(b));
            })().map(a => {
              const start = toMin(a.startTime);
              const end = start + Math.max(a.totalDuration, 15);
              const pos = place(start, end);
              const active = isActive(a);
              const lanes = inactiveLanes(col.appointments);
              // Активний запис зсуваємо праворуч на стільки смужок, скільки
              // неактивних доріжок під ним.
              const coveredLanes = active ? lanesIn(col.appointments, lanes, start, end) : 0;
              const coversInactive = coveredLanes > 0;
              const left = 4 + GHOST_W * coveredLanes;
              const myLane = lanes.get(a._id);
              // Каскад: кожна наступна доріжка зсунута праворуч на смужку «i»
              // і лежить поверх попередньої на всю ширину.
              const ghostLane = myLane?.lane ?? 0;
              // Неактивний запис на час перерви — лише вузька смужка справа,
              // щоб не накладатися на перерву.
              const besideBreak = !active && !col.dayOff && col.breaks.some(b =>
                toMin(b.startTime) < end && start < toMin(b.endTime));
              // Підготовка місця після клієнта — окремою смугою під записом
              // (лише в активних: скасований запис час не тримає).
              const prep = isActive(a) && (a.prepTime ?? 0) > 0 ? place(end, end + (a.prepTime ?? 0)) : null;
              if (!pos && !prep) return null;
              const draggable = !!onAppointmentDrop && !!canDrag?.(a);
              return (
                <div key={a._id} className={ghost?.apptId === a._id ? 'opacity-40' : ''}>
                  {pos && (
                    active ? (
                      <div
                        onClick={e => { e.stopPropagation(); if (!suppressClick.current) onAppointmentClick(a); }}
                        onPointerDown={e => onApptPointerDown(e, a, col.key)}
                        // Утримання пальцем інакше відкриває системне меню замість drag.
                        onContextMenu={e => { if (drag.current) e.preventDefault(); }}
                        style={{ top: pos.top + 1, height: pos.height - (prep ? 1 : 2), left, right: 4, WebkitTouchCallout: 'none' }}
                        className={`absolute z-[6] ${coversInactive ? 'ring-1 ring-surface' : ''} ${draggable ? 'select-none' : ''}`}>
                        {renderAppointment(a, pos.height - 2)}
                      </div>
                    ) : besideBreak ? (() => {
                      const strip = inactiveStrip?.(a);
                      return (
                        // Видима смужка 10px, зона натиску 20px — пальцем влучити легко.
                        <button type="button"
                          onClick={e => { e.stopPropagation(); onAppointmentClick(a); }}
                          aria-label={strip ? `${inactiveInfoLabel}: ${strip.title}` : inactiveInfoLabel}
                          title={strip?.title ?? inactiveInfoLabel}
                          style={{ top: pos.top + 1, height: pos.height - 2, right: 2 + STRIP_STEP * (myLane?.lane ?? 0), width: 20 }}
                          className="group absolute z-[5] flex justify-end pr-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand rounded">
                          <span className={`block h-full w-2.5 rounded-sm group-hover:brightness-110 ${strip?.className ?? 'bg-sky-400'}`}/>
                        </button>
                      );
                    })() : (
                      <div style={{ top: pos.top + 1, height: pos.height - 2, left: 4 + GHOST_W * ghostLane, right: 4 }}
                        className={`absolute z-[5] pointer-events-none ${ghostLane ? 'rounded ring-1 ring-surface' : ''}`}>
                        {renderAppointment(a, pos.height - 2)}
                        <button type="button"
                          onClick={e => { e.stopPropagation(); onAppointmentClick(a); }}
                          aria-label={inactiveInfoLabel} title={inactiveInfoLabel}
                          style={{ height: Math.min(24, pos.height - 2) }}
                          className="pointer-events-auto absolute left-0 top-0 w-6 flex items-start justify-center pt-0.5 rounded-l text-ink-secondary hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
                          <Info size={14} strokeWidth={2.25}/>
                        </button>
                      </div>
                    )
                  )}
                  {prep && (
                    <div
                      onClick={e => { e.stopPropagation(); onAppointmentClick(a); }}
                      title={prepLabel(a.prepTime ?? 0)}
                      style={{ top: prep.top, height: prep.height - 1, left, right: 4, background: PREP_PATTERN }}
                      className="absolute z-[6] rounded-b border-l-4 border-brand/40 px-1.5 text-[10px] leading-[14px] text-brand-dark overflow-hidden cursor-pointer hover:opacity-90">
                      {prep.height >= 14 && <span className="font-medium truncate block">{prepLabel(a.prepTime ?? 0)}</span>}
                    </div>
                  )}
                </div>
              );
            })}

            {ghost?.colKey === col.key && (() => {
              const appt = drag.current?.appt;
              if (!appt) return null;
              const end = ghost.start + Math.max(appt.totalDuration, SNAP_MIN);
              const pos = place(ghost.start, end);
              if (!pos) return null;
              return (
                <div style={{ top: pos.top + 1, height: pos.height - 2, left: 4, right: 4 }}
                  className={`absolute z-[8] pointer-events-none rounded border-2 border-dashed px-1.5 py-0.5 text-xs font-semibold shadow-md ${
                    ghost.ok ? 'border-brand bg-brand-soft/80 text-brand-dark' : 'border-red-500 bg-red-50/80 text-red-600 dark:bg-red-950/60 dark:text-red-400'}`}>
                  {minToTime(ghost.start)}–{minToTime(end)}
                </div>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleGrid;
