import { 
  DrawingAnalysis, 
  StoryScript, 
  VideoResult, 
  StorybookEntry,
  Style,
  Theme,
  VoiceType
} from '../types';

export const MOCK_ANALYSIS: DrawingAnalysis = {
  subject: "purple dinosaur",
  setting: "green field",
  details: ["big friendly eyes", "spiky back", "short arms", "round belly"],
  mood: "happy and playful",
  colors: ["purple", "green", "yellow"]
};

export const STYLES: { id: Style; label: string; icon: string }[] = [
  { id: 'storybook', label: 'Storybook', icon: '📖' },
  { id: 'watercolor', label: 'Watercolor', icon: '🎨' }
];

export const THEMES: { id: Theme; label: string; icon: string }[] = [
  { id: 'adventure', label: 'Adventure', icon: '🗺️' },
  { id: 'kindness', label: 'Kindness', icon: '💛' },
  { id: 'bravery', label: 'Bravery', icon: '🦁' },
  { id: 'bedtime', label: 'Bedtime', icon: '🌙' },
  { id: 'friendship', label: 'Friendship', icon: '🤝' },
  { id: 'counting', label: 'Counting', icon: '🔢' },
  { id: 'nature', label: 'Nature', icon: '🌿' }
];

export const VOICES: { id: VoiceType; label: string; description: string }[] = [
  { id: 'gentle', label: 'Gentle', description: 'Warm, calm – great for bedtime stories' },
  { id: 'cheerful', label: 'Cheerful', description: 'Bright, energetic – great for younger kids' }
];

export const MOCK_STORY: StoryScript = {
  total_scenes: 6,
  scenes: [
    { number: 1, text: "Once, in a bright green field, lived a happy purple dinosaur named Dino. He had big friendly eyes and a round belly that jiggled when he laughed." },
    { number: 2, text: "Today was a very special day—it was Dino's first day of Dinosaur School! He felt a little nervous, clutching his backpack with his short arms." },
    { number: 3, text: "At the school gate, Dino saw other dinosaurs playing tag. \"What if they don't want to play with a purple dinosaur?\" he worried." },
    { number: 4, text: "Just then, a small Triceratops tripped and fell. Dino rushed over. \"Are you okay?\" he asked kindly, helping her up." },
    { number: 5, text: "The Triceratops smiled. \"Thank you! I'm Trixie. Want to play with us?\" Dino beamed, his spiky back wiggling with joy." },
    { number: 6, text: "Dino realized he was brave to help a friend. It was the best first day ever!" }
  ]
};

export const MOCK_VIDEO: VideoResult = {
  video_path: 'https://www.youtube.com/embed/c39VzE2gbQA',
  duration_sec: 75,
  thumbnail: '/thumbnails/dino-school.jpg'
};

export const MOCK_LIBRARY: StorybookEntry[] = [
  {
    id: '1',
    title: "Dino's First Day",
    thumbnail: '/thumbnails/dino-school.jpg',
    duration_sec: 75,
    style: 'storybook',
    createdAt: new Date('2023-10-15')
  },
  {
    id: '2',
    title: "The Magic Garden",
    thumbnail: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80',
    duration_sec: 120,
    style: 'watercolor',
    createdAt: new Date('2023-09-20')
  },
  {
    id: '3',
    title: "Space Explorer",
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    duration_sec: 90,
    style: 'storybook',
    createdAt: new Date('2023-08-05')
  }
];

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
