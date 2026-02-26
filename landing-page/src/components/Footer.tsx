import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="py-12 bg-surface border-t border-border">
      <div className="section-container text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-bold">NoComelon</span>
        </div>

        <p className="text-text-muted text-sm mb-2">
          Built for the Columbia AI for Good Hackathon 2026
        </p>
        <p className="text-text-muted text-sm mb-4">
          Made with{' '}
          <a
            href="https://claude.com/product/claude-code"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Claude Code
          </a>
        </p>

        <p className="text-text-muted text-xs">
          &copy; {new Date().getFullYear()} NoComelon. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
