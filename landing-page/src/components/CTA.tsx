import { ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10" />

      <div className="section-container relative text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to create your first storybook?
        </h2>
        <p className="text-lg text-text-muted max-w-xl mx-auto mb-8">
          Transform your child's imagination into something magical.
        </p>
        <a
          href="https://your-app-url.com" // TODO: Replace with actual app URL
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary text-lg px-8 py-4"
        >
          <span>Try It Now</span>
          <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    </section>
  );
}
