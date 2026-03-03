
export type UserRole = 'super_admin' | 'staff';

export interface AppConfig {
  appName: string;
  appSubtitle: string;
  logoUrl: string;
  adminEmail?: string;
}

export interface UserAccount {
  username: string;
  password: string;
  role: UserRole;
  email?: string;
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
  city: string;
  state: string;
  // Payments 1-10
  payment1_amount: string;
  payment1_date: string;
  payment1_utr: string;
  payment1_method?: 'cash' | 'account';
  payment2_amount: string;
  payment2_date: string;
  payment2_utr: string;
  payment2_method?: 'cash' | 'account';
  payment3_amount: string;
  payment3_date: string;
  payment3_utr: string;
  payment3_method?: 'cash' | 'account';
  payment4_amount: string;
  payment4_date: string;
  payment4_utr: string;
  payment4_method?: 'cash' | 'account';
  payment5_amount: string;
  payment5_date: string;
  payment5_utr: string;
  payment5_method?: 'cash' | 'account';
  payment6_amount: string;
  payment6_date: string;
  payment6_utr: string;
  payment6_method?: 'cash' | 'account';
  payment7_amount: string;
  payment7_date: string;
  payment7_utr: string;
  payment7_method?: 'cash' | 'account';
  payment8_amount: string;
  payment8_date: string;
  payment8_utr: string;
  payment8_method?: 'cash' | 'account';
  payment9_amount: string;
  payment9_date: string;
  payment9_utr: string;
  payment9_method?: 'cash' | 'account';
  payment10_amount: string;
  payment10_date: string;
  payment10_utr: string;
  payment10_method?: 'cash' | 'account';
  
  received_ac: string;
  discount: string;
  total_fees: string;
  remaining_amount: string;
  status: 'confirm' | 'cancelled' | 'pending';
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
