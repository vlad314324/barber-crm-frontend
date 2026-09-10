import { useState } from 'react';
import { DurationUnit, minutesToUnitValue, unitValueToMinutes, unitInputProps } from '../utils/duration';
import DurationUnitToggle from './DurationUnitToggle';

interface DurationInputProps {
  value: number;               // завжди хвилини — контракт з рештою форми не міняється
  onChange: (minutes: number) => void;
}

// Число + перемикач одиниці поруч. Одиниця — суто локальний стан для показу
// й парсингу цього конкретного інпута; назовні завжди йдуть хвилини.
const DurationInput = ({ value, onChange }: DurationInputProps) => {
  const [unit, setUnit] = useState<DurationUnit>('min');
  const { min, step } = unitInputProps(unit);

  return (
    <div className="flex gap-2">
      <input
        type="number"
        className="field-input flex-1"
        value={minutesToUnitValue(value, unit)}
        min={min}
        step={step}
        onChange={e => {
          const raw = e.target.value === '' ? 0 : Number(e.target.value);
          onChange(unitValueToMinutes(raw, unit));
        }}
      />
      <DurationUnitToggle unit={unit} onChange={setUnit} />
    </div>
  );
};

export default DurationInput;
