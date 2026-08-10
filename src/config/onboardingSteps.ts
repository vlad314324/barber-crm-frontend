import { Scissors, User, Users, Settings, type LucideIcon } from 'lucide-react';

export interface OnboardingStep {
  key: 'services' | 'employees' | 'clients' | 'settings';
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  whyKey: string;
  route: string;
  optional?: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { key: 'services', icon: Scissors, titleKey: 'onboarding.stepServicesTitle', descKey: 'onboarding.stepServicesDesc', whyKey: 'onboarding.stepServicesWhy', route: '/services' },
  { key: 'employees', icon: User, titleKey: 'onboarding.stepEmployeesTitle', descKey: 'onboarding.stepEmployeesDesc', whyKey: 'onboarding.stepEmployeesWhy', route: '/employees' },
  { key: 'clients', icon: Users, titleKey: 'onboarding.stepClientsTitle', descKey: 'onboarding.stepClientsDesc', whyKey: 'onboarding.stepClientsWhy', route: '/clients', optional: true },
  { key: 'settings', icon: Settings, titleKey: 'onboarding.stepSettingsTitle', descKey: 'onboarding.stepSettingsDesc', whyKey: 'onboarding.stepSettingsWhy', route: '/settings' },
];
