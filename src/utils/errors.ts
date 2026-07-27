import axios from 'axios';

export const getErrorMessage = (err: unknown): string | undefined => {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { msg?: string } | undefined)?.msg;
  }
  return undefined;
};
