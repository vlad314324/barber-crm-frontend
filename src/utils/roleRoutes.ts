type Role = 'admin' | 'barber' | 'client';

export const defaultRouteForRole = (role: Role | undefined): string => {
  switch (role) {
    case 'admin': return '/';
    case 'barber': return '/appointments';
    default: return '/login';
  }
};
