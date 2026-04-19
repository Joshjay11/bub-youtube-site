export type VoiceSampleSourceType = 'upload_md' | 'upload_txt' | 'upload_docx' | 'paste';

export type SourceKind = 'project' | 'voice_sample';

export interface Source {
  id: string;
  kind: SourceKind;
  title: string;
  sourceType: 'project' | VoiceSampleSourceType;
  wordCount: number;
  createdAt: string;
  included: boolean;
  notes?: string;
  content?: string;
}

export const SOURCE_BADGE_LABELS: Record<Source['sourceType'], string> = {
  project: 'PROJECT',
  upload_md: 'MD',
  upload_txt: 'TXT',
  upload_docx: 'DOCX',
  paste: 'PASTE',
};
