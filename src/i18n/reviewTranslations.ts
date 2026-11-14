import { BookingLang } from './bookingTranslations';

// Тексти публічних відгуків: сторінка відгуку за одноразовим посиланням
// (/review/:salonSlug/:token) і список відгуків майстра на сторінці бронювання.
interface ReviewDict {
  title: string;
  subtitle: string; // {{master}} {{date}}
  ratingLabel: string;
  ratingNames: [string, string, string, string, string];
  textLabel: string;
  textPlaceholder: string;
  submit: string;
  sending: string;
  chooseRating: string;
  thanksTitle: string;
  thanksText: string;
  bookAgain: string;
  invalidTitle: string;
  invalidText: string;
  error: string;
  loading: string;
  reviews: string; // {{count}}
  noReviews: string;
  close: string;
}

const uk: ReviewDict = {
  title: 'Як пройшов ваш візит?',
  subtitle: 'Майстер {{master}}, {{date}}',
  ratingLabel: 'Ваша оцінка',
  ratingNames: ['Погано', 'Так собі', 'Нормально', 'Добре', 'Чудово'],
  textLabel: 'Відгук (необов’язково)',
  textPlaceholder: 'Що сподобалось? Що можна покращити?',
  submit: 'Надіслати відгук',
  sending: 'Надсилаємо...',
  chooseRating: 'Оберіть оцінку від 1 до 5 зірок',
  thanksTitle: 'Дякуємо за відгук!',
  thanksText: 'Ваша думка дуже важлива для нас і для майстра.',
  bookAgain: 'Записатися знову',
  invalidTitle: 'Посилання вже неактивне',
  invalidText: 'Відгук за цим посиланням уже залишено або посилання недійсне.',
  error: 'Не вдалося надіслати відгук. Спробуйте ще раз.',
  loading: 'Завантаження...',
  reviews: 'Відгуки ({{count}})',
  noReviews: 'Поки що немає відгуків.',
  close: 'Закрити',
};

const en: ReviewDict = {
  title: 'How was your visit?',
  subtitle: 'With {{master}}, {{date}}',
  ratingLabel: 'Your rating',
  ratingNames: ['Poor', 'Fair', 'Okay', 'Good', 'Excellent'],
  textLabel: 'Review (optional)',
  textPlaceholder: 'What did you like? What could be better?',
  submit: 'Send review',
  sending: 'Sending...',
  chooseRating: 'Choose a rating from 1 to 5 stars',
  thanksTitle: 'Thank you for your review!',
  thanksText: 'Your feedback means a lot to us and to your specialist.',
  bookAgain: 'Book again',
  invalidTitle: 'This link is no longer active',
  invalidText: 'A review has already been left with this link, or the link is invalid.',
  error: 'Could not send the review. Please try again.',
  loading: 'Loading...',
  reviews: 'Reviews ({{count}})',
  noReviews: 'No reviews yet.',
  close: 'Close',
};

const cs: ReviewDict = {
  title: 'Jak se vám líbila návštěva?',
  subtitle: '{{master}}, {{date}}',
  ratingLabel: 'Vaše hodnocení',
  ratingNames: ['Špatné', 'Nic moc', 'Dobré', 'Velmi dobré', 'Výborné'],
  textLabel: 'Recenze (nepovinné)',
  textPlaceholder: 'Co se vám líbilo? Co by šlo zlepšit?',
  submit: 'Odeslat recenzi',
  sending: 'Odesíláme...',
  chooseRating: 'Vyberte hodnocení od 1 do 5 hvězdiček',
  thanksTitle: 'Děkujeme za recenzi!',
  thanksText: 'Váš názor je pro nás i pro vaši mistryni či mistra velmi důležitý.',
  bookAgain: 'Rezervovat znovu',
  invalidTitle: 'Odkaz už není aktivní',
  invalidText: 'Přes tento odkaz už byla recenze napsána, nebo je odkaz neplatný.',
  error: 'Recenzi se nepodařilo odeslat. Zkuste to prosím znovu.',
  loading: 'Načítání...',
  reviews: 'Recenze ({{count}})',
  noReviews: 'Zatím žádné recenze.',
  close: 'Zavřít',
};

const pl: ReviewDict = {
  title: 'Jak minęła wizyta?',
  subtitle: '{{master}}, {{date}}',
  ratingLabel: 'Twoja ocena',
  ratingNames: ['Słabo', 'Tak sobie', 'Dobrze', 'Bardzo dobrze', 'Świetnie'],
  textLabel: 'Opinia (opcjonalnie)',
  textPlaceholder: 'Co Ci się podobało? Co można poprawić?',
  submit: 'Wyślij opinię',
  sending: 'Wysyłanie...',
  chooseRating: 'Wybierz ocenę od 1 do 5 gwiazdek',
  thanksTitle: 'Dziękujemy za opinię!',
  thanksText: 'Twoje zdanie jest dla nas i dla specjalisty bardzo ważne.',
  bookAgain: 'Zarezerwuj ponownie',
  invalidTitle: 'Link nie jest już aktywny',
  invalidText: 'Opinia z tego linku została już wystawiona lub link jest nieprawidłowy.',
  error: 'Nie udało się wysłać opinii. Spróbuj ponownie.',
  loading: 'Ładowanie...',
  reviews: 'Opinie ({{count}})',
  noReviews: 'Brak opinii.',
  close: 'Zamknij',
};

const de: ReviewDict = {
  title: 'Wie war Ihr Besuch?',
  subtitle: 'Bei {{master}}, {{date}}',
  ratingLabel: 'Ihre Bewertung',
  ratingNames: ['Schlecht', 'Mäßig', 'Okay', 'Gut', 'Ausgezeichnet'],
  textLabel: 'Bewertung (optional)',
  textPlaceholder: 'Was hat Ihnen gefallen? Was können wir besser machen?',
  submit: 'Bewertung senden',
  sending: 'Wird gesendet...',
  chooseRating: 'Wählen Sie 1 bis 5 Sterne',
  thanksTitle: 'Vielen Dank für Ihre Bewertung!',
  thanksText: 'Ihre Meinung ist uns und Ihrem Spezialisten sehr wichtig.',
  bookAgain: 'Erneut buchen',
  invalidTitle: 'Dieser Link ist nicht mehr aktiv',
  invalidText: 'Mit diesem Link wurde bereits eine Bewertung abgegeben, oder der Link ist ungültig.',
  error: 'Die Bewertung konnte nicht gesendet werden. Bitte versuchen Sie es erneut.',
  loading: 'Wird geladen...',
  reviews: 'Bewertungen ({{count}})',
  noReviews: 'Noch keine Bewertungen.',
  close: 'Schließen',
};

export const reviewTranslations: Record<BookingLang, ReviewDict> = { uk, en, cs, pl, de };

export const tReview = (lang: BookingLang, key: Exclude<keyof ReviewDict, 'ratingNames'>, vars?: Record<string, string | number>): string => {
  const s = (reviewTranslations[lang] || uk)[key];
  return vars ? s.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? '')) : s;
};
