// Індивідуальні ціна й тривалість послуги для майстра — дзеркало
// utils/employeePricing.js на бекенді. Порожнє поле — базове значення.

export interface ServiceOverride {
  service: string;
  price?: number;
  priceMax?: number;
  duration?: number;
  durationMax?: number;
}

interface PricedService {
  _id: string;
  price: number;
  priceMax?: number;
  duration: number;
  durationMax?: number;
}

interface WithOverrides {
  serviceOverrides?: ServiceOverride[];
}

const FIELDS = ['price', 'priceMax', 'duration', 'durationMax'] as const;

export const overrideFor = (employee: WithOverrides | null | undefined, serviceId: string) =>
  employee?.serviceOverrides?.find(o => o.service === serviceId) ?? null;

export function effectiveService<T extends PricedService>(service: T, employee: WithOverrides | null | undefined): T {
  const o = overrideFor(employee, service._id);
  if (!o) return service;
  const out = { ...service };
  for (const f of FIELDS) if (o[f] !== undefined && o[f] !== null) out[f] = o[f] as number;
  if (out.priceMax !== undefined && out.priceMax < out.price) delete out.priceMax;
  if (out.durationMax !== undefined && out.durationMax < out.duration) delete out.durationMax;
  return out;
}

export const effectiveServices = <T extends PricedService>(services: T[], employee: WithOverrides | null | undefined): T[] =>
  services.map(s => effectiveService(s, employee));
