import { ArrowRight, Play } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="section-container text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-8">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-primary">AI-Powered Storytelling</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
          <span className="block">Their Imagination.</span>
          <span className="block gradient-text">Your Values.</span>
          <span className="block">Real Cartoons.</span>
        </h1>

        {/* Subtext */}
        <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-10">
          Turn your child's drawings into safe, personalized animated storybooks —
          narrated, styled, and themed according to your choices.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#how-it-works" className="btn btn-primary">
            <span>See How It Works</span>
            <ArrowRight className="w-5 h-5" />
          </a>
          <a href="#demo" className="btn btn-secondary">
            <Play className="w-5 h-5" />
            <span>Watch Demo</span>
          </a>
        </div>
      </div>
    </section>
  );
}
