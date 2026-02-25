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
  video_path: string;
  duration_sec: number;
  thumbnail: string;
}

export interface StorybookEntry {
  id: string;
  title: string;
  thumbnail: string;
  duration_sec: number;
  style: Style;
  createdAt: Date;
}

export interface WizardState {
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
