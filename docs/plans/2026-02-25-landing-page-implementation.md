# NoComelon Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a static landing page for NoComelon showcasing the product at Columbia AI for Good Hackathon, hosted on GitHub Pages.

**Architecture:** Single-page React app with Tailwind CSS. All content is static. Smooth-scroll navigation between sections. YouTube embed for demo video. Placeholder slots for user-provided assets (architecture diagram, team photos).

**Tech Stack:** React, Vite, TypeScript, Tailwind CSS, Lucide React (icons), pnpm

---

## Task 1: Initialize Project

**Files:**
- Create: `landing-page/package.json`
- Create: `landing-page/vite.config.ts`
- Create: `landing-page/tsconfig.json`
- Create: `landing-page/tailwind.config.js`
- Create: `landing-page/postcss.config.cjs`
- Create: `landing-page/index.html`

**Step 1: Create directory and initialize with pnpm**

```bash
mkdir -p landing-page
cd landing-page
pnpm init
```

**Step 2: Install dependencies**

```bash
cd landing-page && pnpm add react react-dom lucide-react && pnpm add -D vite @vitejs/plugin-react typescript @types/react @types/react-dom tailwindcss postcss autoprefixer
```

**Step 3: Create vite.config.ts**

```typescript
// landing-page/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/columbia-hackathon/', // GitHub Pages base path - adjust as needed
});
```

**Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

**Step 5: Initialize Tailwind**

```bash
cd landing-page && npx tailwindcss init -p
```

**Step 6: Configure tailwind.config.js**

```javascript
// landing-page/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B6B',
          hover: '#FF5252',
        },
        secondary: '#4ECDC4',
        accent: '#FFE66D',
        background: '#FAFAFA',
        surface: '#FFFFFF',
        text: {
          DEFAULT: '#2D3748',
          muted: '#718096',
        },
        border: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

**Step 7: Create postcss.config.cjs**

```javascript
// landing-page/postcss.config.cjs
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Step 8: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NoComelon - AI-Powered Storytelling for Kids</title>
    <meta name="description" content="Turn your child's drawings into safe, personalized animated storybooks." />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 9: Update package.json scripts**

Update `landing-page/package.json` to include:
```json
{
  "name": "nocomelon-landing",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

**Step 10: Commit**

```bash
git add landing-page/
git commit -m "feat(landing): initialize Vite + React + Tailwind project"
```

---

## Task 2: Create Base Styles and Entry Point

**Files:**
- Create: `landing-page/src/index.css`
- Create: `landing-page/src/main.tsx`
- Create: `landing-page/src/App.tsx`
- Create: `landing-page/public/favicon.svg`

**Step 1: Create index.css with Tailwind directives and custom styles**

```css
/* landing-page/src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
  }

  body {
    @apply bg-background text-text font-sans antialiased;
  }
}

@layer components {
  .section-container {
    @apply max-w-6xl mx-auto px-4 sm:px-6 lg:px-8;
  }

  .section-padding {
    @apply py-16 md:py-24;
  }

  .section-title {
    @apply text-3xl md:text-4xl font-bold text-center mb-4;
  }

  .section-subtitle {
    @apply text-lg text-text-muted text-center max-w-2xl mx-auto mb-12;
  }

  .card {
    @apply bg-surface rounded-xl border border-border p-6 transition-all duration-200;
  }

  .card:hover {
    @apply -translate-y-1 shadow-lg border-primary;
  }

  .btn {
    @apply inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200;
  }

  .btn-primary {
    @apply bg-primary text-white hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-lg;
  }

  .btn-secondary {
    @apply bg-surface text-text border border-border hover:border-primary;
  }
}

/* Gradient text utility */
.gradient-text {
  @apply bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent;
}

/* Animated background blobs */
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.animate-float {
  animation: float 20s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float 25s ease-in-out infinite reverse;
}
```

**Step 2: Create main.tsx**

```tsx
// landing-page/src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Step 3: Create App.tsx placeholder**

```tsx
// landing-page/src/App.tsx
export default function App() {
  return (
    <div className="min-h-screen">
      <h1 className="text-4xl font-bold text-center py-20">NoComelon Landing Page</h1>
    </div>
  );
}
```

**Step 4: Create favicon.svg**

```svg
<!-- landing-page/public/favicon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  <path d="M5 3v4"/>
  <path d="M19 17v4"/>
  <path d="M3 5h4"/>
  <path d="M17 19h4"/>
</svg>
```

**Step 5: Verify dev server runs**

```bash
cd landing-page && pnpm dev
```
Expected: Dev server starts, page shows "NoComelon Landing Page"

**Step 6: Commit**

```bash
git add landing-page/src/ landing-page/public/
git commit -m "feat(landing): add base styles and entry point"
```

---

## Task 3: Create Navbar Component

**Files:**
- Create: `landing-page/src/components/Navbar.tsx`

**Step 1: Create Navbar.tsx**

```tsx
// landing-page/src/components/Navbar.tsx
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
```

**Step 2: Add Navbar to App.tsx**

```tsx
// landing-page/src/App.tsx
import Navbar from './components/Navbar';

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <h1 className="text-4xl font-bold text-center py-20">Content goes here</h1>
      </main>
    </div>
  );
}
```

**Step 3: Verify navbar renders**

```bash
cd landing-page && pnpm dev
```
Expected: Fixed navbar with logo, links, and GitHub button

**Step 4: Commit**

```bash
git add landing-page/src/components/Navbar.tsx landing-page/src/App.tsx
git commit -m "feat(landing): add navbar component"
```

---

## Task 4: Create Hero Component

**Files:**
- Create: `landing-page/src/components/Hero.tsx`

**Step 1: Create Hero.tsx**

```tsx
// landing-page/src/components/Hero.tsx
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
```

**Step 2: Add Hero to App.tsx**

```tsx
// landing-page/src/App.tsx
import Navbar from './components/Navbar';
import Hero from './components/Hero';

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
      </main>
    </div>
  );
}
```

**Step 3: Verify hero renders**

```bash
cd landing-page && pnpm dev
```
Expected: Full-screen hero with animated blobs, badge, headline, and CTAs

**Step 4: Commit**

```bash
git add landing-page/src/components/Hero.tsx landing-page/src/App.tsx
git commit -m "feat(landing): add hero section with animated background"
```

---

## Task 5: Create HowItWorks Component

**Files:**
- Create: `landing-page/src/components/HowItWorks.tsx`

**Step 1: Create HowItWorks.tsx**

```tsx
// landing-page/src/components/HowItWorks.tsx
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
```

**Step 2: Add to App.tsx**

```tsx
// landing-page/src/App.tsx
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
      </main>
    </div>
  );
}
```

**Step 3: Verify renders**

```bash
cd landing-page && pnpm dev
```
Expected: 6-step pipeline with icons and arrows

**Step 4: Commit**

```bash
git add landing-page/src/components/HowItWorks.tsx landing-page/src/App.tsx
git commit -m "feat(landing): add how it works pipeline section"
```

---

## Task 6: Create WhyNoComelon Component

**Files:**
- Create: `landing-page/src/components/WhyNoComelon.tsx`

**Step 1: Create WhyNoComelon.tsx**

```tsx
// landing-page/src/components/WhyNoComelon.tsx
import { AlertCircle, Users, Sparkles } from 'lucide-react';

const cards = [
  {
    icon: AlertCircle,
    title: 'The Problem',
    description:
      'Algorithm-driven platforms prioritize engagement over learning. Kids consume content designed to capture attention, not nurture development.',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  {
    icon: Users,
    title: 'Who We Help',
    description:
      'Parents aged 25-45 with children aged 2-9 who want quality screen time, not just less screen time. They want to be creative directors, not just content blockers.',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
  {
    icon: Sparkles,
    title: 'Our Solution',
    description:
      "Turn your child's drawings into safe, educational animated storybooks. You control the style, theme, and message. AI handles the production.",
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
];

export default function WhyNoComelon() {
  return (
    <section id="why" className="section-padding">
      <div className="section-container">
        <h2 className="section-title">Why NoComelon?</h2>
        <p className="section-subtitle">
          We believe parents should create what their kids watch, not algorithms
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.title} className="card">
              <div className={`w-12 h-12 ${card.bg} rounded-lg flex items-center justify-center mb-4`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-2">{card.title}</h3>
              <p className="text-text-muted">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Add to App.tsx**

```tsx
// landing-page/src/App.tsx
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import WhyNoComelon from './components/WhyNoComelon';

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <WhyNoComelon />
      </main>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add landing-page/src/components/WhyNoComelon.tsx landing-page/src/App.tsx
git commit -m "feat(landing): add why nocomelon section"
```

---

## Task 7: Create DemoVideo Component

**Files:**
- Create: `landing-page/src/components/DemoVideo.tsx`

**Step 1: Create DemoVideo.tsx**

```tsx
// landing-page/src/components/DemoVideo.tsx
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
```

**Step 2: Add to App.tsx**

```tsx
// landing-page/src/App.tsx
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import WhyNoComelon from './components/WhyNoComelon';
import DemoVideo from './components/DemoVideo';

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <WhyNoComelon />
        <DemoVideo />
      </main>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add landing-page/src/components/DemoVideo.tsx landing-page/src/App.tsx
git commit -m "feat(landing): add demo video section with YouTube embed"
```

---

## Task 8: Create TechStack Component

**Files:**
- Create: `landing-page/src/components/TechStack.tsx`
- Create: `landing-page/public/architecture-placeholder.png`

**Step 1: Create TechStack.tsx**

```tsx
// landing-page/src/components/TechStack.tsx
const techStack = [
  'React',
  'Tailwind CSS',
  'Claude AI',
  'DALL-E 3',
  'ElevenLabs',
  'FFmpeg',
  'Convex',
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
                className="px-4 py-2 bg-surface rounded-full border border-border text-sm font-medium hover:border-primary transition-colors"
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
```

**Step 2: Add to App.tsx**

```tsx
// landing-page/src/App.tsx
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import WhyNoComelon from './components/WhyNoComelon';
import DemoVideo from './components/DemoVideo';
import TechStack from './components/TechStack';

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <WhyNoComelon />
        <DemoVideo />
        <TechStack />
      </main>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add landing-page/src/components/TechStack.tsx landing-page/src/App.tsx
git commit -m "feat(landing): add tech stack section with architecture placeholder"
```

---

## Task 9: Create Features Component

**Files:**
- Create: `landing-page/src/components/Features.tsx`

**Step 1: Create Features.tsx**

```tsx
// landing-page/src/components/Features.tsx
import { Shield, Palette, Baby, FileText, Volume2, BookOpen } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Safe by Design',
    description: '4 layers of content protection. Parent review at every step. Nothing reaches your child without your approval.',
  },
  {
    icon: Palette,
    title: 'Multiple Art Styles',
    description: 'Storybook or Watercolor — your choice. Each style transforms your child\'s idea into polished cartoon frames.',
  },
  {
    icon: Baby,
    title: 'Age-Adaptive',
    description: 'Content auto-adjusts for ages 2-9. Vocabulary, pacing, and story complexity scale with your child.',
  },
  {
    icon: FileText,
    title: 'Script Review',
    description: 'See every word before generation. Edit lines, regenerate, or approve. Full transparency, full control.',
  },
  {
    icon: Volume2,
    title: 'Pro Voice Narration',
    description: 'ElevenLabs character voices bring stories to life. Gentle for bedtime, cheerful for adventures.',
  },
  {
    icon: BookOpen,
    title: 'Personal Library',
    description: 'A growing collection of stories made just for your child. Share with family via a simple link.',
  },
];

export default function Features() {
  return (
    <section id="features" className="section-padding bg-surface">
      <div className="section-container">
        <h2 className="section-title">Key Features</h2>
        <p className="section-subtitle">
          Everything parents need to create magical, safe content
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="card">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-text-muted text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Add to App.tsx**

```tsx
// landing-page/src/App.tsx
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import WhyNoComelon from './components/WhyNoComelon';
import DemoVideo from './components/DemoVideo';
import TechStack from './components/TechStack';
import Features from './components/Features';

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <WhyNoComelon />
        <DemoVideo />
        <TechStack />
        <Features />
      </main>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add landing-page/src/components/Features.tsx landing-page/src/App.tsx
git commit -m "feat(landing): add features grid section"
```

---

## Task 10: Create WhatsNext Component

**Files:**
- Create: `landing-page/src/components/WhatsNext.tsx`

**Step 1: Create WhatsNext.tsx**

```tsx
// landing-page/src/components/WhatsNext.tsx
import { Mic, Globe, Film, Users } from 'lucide-react';

const roadmap = [
  {
    icon: Mic,
    title: 'Voice Cloning',
    description: 'Stories narrated in Mom or Dad\'s voice using ElevenLabs voice cloning.',
  },
  {
    icon: Globe,
    title: 'Multi-Language',
    description: 'Generate storybooks in different languages for bilingual families.',
  },
  {
    icon: Film,
    title: 'Full Cartoons',
    description: 'Upgrade from animated storybooks to short cartoon clips with character animation.',
  },
  {
    icon: Users,
    title: 'Parent Community',
    description: 'A shared space where parents browse and react to each other\'s kids\' storybooks.',
  },
];

export default function WhatsNext() {
  return (
    <section className="section-padding">
      <div className="section-container">
        <h2 className="section-title">What's Next?</h2>
        <p className="section-subtitle">
          Features we're excited to build after the hackathon
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roadmap.map((item) => (
            <div key={item.title} className="card opacity-80 hover:opacity-100">
              <div className="w-12 h-12 bg-text-muted/10 rounded-lg flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-text-muted" />
              </div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-text-muted text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Add to App.tsx**

```tsx
// landing-page/src/App.tsx
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import WhyNoComelon from './components/WhyNoComelon';
import DemoVideo from './components/DemoVideo';
import TechStack from './components/TechStack';
import Features from './components/Features';
import WhatsNext from './components/WhatsNext';

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <WhyNoComelon />
        <DemoVideo />
        <TechStack />
        <Features />
        <WhatsNext />
      </main>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add landing-page/src/components/WhatsNext.tsx landing-page/src/App.tsx
git commit -m "feat(landing): add whats next roadmap section"
```

---

## Task 11: Create Team Component

**Files:**
- Create: `landing-page/src/components/Team.tsx`

**Step 1: Create Team.tsx**

```tsx
// landing-page/src/components/Team.tsx
import { Linkedin } from 'lucide-react';

// TODO: Replace with actual team data
const team = [
  {
    name: 'Team Member 1',
    university: 'Columbia University',
    photo: '/team-1.jpg', // Replace with actual photo
    linkedin: 'https://linkedin.com/in/member1',
  },
  {
    name: 'Team Member 2',
    university: 'Columbia University',
    photo: '/team-2.jpg', // Replace with actual photo
    linkedin: 'https://linkedin.com/in/member2',
  },
];

export default function Team() {
  return (
    <section id="team" className="section-padding bg-surface">
      <div className="section-container">
        <h2 className="section-title">Meet The Team</h2>
        <p className="section-subtitle">
          Built with passion at the Columbia AI for Good Hackathon
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-8">
          {team.map((member) => (
            <div key={member.name} className="flex flex-col items-center">
              {/* Photo */}
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 mb-4">
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=FF6B6B&color=fff&size=128`;
                  }}
                />
              </div>

              {/* Name */}
              <h3 className="text-lg font-bold">{member.name}</h3>

              {/* University */}
              <p className="text-text-muted text-sm mb-3">{member.university}</p>

              {/* LinkedIn */}
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Add to App.tsx**

```tsx
// landing-page/src/App.tsx
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import WhyNoComelon from './components/WhyNoComelon';
import DemoVideo from './components/DemoVideo';
import TechStack from './components/TechStack';
import Features from './components/Features';
import WhatsNext from './components/WhatsNext';
import Team from './components/Team';

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <WhyNoComelon />
        <DemoVideo />
        <TechStack />
        <Features />
        <WhatsNext />
        <Team />
      </main>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add landing-page/src/components/Team.tsx landing-page/src/App.tsx
git commit -m "feat(landing): add team section with placeholders"
```

---

## Task 12: Create CTA and Footer Components

**Files:**
- Create: `landing-page/src/components/CTA.tsx`
- Create: `landing-page/src/components/Footer.tsx`

**Step 1: Create CTA.tsx**

```tsx
// landing-page/src/components/CTA.tsx
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
```

**Step 2: Create Footer.tsx**

```tsx
// landing-page/src/components/Footer.tsx
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
            href="https://claude.ai/code"
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
```

**Step 3: Add to App.tsx (final version)**

```tsx
// landing-page/src/App.tsx
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import WhyNoComelon from './components/WhyNoComelon';
import DemoVideo from './components/DemoVideo';
import TechStack from './components/TechStack';
import Features from './components/Features';
import WhatsNext from './components/WhatsNext';
import Team from './components/Team';
import CTA from './components/CTA';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <WhyNoComelon />
        <DemoVideo />
        <TechStack />
        <Features />
        <WhatsNext />
        <Team />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add landing-page/src/components/CTA.tsx landing-page/src/components/Footer.tsx landing-page/src/App.tsx
git commit -m "feat(landing): add CTA and footer sections"
```

---

## Task 13: Build and Test

**Step 1: Run build**

```bash
cd landing-page && pnpm build
```
Expected: Successful build with output in `dist/`

**Step 2: Preview build**

```bash
cd landing-page && pnpm preview
```
Expected: Production build serves correctly

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(landing): complete landing page implementation"
```

---

## Placeholders to Replace

After implementation, update these placeholders:

| File | Placeholder | Replace With |
|------|-------------|--------------|
| `Navbar.tsx` | `https://github.com/your-repo` | Actual GitHub repo URL |
| `DemoVideo.tsx` | `dQw4w9WgXcQ` | Actual YouTube video ID |
| `TechStack.tsx` | `/architecture-placeholder.png` | Your architecture diagram |
| `Team.tsx` | `Team Member 1/2` | Actual names |
| `Team.tsx` | `/team-1.jpg`, `/team-2.jpg` | Actual photos |
| `Team.tsx` | LinkedIn URLs | Actual LinkedIn profiles |
| `CTA.tsx` | `https://your-app-url.com` | Actual app URL |
| `vite.config.ts` | `base: '/columbia-hackathon/'` | Correct GitHub Pages path |
