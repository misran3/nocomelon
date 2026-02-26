import { Shield, Palette, Baby, FileText, Volume2, BookOpen } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Safe by Design',
    description: '4 layers of content protection. Parent review at every step. Nothing reaches your child without your approval.',
  },
  {
    icon: Palette,
    title: 'Multiple Art Styles',
    description: 'Storybook or Watercolor — your choice. Each style transforms your child\'s idea into polished cartoon frames.',
  },
  {
    icon: Baby,
    title: 'Age-Adaptive',
    description: 'Content auto-adjusts for ages 2-9. Vocabulary, pacing, and story complexity scale with your child.',
  },
  {
    icon: FileText,
    title: 'Script Review',
    description: 'See every word before generation. Edit lines, regenerate, or approve. Full transparency, full control.',
  },
  {
    icon: Volume2,
    title: 'Pro Voice Narration',
    description: 'ElevenLabs character voices bring stories to life. Gentle for bedtime, cheerful for adventures.',
  },
  {
    icon: BookOpen,
    title: 'Personal Library',
    description: 'A growing collection of stories made just for your child. Share with family via a simple link.',
  },
];

export default function Features() {
  return (
    <section id="features" className="section-padding bg-surface">
      <div className="section-container">
        <h2 className="section-title">Key Features</h2>
        <p className="section-subtitle">
          Everything parents need to create magical, safe content
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="card">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-text-muted text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
