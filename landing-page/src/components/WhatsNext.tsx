import { Mic, Globe, Film, Users } from 'lucide-react';

const roadmap = [
  {
    icon: Mic,
    title: 'Voice Cloning',
    description: 'Stories narrated in Mom or Dad\'s voice using ElevenLabs voice cloning.',
  },
  {
    icon: Globe,
    title: 'Multi-Language',
    description: 'Generate storybooks in different languages for bilingual families.',
  },
  {
    icon: Film,
    title: 'Full Cartoons',
    description: 'Upgrade from animated storybooks to short cartoon clips with character animation.',
  },
  {
    icon: Users,
    title: 'Parent Community',
    description: 'A shared space where parents browse and react to each other\'s kids\' storybooks.',
  },
];

export default function WhatsNext() {
  return (
    <section className="section-padding">
      <div className="section-container">
        <h2 className="section-title">What's Next?</h2>
        <p className="section-subtitle">
          Features we're excited to build after the hackathon
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roadmap.map((item) => (
            <div key={item.title} className="card opacity-80 hover:opacity-100">
              <div className="w-12 h-12 bg-text-muted/10 rounded-lg flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-text-muted" />
              </div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-text-muted text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
