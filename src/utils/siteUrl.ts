// Публічно поширювані посилання (booking link, QR-код) мають завжди вести
// на канонічний домен, а не на поточний origin — адмінка може бути відкрита
// через технічний домен хостингу (напр. Vercel preview/deploy URL), і тоді
// window.location.origin дав би посилання, яке власник несвідомо розповсюджує
// замість реального сайту.
export const getSiteUrl = () => import.meta.env.VITE_SITE_URL || window.location.origin;
