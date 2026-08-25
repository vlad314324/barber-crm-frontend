// Self-contained translations for the public booking page (`/book/:salonSlug`).
// Kept separate from `translations.ts` (the admin CRM's own uk/en interface language)
// because the booking page's language set is per-salon and configurable in Settings,
// independent of the language the salon owner uses to manage the CRM.
// Structured to mirror the relevant slice of the main dictionary (`common`, `roles`,
// `booking`) so existing `t('booking.x')` / `t('common.x')` / `t(\`roles.${role}\`)`
// call sites on the booking page keep working unchanged.

export const BOOKING_LANGS = ['uk', 'en', 'cs', 'pl'] as const;
export type BookingLang = typeof BOOKING_LANGS[number];

export const BOOKING_LANG_LABELS: Record<BookingLang, string> = {
  uk: 'UA',
  en: 'EN',
  cs: 'CZ',
  pl: 'PL',
};

interface BookingDict {
  roles: { Barber: string; Receptionist: string; Manager: string };
  days: {
    monday: string; tuesday: string; wednesday: string; thursday: string;
    friday: string; saturday: string; sunday: string;
  };
  booking: {
    copyAddress: string;
    at: string;
    onlineBooking: string;
    noSalonTitle: string;
    noSalonSubtitle: string;
    menuMaster: string;
    menuDateTime: string;
    menuServices: string;
    menuAbout: string;
    chooseMasterFirst: string;
    bookNow: string;
    confirmSelection: string;
    aboutTitle: string;
    workingHoursTitle: string;
    locationTitle: string;
    noCoordinates: string;
    chooseService: string;
    chooseMaster: string;
    chooseDateTime: string;
    contactsTitle: string;
    confirmTitle: string;
    selectedCount: string;
    dateLabel: string;
    availableTimeLabel: string;
    closedMessage: string;
    noSlots: string;
    nameLabel: string;
    namePlaceholder: string;
    phoneLabel: string;
    emailLabel: string;
    next: string;
    back: string;
    confirmBtn: string;
    booking: string;
    confirmed: string;
    masterLabel: string;
    servicesLabel: string;
    dateTimeLabel: string;
    durationLabel: string;
    sumLabel: string;
    bookAgain: string;
    invalidEmail: string;
    fillAll: string;
    bookingError: string;
    minutes: string;
  };
}

const uk: BookingDict = {
  roles: { Barber: 'Майстер', Receptionist: 'Рецепціоніст', Manager: 'Менеджер' },
  days: { monday: 'Пн', tuesday: 'Вт', wednesday: 'Ср', thursday: 'Чт', friday: 'Пт', saturday: 'Сб', sunday: 'Нд' },
  booking: {
    copyAddress: 'Скопіювати',
    at: 'о',
    onlineBooking: 'Онлайн-запис',
    noSalonTitle: 'Заклад не вказано',
    noSalonSubtitle: 'Це посилання не веде на жоден конкретний салон. Перевірте, чи скопійоване посилання правильне — воно має містити назву закладу (наприклад, /book/barbershop).',
    menuMaster: 'Виберіть спеціаліста',
    menuDateTime: 'Виберіть дату та час',
    menuServices: 'Вибір послуг',
    menuAbout: 'Про заклад',
    chooseMasterFirst: 'Спочатку оберіть майстра',
    bookNow: 'Записатися',
    confirmSelection: 'Готово',
    aboutTitle: 'Про заклад',
    workingHoursTitle: 'Години роботи',
    locationTitle: 'Місцезнаходження',
    noCoordinates: 'Адміністратор ще не вказав координати на карті',
    chooseService: 'Оберіть послугу',
    chooseMaster: 'Оберіть майстра',
    chooseDateTime: 'Оберіть дату та час',
    contactsTitle: 'Ваші контакти',
    confirmTitle: 'Підтвердження запису',
    selectedCount: 'Обрано: {{count}} послуг • {{duration}} хв',
    dateLabel: 'Дата',
    availableTimeLabel: 'Вільний час',
    closedMessage: '🚫 Заклад не працює в цей день',
    noSlots: 'Немає вільних слотів на цю дату',
    nameLabel: "Ім'я *",
    namePlaceholder: 'Іван Петренко',
    phoneLabel: 'Телефон *',
    emailLabel: 'Email *',
    next: 'Далі',
    back: 'Назад',
    confirmBtn: 'Підтвердити запис',
    booking: 'Бронюємо...',
    confirmed: 'Запис підтверджено!',
    masterLabel: 'Майстер',
    servicesLabel: 'Послуги',
    dateTimeLabel: 'Дата і час',
    durationLabel: 'Тривалість',
    sumLabel: 'Сума',
    bookAgain: 'Записатись ще раз',
    invalidEmail: 'Введіть коректний email (наприклад: ivan@gmail.com)',
    fillAll: 'Заповніть всі поля',
    bookingError: 'Помилка при бронюванні',
    minutes: 'хв',
  },
};

const en: BookingDict = {
  roles: { Barber: 'Barber', Receptionist: 'Receptionist', Manager: 'Manager' },
  days: { monday: 'Mo', tuesday: 'Tu', wednesday: 'We', thursday: 'Th', friday: 'Fr', saturday: 'Sa', sunday: 'Su' },
  booking: {
    copyAddress: 'Copy',
    at: 'at',
    onlineBooking: 'Online booking',
    noSalonTitle: 'No salon specified',
    noSalonSubtitle: 'This link doesn’t point to a specific salon. Check that you copied the full link — it should include the salon’s name (e.g. /book/barbershop).',
    menuMaster: 'Choose a specialist',
    menuDateTime: 'Choose date & time',
    menuServices: 'Choose services',
    menuAbout: 'About this place',
    chooseMasterFirst: 'Choose a master first',
    bookNow: 'Book now',
    confirmSelection: 'Done',
    aboutTitle: 'About this place',
    workingHoursTitle: 'Working hours',
    locationTitle: 'Location',
    noCoordinates: 'The admin hasn’t set map coordinates yet',
    chooseService: 'Choose a service',
    chooseMaster: 'Choose a master',
    chooseDateTime: 'Choose date and time',
    contactsTitle: 'Your contacts',
    confirmTitle: 'Booking confirmation',
    selectedCount: '{{count}} services selected • {{duration}} min',
    dateLabel: 'Date',
    availableTimeLabel: 'Available time',
    closedMessage: '🚫 The shop is closed this day',
    noSlots: 'No available slots for this date',
    nameLabel: 'Name *',
    namePlaceholder: 'John Smith',
    phoneLabel: 'Phone *',
    emailLabel: 'Email *',
    next: 'Next',
    back: 'Back',
    confirmBtn: 'Confirm Booking',
    booking: 'Booking...',
    confirmed: 'Booking confirmed!',
    masterLabel: 'Master',
    servicesLabel: 'Services',
    dateTimeLabel: 'Date & Time',
    durationLabel: 'Duration',
    sumLabel: 'Total',
    bookAgain: 'Book again',
    invalidEmail: 'Enter a valid email (e.g. john@gmail.com)',
    fillAll: 'Please fill in all fields',
    bookingError: 'Error while booking',
    minutes: 'min',
  },
};

const cs: BookingDict = {
  roles: { Barber: 'Holič', Receptionist: 'Recepční', Manager: 'Manažer' },
  days: { monday: 'Po', tuesday: 'Út', wednesday: 'St', thursday: 'Čt', friday: 'Pá', saturday: 'So', sunday: 'Ne' },
  booking: {
    copyAddress: 'Kopírovat',
    at: 'v',
    onlineBooking: 'Online rezervace',
    noSalonTitle: 'Salon nebyl zadán',
    noSalonSubtitle: 'Tento odkaz neodkazuje na konkrétní salon. Zkontrolujte, zda jste zkopírovali celý odkaz — měl by obsahovat název salonu (např. /book/barbershop).',
    menuMaster: 'Vybrat specialistu',
    menuDateTime: 'Vybrat datum a čas',
    menuServices: 'Výběr služeb',
    menuAbout: 'O salonu',
    chooseMasterFirst: 'Nejprve vyberte mistra',
    bookNow: 'Rezervovat',
    confirmSelection: 'Hotovo',
    aboutTitle: 'O salonu',
    workingHoursTitle: 'Otevírací doba',
    locationTitle: 'Poloha',
    noCoordinates: 'Administrátor zatím nenastavil souřadnice na mapě',
    chooseService: 'Vyberte službu',
    chooseMaster: 'Vyberte mistra',
    chooseDateTime: 'Vyberte datum a čas',
    contactsTitle: 'Vaše kontaktní údaje',
    confirmTitle: 'Potvrzení rezervace',
    selectedCount: 'Vybráno: {{count}} služeb • {{duration}} min',
    dateLabel: 'Datum',
    availableTimeLabel: 'Volný čas',
    closedMessage: '🚫 Salon je tento den zavřený',
    noSlots: 'Na tento den nejsou volné termíny',
    nameLabel: 'Jméno *',
    namePlaceholder: 'Jan Novák',
    phoneLabel: 'Telefon *',
    emailLabel: 'Email *',
    next: 'Další',
    back: 'Zpět',
    confirmBtn: 'Potvrdit rezervaci',
    booking: 'Rezervujeme...',
    confirmed: 'Rezervace potvrzena!',
    masterLabel: 'Mistr',
    servicesLabel: 'Služby',
    dateTimeLabel: 'Datum a čas',
    durationLabel: 'Doba trvání',
    sumLabel: 'Celkem',
    bookAgain: 'Rezervovat znovu',
    invalidEmail: 'Zadejte platný email (např. jan@gmail.com)',
    fillAll: 'Vyplňte prosím všechna pole',
    bookingError: 'Chyba při rezervaci',
    minutes: 'min',
  },
};

const pl: BookingDict = {
  roles: { Barber: 'Fryzjer', Receptionist: 'Recepcjonistka', Manager: 'Kierownik' },
  days: { monday: 'Pn', tuesday: 'Wt', wednesday: 'Śr', thursday: 'Cz', friday: 'Pt', saturday: 'So', sunday: 'Nd' },
  booking: {
    copyAddress: 'Kopiuj',
    at: 'o',
    onlineBooking: 'Rezerwacja online',
    noSalonTitle: 'Nie podano salonu',
    noSalonSubtitle: 'Ten link nie prowadzi do konkretnego salonu. Sprawdź, czy skopiowałeś pełny link — powinien zawierać nazwę salonu (np. /book/barbershop).',
    menuMaster: 'Wybierz specjalistę',
    menuDateTime: 'Wybierz datę i godzinę',
    menuServices: 'Wybór usług',
    menuAbout: 'O salonie',
    chooseMasterFirst: 'Najpierw wybierz mistrza',
    bookNow: 'Zarezerwuj',
    confirmSelection: 'Gotowe',
    aboutTitle: 'O salonie',
    workingHoursTitle: 'Godziny otwarcia',
    locationTitle: 'Lokalizacja',
    noCoordinates: 'Administrator nie ustawił jeszcze współrzędnych na mapie',
    chooseService: 'Wybierz usługę',
    chooseMaster: 'Wybierz mistrza',
    chooseDateTime: 'Wybierz datę i godzinę',
    contactsTitle: 'Twoje dane kontaktowe',
    confirmTitle: 'Potwierdzenie rezerwacji',
    selectedCount: 'Wybrano: {{count}} usług • {{duration}} min',
    dateLabel: 'Data',
    availableTimeLabel: 'Wolne godziny',
    closedMessage: '🚫 Salon jest zamknięty tego dnia',
    noSlots: 'Brak wolnych terminów na ten dzień',
    nameLabel: 'Imię i nazwisko *',
    namePlaceholder: 'Jan Kowalski',
    phoneLabel: 'Telefon *',
    emailLabel: 'Email *',
    next: 'Dalej',
    back: 'Wstecz',
    confirmBtn: 'Potwierdź rezerwację',
    booking: 'Rezerwujemy...',
    confirmed: 'Rezerwacja potwierdzona!',
    masterLabel: 'Mistrz',
    servicesLabel: 'Usługi',
    dateTimeLabel: 'Data i godzina',
    durationLabel: 'Czas trwania',
    sumLabel: 'Razem',
    bookAgain: 'Zarezerwuj ponownie',
    invalidEmail: 'Podaj poprawny email (np. jan@gmail.com)',
    fillAll: 'Wypełnij wszystkie pola',
    bookingError: 'Błąd podczas rezerwacji',
    minutes: 'min',
  },
};

export const bookingTranslations: Record<BookingLang, BookingDict> = { uk, en, cs, pl };

const getPath = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);

export const tBooking = (lang: BookingLang, path: string, vars?: Record<string, string | number>): string => {
  const raw = getPath(bookingTranslations[lang], path) ?? getPath(bookingTranslations.uk, path);
  let value = typeof raw === 'string' ? raw : path;
  if (vars) {
    Object.entries(vars).forEach(([key, v]) => {
      value = value.replace(new RegExp(`{{${key}}}`, 'g'), String(v));
    });
  }
  return value;
};
