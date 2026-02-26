import { ArrowRight } from 'lucide-react';
import { APP_URL } from '../constants';

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
{APP_URL ? (
          <a
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary text-lg px-8 py-4"
          >
            <span>Try It Now</span>
            <ArrowRight className="w-5 h-5" />
          </a>
        ) : (
          <span className="btn btn-primary text-lg px-8 py-4 opacity-75 cursor-default">
            Coming Soon
          </span>
        )}
      </div>
    </section>
  );
}
