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

        {/* Architecture Diagram */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="relative rounded-2xl overflow-hidden border border-border bg-surface">
            <img
              src={`${import.meta.env.BASE_URL}architecture.png`}
              alt="NoComelon Architecture Diagram"
              className="w-full h-auto"
            />
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
