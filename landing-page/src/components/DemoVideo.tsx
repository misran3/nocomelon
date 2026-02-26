export default function DemoVideo() {
  // TODO: Replace with actual YouTube video ID
  const videoId = 'dQw4w9WgXcQ';

  return (
    <section id="demo" className="section-padding bg-surface">
      <div className="section-container">
        <h2 className="section-title">See It In Action</h2>
        <p className="section-subtitle">
          Watch a complete walkthrough from drawing to storybook
        </p>

        <div className="max-w-4xl mx-auto">
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-border">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="NoComelon Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
