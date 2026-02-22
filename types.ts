
export type UserRole = 'super_admin' | 'staff';

export interface AppConfig {
  appName: string;
  appSubtitle: string;
  logoUrl: string;
}

export interface UserAccount {
  username: string;
  password: string;
  role: UserRole;
}

export interface RegistrationData {
  admission_id: string;
  name: string;
  gender: string;
  age: string;
  qualification: string;
  medium: string;
  contact_no: string;
  whatsapp_no: string;
  address: string;
  // Payment 1 (Initial)
  payment1_amount: string;
  payment1_date: string;
  payment1_utr: string;
  // Payment 2
  payment2_amount: string;
  payment2_date: string;
  payment2_utr: string;
  // Payment 3
  payment3_amount: string;
  payment3_date: string;
  payment3_utr: string;
  // Payment 4
  payment4_amount: string;
  payment4_date: string;
  payment4_utr: string;
  
  received_ac: string;
  discount: string;
  remaining_amount: string;
  status: 'active' | 'cancelled';
}

export interface ProcessingRecord {
  id: string;
  timestamp: number;
  syncedAt?: number;
  fileName: string;
  imageUrl: string;
  data: RegistrationData | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  source: 'ocr' | 'manual';
  syncStatus: 'idle' | 'syncing' | 'synced' | 'failed';
  error?: string;
}
