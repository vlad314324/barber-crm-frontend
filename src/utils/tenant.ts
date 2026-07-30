const SALON_SLUG_KEY = 'salonSlug';

export const getSalonSlug = (): string | null => localStorage.getItem(SALON_SLUG_KEY);

export const setSalonSlug = (slug: string): void => {
  localStorage.setItem(SALON_SLUG_KEY, slug);
};

export const clearSalonSlug = (): void => {
  localStorage.removeItem(SALON_SLUG_KEY);
};
