import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface FlaggedContent {
  id: number;
  url: string;
  page_url: string;
  content: string;
  content_type: 'text' | 'image' | 'video' | 'other';
  flag_type: 'scam' | 'misinformation' | 'other';
  confidence: 'certain' | 'uncertain';
  note: string | null;
  selector: string | null;
  created_at: string;
}