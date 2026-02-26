import { Camera, Eye, PenTool, Image, Volume2, Video, ArrowRight } from 'lucide-react';

const steps = [
  { icon: Camera, label: 'Upload', sublabel: 'Drawing' },
  { icon: Eye, label: 'Vision', sublabel: 'Analysis' },
  { icon: PenTool, label: 'Story', sublabel: 'Script' },
  { icon: Image, label: 'Image', sublabel: 'Generation' },
  { icon: Volume2, label: 'Voice', sublabel: 'Narration' },
  { icon: Video, label: 'Video', sublabel: 'Assembly' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section-padding bg-surface">
      <div className="section-container">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">
          From crayon drawing to animated storybook in minutes
        </p>

        {/* Desktop: Horizontal pipeline */}
        <div className="hidden md:flex items-center justify-center gap-2">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-2 transition-all hover:bg-primary/20 hover:scale-110">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <span className="text-sm font-semibold">{step.label}</span>
                <span className="text-xs text-text-muted">{step.sublabel}</span>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="w-6 h-6 text-text-muted mx-4" />
              )}
            </div>
          ))}
        </div>

        {/* Mobile: Vertical pipeline */}
        <div className="md:hidden space-y-4">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <step.icon className="w-7 h-7 text-primary" />
              </div>
              <div>
                <span className="font-semibold">{step.label}</span>
                <span className="text-text-muted ml-2">{step.sublabel}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="absolute left-7 mt-16 w-0.5 h-4 bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
