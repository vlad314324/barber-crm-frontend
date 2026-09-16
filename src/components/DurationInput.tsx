import { useState } from 'react';
import { DurationUnit } from '../utils/duration';

interface DurationInputProps {
  value: number | undefined;   // завжди хвилини — контракт з рештою форми не міняється
  onChange: (minutes: number | undefined) => void;
  // Одиниця показу/вводу — приходить ззовні (глобальне налаштування
  // закладу), а не власний стан інпута: усі поля тривалості в адмінці
  // мають перемикатись разом, з одного місця в Налаштуваннях.
  unit: DurationUnit;
  min?: number;                // тільки для HTML-атрибута min на хвилинному полі — не форсує/не підмінює значення під час вводу (як і поле ціни, реальну перевірку робить форма при збереженні)
}

// Локальний текстовий стан для кожного підполя — навмисно, а не просто
// `value={...}` від пропа. Якщо виводити текст напряму з обчисленого
// значення, стирання поля миттєво "відскакує" назад на 0 (batch onChange ->
// нове число -> знову відрендерений "0"), і ввести багатозначне число
// неможливо. Компонент монтується заново щоразу, коли відкривається
// модалка редагування іншого запису (Modal розмонтовує дітей при закритті),
// тож lazy-ініціалізація з value тут безпечна.
const DurationInput = ({ value, onChange, unit, min = 0 }: DurationInputProps) => {
  const [hoursText, setHoursText] = useState(() => (value === undefined ? '' : String(Math.floor(value / 60))));
  const [minutesText, setMinutesText] = useState(() =>
    value === undefined ? '' : String(unit === 'hour' ? value % 60 : value)
  );

  if (unit === 'hour') {
    const emit = (h: string, m: string) => {
      if (h === '' && m === '') { onChange(undefined); return; }
      onChange((h === '' ? 0 : Number(h)) * 60 + (m === '' ? 0 : Number(m)));
    };

    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          className="field-input w-16 text-center"
          value={hoursText}
          min={0}
          placeholder="0"
          onChange={e => { setHoursText(e.target.value); emit(e.target.value, minutesText); }}
        />
        <span className="text-sm text-ink-muted flex-shrink-0">год</span>
        <input
          type="number"
          className="field-input w-16 text-center"
          value={minutesText}
          min={0}
          max={59}
          step={5}
          placeholder="0"
          onChange={e => { setMinutesText(e.target.value); emit(hoursText, e.target.value); }}
        />
        <span className="text-sm text-ink-muted flex-shrink-0">хв</span>
      </div>
    );
  }

  return (
    <input
      type="number"
      className="field-input"
      value={minutesText}
      min={min}
      step={5}
      onChange={e => {
        setMinutesText(e.target.value);
        onChange(e.target.value === '' ? undefined : Number(e.target.value));
      }}
    />
  );
};

export default DurationInput;
