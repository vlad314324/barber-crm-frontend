// Необовʼязкові поля картки клієнта (Client.instagram / Client.birthday).

export const instagramUrl = (nick: string): string => `https://instagram.com/${encodeURIComponent(nick)}`;

// birthday зберігається як "YYYY-MM-DD" без часу — розбираємо вручну, бо
// new Date("YYYY-MM-DD") трактується як UTC і в західних таймзонах
// показало б попередній день.
export const formatBirthday = (iso: string, locale?: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(locale);
};
