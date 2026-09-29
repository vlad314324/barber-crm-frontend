import { getInitials, getAvatarColorClass } from '../utils/avatar';

interface AvatarProps {
  name: string;
  /** Діаметр у пікселях. */
  size?: number;
  /** Додаткові класи (ring, margin, opacity/grayscale тощо). */
  className?: string;
}

// Ініціали на кольоровому тлі замість <img> із зовнішнього сервісу — див.
// src/utils/avatar.ts. Ім'я вже видно поруч у кожному місці використання,
// тож підпис тут суто декоративний і не дублюється скрін-рідером.
const Avatar = ({ name, size = 40, className = '' }: AvatarProps) => (
  <div
    aria-hidden="true"
    className={`inline-flex items-center justify-center rounded-full text-white font-semibold flex-shrink-0 ${getAvatarColorClass(name)} ${className}`}
    style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.4)) }}
  >
    {getInitials(name)}
  </div>
);

export default Avatar;
