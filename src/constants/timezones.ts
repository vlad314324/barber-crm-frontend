export interface TimezoneMeta {
  value: string;
  label: string;
}

export const TIMEZONES: TimezoneMeta[] = [
  { value: 'Europe/Kyiv', label: 'Europe/Kyiv (Kyiv, Odesa)' },
  { value: 'Europe/Prague', label: 'Europe/Prague (Prague, Brno)' },
  { value: 'Europe/Warsaw', label: 'Europe/Warsaw (Warsaw, Krakow)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (Berlin, Vienna)' },
  { value: 'Europe/London', label: 'Europe/London (London)' },
  { value: 'America/New_York', label: 'America/New_York (New York)' },
  { value: 'UTC', label: 'UTC' },
];

export const DEFAULT_TIMEZONE = 'Europe/Kyiv';
