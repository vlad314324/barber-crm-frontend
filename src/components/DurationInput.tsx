import { DurationUnit, minutesToUnitValue, unitValueToMinutes, unitInputProps } from '../utils/duration';

interface DurationInputProps {
  value: number;               // завжди хвилини — контракт з рештою форми не міняється
  onChange: (minutes: number) => void;
  // Одиниця показу/вводу — приходить ззовні (глобальне налаштування
  // закладу), а не власний стан інпута: усі поля тривалості в адмінці
  // мають перемикатись разом, з одного місця в Налаштуваннях.
  unit: DurationUnit;
}

const DurationInput = ({ value, onChange, unit }: DurationInputProps) => {
  const { min, step } = unitInputProps(unit);

  return (
    <input
      type="number"
      className="field-input"
      value={minutesToUnitValue(value, unit)}
      min={min}
      step={step}
      onChange={e => {
        const raw = e.target.value === '' ? 0 : Number(e.target.value);
        onChange(unitValueToMinutes(raw, unit));
      }}
    />
  );
};

export default DurationInput;
