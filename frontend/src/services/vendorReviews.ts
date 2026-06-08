import type { VendorReview, VendorReviewStats } from '../shared';
import { api } from './api';

export interface VendorReviewPayload {
  vendorId: string;
  projectId: string;
  score: number;
  reviewContent?: string;
  issueDescription?: string;
  recommendContinue: string;
}

export function fetchVendorReviews(params?: { vendorId?: string; projectId?: string; recommendContinue?: string }) {
  const query = new URLSearchParams();
  if (params?.vendorId) query.set('vendorId', params.vendorId);
  if (params?.projectId) query.set('projectId', params.projectId);
  if (params?.recommendContinue) query.set('recommendContinue', params.recommendContinue);
  const queryStr = query.toString();
  return api.get<VendorReview[]>(`/api/vendor-reviews${queryStr ? `?${queryStr}` : ''}`);
}

export function fetchVendorReview(id: string) {
  return api.get<VendorReview>(`/api/vendor-reviews/${id}`);
}

export function fetchVendorReviewStats(vendorId: string) {
  return api.get<VendorReviewStats>(`/api/vendor-reviews/stats/by-vendor/${vendorId}`);
}

export function fetchAllVendorReviewStats() {
  return api.get<VendorReviewStats[]>('/api/vendor-reviews/stats/all');
}

export function createVendorReview(payload: VendorReviewPayload) {
  return api.post<VendorReview>('/api/vendor-reviews', payload);
}

export function updateVendorReview(id: string, payload: VendorReviewPayload) {
  return api.put<VendorReview>(`/api/vendor-reviews/${id}`, payload);
}

export function deleteVendorReview(id: string) {
  return api.delete<void>(`/api/vendor-reviews/${id}`);
}
