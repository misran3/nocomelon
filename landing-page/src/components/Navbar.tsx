import { Sparkles, Github } from 'lucide-react';

const navLinks = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#why', label: 'Why' },
  { href: '#demo', label: 'Demo' },
  { href: '#tech', label: 'Tech' },
  { href: '#features', label: 'Features' },
  { href: '#team', label: 'Team' },
];

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span>NoComelon</span>
          </a>

          {/* Nav Links - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-text-muted hover:text-text transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* GitHub Button */}
          <a
            href="https://github.com/your-repo" // TODO: Replace with actual repo
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary text-sm py-2 px-4"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
