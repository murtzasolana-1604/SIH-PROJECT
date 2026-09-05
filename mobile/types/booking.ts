/**
 * Booking, Invoice, Payment, and Service Types
 */

export interface ServiceItem {
  id: number | string;
  name: string;
  category: string;
  icon?: string;
  description?: string;
  basePrice: number;
  effectivePrice?: number;
  fairWagePrice?: number;
  fairWageLabel?: string;
  benefitNote?: string;
  isHighDemand?: boolean;
  demandMultiplier?: number;
  scarcityBonus?: number;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "Pending"
  | "Assigned"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export interface Booking {
  id: string;
  service: string;
  customerName: string;
  customerPhone: string;
  customer_name?: string;
  customer_phone?: string;
  address: string;
  bookingDate: string;
  bookingTime: string;
  booking_date?: string;
  booking_time?: string;
  status: BookingStatus | string;
  isEmergency?: boolean | number;
  is_emergency?: number;
  price?: number;
  emergency_type?: string;
  assigned_worker_id?: number | null;
  workerName?: string;
  workerPhone?: string;
  worker_name?: string;
  worker_phone?: string;
  worker_skill?: string;
  worker_location?: string;
  customer_lat?: number | null;
  customer_lng?: number | null;
  created_at?: string;
}

export interface Invoice {
  id: number | string;
  booking_id: number | string;
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
  id: number | string;
  booking_id: number | string;
  worker_id: number | string;
  worker_name?: string;
  customer_name?: string;
  service?: string;
  stars: number;
  comment?: string;
  tags?: string[];
  created_at?: string;
}

export interface EmergencyQueueItem {
  id: number | string;
  booking_id: number | string;
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
  totalEarnings: number;
  livingWageShare: number;
  cooperativeFundShare: number;
  completedJobsCount: number;
  pendingPayout: number;
  todayEarnings?: number;
  weekEarnings?: number;
  totalCoopShare?: number;
  invoices?: any[];
}

export interface WorkerWelfareDetails {
  workerId?: number | string;
  workerName?: string;
  phone?: string;
  verified?: boolean;
  ncctCertId?: string;
  badgeLevel?: string;
  pmsbyStatus?: string;
  pmsbyPolicyNumber?: string;
  coverageAmount?: number;
  validUntil?: string;
  certificateHash?: string;
  claimsCount?: number;
  reliefDisbursed?: number;
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
    id: number | string;
    claimNumber?: string;
    type: string;
    requestedAmount?: number;
    amount?: number;
    approvedAmount?: number;
    status: string;
    description: string;
    createdAt?: string;
    date?: string;
  }>;
  metrics?: {
    totalContribution: number;
    sponsoredPremiumValue: number;
    accidentalCoverage: number;
  };
}
