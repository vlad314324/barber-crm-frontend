// Індивідуальні ціна, тривалість і опис послуги для майстра — дзеркало
// utils/employeePricing.js на бекенді. Порожнє поле — базове значення.

export interface ServiceOverride {
  service: string;
  price?: number;
  priceMax?: number;
  duration?: number;
  durationMax?: number;
  // Свій опис майстра: основною мовою салону і переклади { uk, en, ... }.
  description?: string;
  descriptionTranslations?: Partial<Record<string, string>>;
}

interface PricedService {
  _id: string;
  price: number;
  priceMax?: number;
  duration: number;
  durationMax?: number;
  description?: string;
  translations?: Partial<Record<string, { name?: string; description?: string }>>;
}

interface WithOverrides {
  serviceOverrides?: ServiceOverride[];
}

const FIELDS = ['price', 'priceMax', 'duration', 'durationMax'] as const;

export const overrideFor = (employee: WithOverrides | null | undefined, serviceId: string) =>
  employee?.serviceOverrides?.find(o => o.service === serviceId) ?? null;

// Свій опис майстра замість загального. Якщо він заданий, переклади
// загального опису (тексти іншого майстра) не показуються: мова без
// перекладу майстра бере його основний опис.
function applyDescription<T extends PricedService>(out: T, o: ServiceOverride) {
  const tr = o.descriptionTranslations || {};
  const hasTr = Object.values(tr).some(v => typeof v === 'string' && v.trim());
  if (!o.description && !hasTr) return;
  if (o.description) out.description = o.description;
  const translations = { ...(out.translations || {}) };
  for (const lang of new Set([...Object.keys(translations), ...Object.keys(tr)])) {
    const own = tr[lang]?.trim() || '';
    translations[lang] = { ...(translations[lang] || {}), description: own || (o.description ? '' : translations[lang]?.description || '') };
  }
  out.translations = translations as T['translations'];
}

export function effectiveService<T extends PricedService>(service: T, employee: WithOverrides | null | undefined): T {
  const o = overrideFor(employee, service._id);
  if (!o) return service;
  const out = { ...service };
  for (const f of FIELDS) if (o[f] !== undefined && o[f] !== null) out[f] = o[f] as number;
  applyDescription(out, o);
  if (out.priceMax !== undefined && out.priceMax < out.price) delete out.priceMax;
  if (out.durationMax !== undefined && out.durationMax < out.duration) delete out.durationMax;
  return out;
}

export const effectiveServices = <T extends PricedService>(services: T[], employee: WithOverrides | null | undefined): T[] =>
  services.map(s => effectiveService(s, employee));
