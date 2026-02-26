import { AlertCircle, Users, Sparkles } from 'lucide-react';

const cards = [
  {
    icon: AlertCircle,
    title: 'The Problem',
    description:
      'Algorithm-driven platforms prioritize engagement over learning. Kids consume content designed to capture attention, not nurture development.',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  {
    icon: Users,
    title: 'Who We Help',
    description:
      'Parents aged 25-45 with children aged 2-9 who want quality screen time, not just less screen time. They want to be creative directors, not just content blockers.',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
  {
    icon: Sparkles,
    title: 'Our Solution',
    description:
      "Turn your child's drawings into safe, educational animated storybooks. You control the style, theme, and message. AI handles the production.",
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
];

export default function WhyNoComelon() {
  return (
    <section id="why" className="section-padding">
      <div className="section-container">
        <h2 className="section-title">Why NoComelon?</h2>
        <p className="section-subtitle">
          We believe parents should create what their kids watch, not algorithms
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.title} className="card">
              <div className={`w-12 h-12 ${card.bg} rounded-lg flex items-center justify-center mb-4`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-2">{card.title}</h3>
              <p className="text-text-muted">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
