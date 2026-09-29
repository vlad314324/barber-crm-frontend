// Локальна генерація "аватарки" (ініціали + колір) замість запиту на
// зовнішній сервіс (ui-avatars.com), якому інакше довелось би передавати
// імена клієнтів/співробітників — персональні дані третій стороні без
// потреби (FE-10).

export const getInitials = (name?: string | null): string => {
  const trimmed = name?.trim();
  if (!trimmed) return '?';
  return trimmed
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Насичені кольори, що однаково добре читаються з білим текстом і в
// світлій, і в темній темі — підбираються детерміновано за іменем, щоб
// кожна людина в списку виглядала візуально відмінною від сусідів.
const AVATAR_COLORS = [
  'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-lime-600',
  'bg-emerald-500', 'bg-teal-500', 'bg-cyan-600', 'bg-blue-500',
  'bg-indigo-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-pink-500',
] as const;

export const getAvatarColorClass = (name?: string | null): string => {
  const key = name?.trim() || '?';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
