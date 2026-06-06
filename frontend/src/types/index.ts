export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  is_verified: boolean;
  resident_id?: string;
  resident?: Resident;
}

export interface Resident {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  birthdate: string;
  age?: number;
  gender: string;
  civil_status: string;
  occupation?: string;
  contact_number?: string;
  email?: string;
  address: string;
  citizenship: string;
  residency_status: string;
  voter_status: string;
  profile_photo?: string;
  household_id?: string;
  is_household_head: boolean;
  qr_id: string;
  created_at: string;
  updated_at: string;
}

export interface Household {
  id: string;
  household_number: string;
  head_id?: string;
  head?: Resident;
  poverty_level: string;
  address: string;
  members?: Resident[];
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  resident_id: string;
  resident?: Resident;
  type: string;
  document_number: string;
  status: string;
  purpose: string;
  e_signature_path?: string;
  pdf_path?: string;
  qr_hash: string;
  fee: number;
  payment_status: string;
  request_date: string;
  issue_date?: string;
  created_at: string;
}

export interface Blotter {
  id: string;
  case_number: string;
  complainant: string;
  respondent: string;
  details: string;
  status: string;
  incident_date: string;
  filing_date: string;
  hearing_schedules?: string; // JSON list
  settlement_details?: string;
  evidence_paths?: string;
  ai_summary?: string;
  created_at: string;
}

export interface Business {
  id: string;
  business_name: string;
  owner_id: string;
  owner?: Resident;
  permit_number: string;
  status: string;
  address: string;
  category?: string;
  registration_date: string;
  expiry_date: string;
  inspection_status: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  resident_id: string;
  resident?: Resident;
  purpose: string;
  appointment_date: string;
  time_slot: string;
  status: string;
  queue_number: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  reference_number: string;
  purpose: string;
  amount: number;
  status: string;
  payor_name: string;
  certificate_id?: string;
  business_id?: string;
  transaction_date: string;
  created_at: string;
}

export interface DashboardStats {
  total_residents: number;
  total_households: number;
  indigent_households: number;
  active_incidents: number;
  active_businesses: number;
  voters_count: number;
  senior_citizens: number;
  solo_parents: number;
  pwd_residents: number;
  age_demographics: {
    children: number;
    youth: number;
    adults: number;
    seniors: number;
  };
  gender_ratio: {
    [key: string]: number;
  };
  revenue_history: {
    month: string;
    amount: number;
  }[];
}
