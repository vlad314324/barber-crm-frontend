// Пропозиції майстра змінити свій опис/фото послуги з погодженням адміна
// (бекенд: routes/serviceRequestRoutes.js).
import api from './index';
import type { Service } from './types';

export interface OwnServiceContent {
  description: string;
  descriptionTranslations: Partial<Record<string, string>>;
  imageUrl: string;
}

// Послуга в кабінеті майстра: уже з його ціною/описом/фото, а own — лише
// його власні значення (порожні = загальні).
export type MasterService = Service & { own?: OwnServiceContent };

export interface ServiceChangeRequest {
  _id: string;
  employee: string | { _id: string; name: string };
  service: string | { _id: string; name: string; description?: string; translations?: Service['translations']; imageUrl?: string };
  status: 'pending' | 'approved' | 'rejected';
  hasText: boolean;
  description: string;
  descriptionTranslations?: Partial<Record<string, string>>;
  imageUrl?: string;
  removeImage: boolean;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
  // Лише для адміна: поточні власні значення майстра для порівняння.
  current?: OwnServiceContent;
}

export const serviceRequestId = (ref: ServiceChangeRequest['service'] | ServiceChangeRequest['employee']) =>
  typeof ref === 'string' ? ref : ref._id;

export const serviceRequestApi = {
  list: async (): Promise<ServiceChangeRequest[]> => (await api.get('/service-requests')).data,
  submit: async (serviceId: string, data: { description: string; descriptionTranslations: Partial<Record<string, string>>; removeImage?: boolean }): Promise<ServiceChangeRequest> =>
    (await api.put(`/service-requests/mine/${serviceId}`, data)).data,
  uploadImage: async (serviceId: string, image: Blob): Promise<ServiceChangeRequest> => {
    const formData = new FormData();
    formData.append('image', image, 'photo.jpg');
    return (await api.post(`/service-requests/mine/${serviceId}/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  },
  cancel: async (serviceId: string): Promise<void> => { await api.delete(`/service-requests/mine/${serviceId}`); },
  approve: async (id: string): Promise<ServiceChangeRequest> => (await api.post(`/service-requests/${id}/approve`)).data,
  reject: async (id: string, reason: string): Promise<ServiceChangeRequest> => (await api.post(`/service-requests/${id}/reject`, { reason })).data,
};
