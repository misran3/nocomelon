export default function DemoVideo() {
  const driveLink = 'https://drive.google.com/drive/folders/1-dawCZW2BCT55lppbCSSpmxek3hgNe6b?usp=drive_link';

  return (
    <section id="demo" className="section-padding bg-surface">
      <div className="section-container">
        <h2 className="section-title">See It In Action</h2>
        <p className="section-subtitle">
          Watch a complete walkthrough from drawing to storybook
        </p>

        <div className="max-w-4xl mx-auto">
          <a
            href={driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl shadow-2xl border border-border hover:bg-primary/90 transition-colors text-lg font-semibold"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2L4.5 12.5l2.5 4.5h10l2.5-4.5L12 2zm0 3.5l5 7.5H7l5-7.5zM4.5 14l-2 3.5L7 22l2-3.5-4.5-4.5zm15 0L15 18.5l2 3.5 4.5-4.5-2-3.5z" />
            </svg>
            View Demo Videos on Google Drive
          </a>
        </div>
      </div>
    </section>
  );
}
