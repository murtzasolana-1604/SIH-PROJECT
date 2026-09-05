/**
 * Booking, Invoice, Payment, and Service Types
 */

export interface ServiceItem {
  id: number;
  name: string;
  category: string;
  icon?: string;
  description?: string;
  basePrice: number;
  effectivePrice: number;
  fairWagePrice: number;
  fairWageLabel: string;
  benefitNote: string;
  isHighDemand: boolean;
  demandMultiplier: number;
  scarcityBonus: number;
}

export type BookingStatus = "Pending" | "Assigned" | "In Progress" | "Completed" | "Cancelled";

export interface Booking {
  id: number;
  service: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  is_emergency: number;
  emergency_type?: string;
  assigned_worker_id?: number | null;
  worker_name?: string;
  worker_phone?: string;
  worker_skill?: string;
  worker_location?: string;
  customer_lat?: number | null;
  customer_lng?: number | null;
  created_at?: string;
}

export interface Invoice {
  id: number;
  booking_id: number;
  service_charge: number;
  cooperative_share: number;
  worker_earning: number;
  total_amount: number;
  payment_status: "pending" | "paid";
  payment_method?: string | null;
  paid_at?: string | null;
  created_at?: string;
}

export interface Rating {
  id: number;
  booking_id: number;
  worker_id: number;
  worker_name?: string;
  customer_name?: string;
  service?: string;
  stars: number;
  comment?: string;
  tags?: string[];
  created_at?: string;
}

export interface EmergencyQueueItem {
  id: number;
  booking_id: number;
  service: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  status: string;
  assigned_worker_id?: number | null;
  worker_name?: string;
  sla_minutes: number;
  created_at: string;
}

export interface WorkerEarningsSummary {
  todayEarnings: number;
  weekEarnings: number;
  totalEarnings: number;
  totalCoopShare: number;
  completedJobsCount: number;
  invoices: any[];
}

export interface WorkerWelfareDetails {
  workerId: number;
  workerName: string;
  phone: string;
  verified: boolean;
  ncctCertId?: string;
  badgeLevel?: string;
  society?: {
    name: string;
    regNumber: string;
    poolBalance: number;
  };
  policy?: {
    policyNumber: string;
    schemeName: string;
    coverageAmount: number;
    annualPremium: number;
    subsidyStatus: string;
    validFrom: string;
    validTo: string;
    status: string;
    certificateHash: string;
  };
  claims?: Array<{
    id: number;
    claimNumber: string;
    type: string;
    requestedAmount: number;
    approvedAmount: number;
    status: string;
    description: string;
    createdAt: string;
  }>;
  metrics?: {
    totalContribution: number;
    sponsoredPremiumValue: number;
    accidentalCoverage: number;
  };
}
