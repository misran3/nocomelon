export type Style = 'storybook' | 'watercolor';

export type Theme = 'adventure' | 'kindness' | 'bravery' | 'bedtime' | 'friendship' | 'counting' | 'nature';

export type VoiceType = 'gentle' | 'cheerful';

export interface DrawingAnalysis {
  subject: string;
  setting: string;
  details: string[];
  mood: string;
  colors: string[];
}

export interface Scene {
  number: number;
  text: string;
}

export interface StoryScript {
  scenes: Scene[];
  total_scenes: number;
}

export interface VideoResult {
  video_key: string;       // S3 key (was video_path)
  duration_sec: number;
  thumbnail_key: string;   // S3 key (was thumbnail)
}

export interface LibraryEntry {
  id: string;
  title: string;
  thumbnail_key: string;   // S3 key
  video_key: string;       // S3 key
  duration_sec: number;
  style: Style;
  created_at: string;      // ISO timestamp (not Date)
}

export interface WizardState {
  run_id: string | null;   // NEW: from vision API
  drawing: File | null;
  analysis: DrawingAnalysis | null;
  customization: {
    style: Style;
    theme: Theme;
    voice: VoiceType;
    age: number;
    personalContext: string;
  };
  script: StoryScript | null;
  video: VideoResult | null;
}
