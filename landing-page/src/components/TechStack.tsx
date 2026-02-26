const techStack = [
  'FastAPI',
  'Pydantic AI',
  'OpenAI',
  'DALL-E 3',
  'ElevenLabs',
  'FFmpeg',
  'React',
  'Tailwind CSS',
  'AWS',
];

export default function TechStack() {
  return (
    <section id="tech" className="section-padding">
      <div className="section-container">
        <h2 className="section-title">Under The Hood</h2>
        <p className="section-subtitle">
          Our serverless AI pipeline, built for scale and safety
        </p>

        {/* Architecture Diagram Placeholder */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-border bg-surface flex items-center justify-center">
            {/* Replace this with actual image when ready */}
            <img
              src="/architecture-placeholder.png"
              alt="NoComelon Architecture Diagram"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to placeholder text if image doesn't exist
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden flex-col items-center gap-4 text-text-muted">
              <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                  <path d="M3 9h18M9 21V9" strokeWidth="2"/>
                </svg>
              </div>
              <span className="text-lg font-semibold">Architecture Diagram</span>
              <span className="text-sm">Replace with your Lucidchart/draw.io export</span>
            </div>
          </div>
        </div>

        {/* Tech Stack List */}
        <div className="text-center">
          <p className="text-sm font-semibold text-text-muted mb-4">Built With</p>
          <div className="flex flex-wrap justify-center gap-3">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
