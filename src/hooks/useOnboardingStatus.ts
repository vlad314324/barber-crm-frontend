import { useEffect, useState } from 'react';
import { employeeApi, serviceApi, clientApi } from '../api';
import api from '../api';
import type { ShopSettings } from '../api/types';
import { ONBOARDING_STEPS } from '../config/onboardingSteps';

export interface OnboardingDoneState {
  services: boolean;
  employees: boolean;
  clients: boolean;
  settings: boolean;
}

interface OnboardingStatus {
  loading: boolean;
  done: OnboardingDoneState | null;
  doneCount: number;
  totalRequired: number;
  isComplete: boolean;
}

const requiredSteps = ONBOARDING_STEPS.filter(s => !s.optional);

export const useOnboardingStatus = (enabled = true): OnboardingStatus => {
  const [loading, setLoading] = useState(enabled);
  const [done, setDone] = useState<OnboardingDoneState | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [employees, services, clients, settingsRes] = await Promise.all([
          employeeApi.getAll(),
          serviceApi.getAll(),
          clientApi.getAll(),
          api.get<ShopSettings>('/settings'),
        ]);
        if (cancelled) return;
        setDone({
          services: services.length > 0,
          employees: employees.filter(e => e.isActive !== false).length > 0,
          clients: clients.length > 0,
          settings: !!settingsRes.data.address?.trim(),
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [enabled]);

  const doneCount = done ? requiredSteps.filter(s => done[s.key]).length : 0;
  const isComplete = !!done && doneCount === requiredSteps.length;

  return { loading, done, doneCount, totalRequired: requiredSteps.length, isComplete };
};
