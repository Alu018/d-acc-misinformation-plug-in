export type ContentType = 'text' | 'image' | 'video' | 'other';
export type FlagType = 'scam' | 'misinformation' | 'other';
export type ConfidenceLevel = 'certain' | 'uncertain';

export interface FlaggedContent {
  id: number;
  url: string;
  page_url: string;
  content: string;
  content_type: ContentType;
  flag_type: FlagType;
  confidence: ConfidenceLevel;
  note: string | null;
  selector: string | null;
  created_at: string;
}