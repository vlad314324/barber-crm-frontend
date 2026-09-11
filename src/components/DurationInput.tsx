import { DurationUnit } from '../utils/duration';

interface DurationInputProps {
  value: number | undefined;   // завжди хвилини — контракт з рештою форми не міняється
  onChange: (minutes: number | undefined) => void;
  // Одиниця показу/вводу — приходить ззовні (глобальне налаштування
  // закладу), а не власний стан інпута: усі поля тривалості в адмінці
  // мають перемикатись разом, з одного місця в Налаштуваннях.
  unit: DurationUnit;
  min?: number;                // мінімум у хвилинах (напр. 5 для базової тривалості)
}

// В режимі "хв" — один інпут цілими хвилинами, як і раніше. В режимі
// "год" — окремі поля години+хвилини (а не десяткове число годин): "20 хв"
// як 0.33 — незручно й незрозуміло без підказки, скільки писати.
const DurationInput = ({ value, onChange, unit, min = 0 }: DurationInputProps) => {
  if (unit === 'hour') {
    const hours = value === undefined ? '' : Math.floor(value / 60);
    const minutes = value === undefined ? '' : value % 60;

    const emit = (h: number, m: number) => onChange(Math.max(min, h * 60 + m));

    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          className="field-input w-16 text-center"
          value={hours}
          min={0}
          placeholder="0"
          onChange={e => {
            if (e.target.value === '' && minutes === '') { onChange(undefined); return; }
            emit(e.target.value === '' ? 0 : Number(e.target.value), minutes === '' ? 0 : minutes);
          }}
        />
        <span className="text-sm text-ink-muted flex-shrink-0">год</span>
        <input
          type="number"
          className="field-input w-16 text-center"
          value={minutes}
          min={0}
          max={59}
          step={5}
          placeholder="0"
          onChange={e => {
            if (e.target.value === '' && hours === '') { onChange(undefined); return; }
            emit(hours === '' ? 0 : hours, e.target.value === '' ? 0 : Number(e.target.value));
          }}
        />
        <span className="text-sm text-ink-muted flex-shrink-0">хв</span>
      </div>
    );
  }

  return (
    <input
      type="number"
      className="field-input"
      value={value ?? ''}
      min={min}
      step={5}
      onChange={e => onChange(e.target.value === '' ? undefined : Math.max(min, Number(e.target.value)))}
    />
  );
};

export default DurationInput;
