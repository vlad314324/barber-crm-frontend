import { parsePhoneNumber, getCountryCallingCode, isSupportedCountry } from 'react-phone-number-input';
import type { Country } from 'react-phone-number-input';

const DEFAULT_COUNTRY: Country = 'UA';

// Часовий пояс салону -> країна (фолбек, коли телефон салону не вказано).
const TIMEZONE_COUNTRY: Record<string, Country> = {
  'Europe/Kyiv': 'UA',
  'Europe/Prague': 'CZ',
  'Europe/Warsaw': 'PL',
  'Europe/Berlin': 'DE',
  'Europe/London': 'GB',
  'America/New_York': 'US',
};

// Країна салону для підстановки телефонного коду в нових номерах:
// спершу з телефону салону (+420… -> CZ), далі з часового поясу.
export const shopCountry = (phone?: string, timezone?: string): Country => {
  try {
    const fromPhone = phone ? parsePhoneNumber(phone)?.country : undefined;
    if (fromPhone && isSupportedCountry(fromPhone)) return fromPhone;
  } catch {
    // невалідний номер — ідемо до часового поясу
  }
  return (timezone && TIMEZONE_COUNTRY[timezone]) || DEFAULT_COUNTRY;
};

// "+420"
export const dialCodeOf = (country: Country) => `+${getCountryCallingCode(country)}`;
