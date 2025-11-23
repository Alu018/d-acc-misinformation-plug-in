export type ContentType = 'text' | 'image' | 'video' | 'other';
export type FlagType = 'scam' | 'misinformation' | 'fake_profile' | 'other';

export interface FlaggedContent {
  id: number;
  url: string;
  page_url: string;
  content: string;
  content_type: ContentType;
  flag_type: FlagType;
  confidence: number; // 0-100 integer
  note: string | null;
  selector: string | null;
  created_at: string;
}

export interface FlaggedLink {
  id: number;
  url: string;
  flag_type: FlagType;
  confidence: number; // 0-100 integer
  note: string | null;
  flagged_by_url: string | null;
  username: string | null;
  created_at: string;
}