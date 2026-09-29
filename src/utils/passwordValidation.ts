// Дзеркалить backend-правило (utils/password.js): мінімум 8 символів + хоча
// б одна літера й одна цифра. Дає миттєвий фідбек на клієнті замість
// чекати round-trip до сервера на ту саму помилку.
export const PASSWORD_MIN_LENGTH = 8;

export type PasswordError = 'tooShort' | 'tooWeak' | null;

export const getPasswordError = (password: string): PasswordError => {
  if (password.length < PASSWORD_MIN_LENGTH) return 'tooShort';
  if (!/[a-zA-Zа-яА-ЯіІїЇєЄ]/.test(password) || !/[0-9]/.test(password)) return 'tooWeak';
  return null;
};
