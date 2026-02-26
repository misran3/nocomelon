import { Style, Theme, VoiceType } from '../types';

/**
 * Step labels for the wizard progress bar
 */
export const STEP_LABELS = [
  'Upload',
  'Recognize',
  'Customize',
  'Script',
  'Preview',
  'Save'
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

/**
 * Visual style options for story generation
 */
export const STYLES: { id: Style; label: string; icon: string }[] = [
  { id: 'storybook', label: 'Storybook', icon: '📖' },
  { id: 'watercolor', label: 'Watercolor', icon: '🎨' }
];

/**
 * Theme options for story generation
 */
export const THEMES: { id: Theme; label: string; icon: string }[] = [
  { id: 'adventure', label: 'Adventure', icon: '🗺️' },
  { id: 'kindness', label: 'Kindness', icon: '💛' },
  { id: 'bravery', label: 'Bravery', icon: '🦁' },
  { id: 'bedtime', label: 'Bedtime', icon: '🌙' },
  { id: 'friendship', label: 'Friendship', icon: '🤝' },
  { id: 'counting', label: 'Counting', icon: '🔢' },
  { id: 'nature', label: 'Nature', icon: '🌿' }
];

/**
 * Voice type options for narration
 */
export const VOICES: { id: VoiceType; label: string; description: string }[] = [
  { id: 'gentle', label: 'Gentle', description: 'Warm, calm – great for bedtime stories' },
  { id: 'cheerful', label: 'Cheerful', description: 'Bright, energetic – great for younger kids' }
];
