
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
  initial_payment: string;
  date: string;
  utr: string;
  received_ac: string;
  discount: string;
  remaining_amount: string;
}

export interface ProcessingRecord {
  id: string;
  timestamp: number;
  fileName: string;
  imageUrl: string;
  data: RegistrationData | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  source: 'ocr' | 'manual';
  error?: string;
}
