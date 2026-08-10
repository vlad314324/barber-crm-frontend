import axios from 'axios';

export const getErrorMessage = (err: unknown): string | undefined => {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { msg?: string } | undefined)?.msg;
  }
  return undefined;
};

export const getErrorCode = (err: unknown): string | undefined => {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { code?: string } | undefined)?.code;
  }
  return undefined;
};

const CODE_MESSAGE_KEYS: Record<string, string> = {
  SALON_NOT_FOUND: 'errors.salonNotFound',
  SALON_SLUG_TAKEN: 'errors.salonSlugTaken',
  INVALID_SLUG: 'errors.invalidSlug',
  TENANT_MISMATCH: 'errors.tenantMismatch',
  RESET_TOKEN_INVALID: 'resetPassword.invalidToken',
  PASSWORD_TOO_SHORT: 'resetPassword.passwordTooShort',
  ACCOUNT_DEACTIVATED: 'login.accountDeactivated',
};

export const resolveErrorMessage = (
  err: unknown,
  t: (path: string) => string,
  fallback: string
): string => {
  const code = getErrorCode(err);
  if (code && CODE_MESSAGE_KEYS[code]) return t(CODE_MESSAGE_KEYS[code]);
  return getErrorMessage(err) || fallback;
};
