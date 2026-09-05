/**
 * Authentication and User Types
 */

export type UserRole = "customer" | "worker";

export interface CustomerProfile {
  id?: number;
  phone: string;
  name?: string;
  address?: string;
  village_town?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
}

export interface WorkerProfile {
  id: number;
  name: string;
  phone: string;
  skill: string;
  experience?: string;
  location: string;
  availability?: string;
  is_available: number;
  verified: number;
  certification?: string;
  additional_skills?: string;
  ncct_cert_id?: string;
  badge_level?: string;
  verification_hash?: string;
  welfare_status?: string;
  insurance_status?: string;
  society_id?: number;
  society_name?: string;
  society_reg_number?: string;
  society_cluster?: string;
  avg_rating?: number;
  rating_count?: number;
  completed_jobs?: number;
}

export interface AuthSession {
  token: string;
  role: UserRole;
  phone: string;
  name?: string;
  id?: number;
  customer?: CustomerProfile;
  worker?: WorkerProfile;
}
