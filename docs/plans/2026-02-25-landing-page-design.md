# NoComelon Landing Page Design

> **Date**: 2026-02-25
> **Status**: Approved
> **Purpose**: Static landing page for GitHub Pages showcasing NoComelon at Columbia AI for Good Hackathon
> **Tech Stack**: React + Vite + Tailwind CSS (pnpm)

---

## 1. Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | React + Vite | Consistency with main frontend |
| **Styling** | Tailwind CSS | Same as main app, share color palette |
| **Theme** | Light, playful | Matches children's app brand |
| **Hosting** | GitHub Pages | Free, simple deployment |
| **Demo** | YouTube embed (placeholder) | Easy to update, no hosting needed |
| **Architecture Diagram** | Image placeholder | User provides Lucidchart/draw.io export |

---

## 2. Color Palette (from main app)

```css
:root {
  --primary: #FF6B6B;           /* Coral - buttons, accents */
  --primary-hover: #FF5252;     /* Button hover */
  --secondary: #4ECDC4;         /* Teal - success, secondary actions */
  --accent: #FFE66D;            /* Sunny Yellow - highlights */
  --background: #FAFAFA;        /* Page background */
  --surface: #FFFFFF;           /* Cards, inputs */
  --text: #2D3748;              /* Body text */
  --text-muted: #718096;        /* Secondary text */
  --border: #E2E8F0;            /* Borders, dividers */
}
```

---

## 3. Section Structure

### Navigation (Fixed Top)
- **Left**: Lucide icon (Sparkles/Palette) + "NoComelon" text
- **Center-Right**: Smooth-scroll links: How It Works | Why | Demo | Tech | Features | Team
- **Far Right**: "View GitHub" button (coral primary)
- **Behavior**: Glassmorphism on scroll, sticky positioning

### Section 1: Hero
- **Badge**: "AI-Powered Storytelling" with pulsing dot
- **Headline**:
  - "Their Imagination."
  - "Your Values." (gradient accent: coral -> teal)
  - "Real Cartoons."
- **Subtext**: "Turn your child's drawings into safe, personalized animated storybooks - narrated, styled, and themed according to your choices."
- **CTAs**:
  - Primary: "See How It Works" (scroll)
  - Secondary: "Watch Demo" (scroll)
- **Background**: Playful gradient blobs (coral + teal + yellow, subtle)

### Section 2: How It Works
- **Title**: "How It Works"
- **Visual**: 6-step horizontal pipeline with icons and connecting arrows
  1. Upload Drawing (Camera icon)
  2. Vision Analysis (Eye icon)
  3. Story Script (Pen icon)
  4. Image Generation (Image icon)
  5. Voice Narration (Volume icon)
  6. Video Assembly (Video icon)
- **Animation**: Steps light up sequentially on scroll
- **Mobile**: Vertical stack with vertical connectors

### Section 3: Why NoComelon
- **Title**: "Why NoComelon?"
- **Layout**: 3 cards
  - **The Problem**: Algorithm-driven platforms prioritize engagement over learning
  - **Who We Help**: Parents (25-45) with children aged 2-9 who want quality screen time
  - **Our Solution**: Turn drawings into safe, educational animated storybooks
- **Note**: Generalized framing, no direct competitor mentions

### Section 4: Demo Video
- **Title**: "See It In Action"
- **Subtext**: "Watch a complete walkthrough from drawing to storybook"
- **Content**: YouTube embed (placeholder URL)
- **Style**: Rounded corners, 16:9 aspect ratio, responsive

### Section 5: Architecture & Tech Stack
- **Title**: "Under The Hood"
- **Subtext**: "Our serverless AI pipeline, built for scale and safety"
- **Content**:
  - Architecture diagram placeholder (16:9 image slot)
  - Tech stack as simple text list: "Built With: React, Tailwind, Claude AI, DALL-E 3, ElevenLabs, FFmpeg, Convex, AWS"

### Section 6: Features
- **Title**: "Key Features"
- **Layout**: 3x2 grid of feature cards
  1. **Safe by Design**: 4 layers of content protection
  2. **Multiple Art Styles**: Storybook, Watercolor - your choice
  3. **Age-Adaptive**: Content auto-adjusts for ages 2-9
  4. **Script Review**: See every word before generation
  5. **Pro Voice Narration**: ElevenLabs character voices
  6. **Personal Library**: Growing collection of your stories

### Section 7: What's Next
- **Title**: "What's Next?"
- **Subtext**: "Features we're excited to build after the hackathon"
- **Layout**: 4 cards (slightly muted to indicate future)
  1. **Voice Cloning**: Stories in Mom or Dad's voice
  2. **Multi-Language**: Bilingual family support
  3. **Full Cartoons**: Animated scenes, not just storybooks
  4. **Parent Community**: Online sharing and discovery

### Section 8: Team
- **Title**: "Meet The Team"
- **Layout**: 2 cards side by side, centered
  - Each card: Circular headshot, Name, "Columbia University", LinkedIn link
- **Placeholders**: User will provide photos, names, LinkedIn URLs

### Section 9: CTA
- **Headline**: "Ready to create your first storybook?"
- **Subtext**: "Transform your child's imagination into something magical."
- **Button**: "Try It Now" -> links to actual app URL
- **Background**: Subtle coral->teal gradient

### Section 10: Footer
- **Content**:
  - "Built for the Columbia AI for Good Hackathon 2026"
  - "Made with Claude Code"
  - "2026 NoComelon. All rights reserved."
- **Style**: Simple, centered

---

## 4. Directory Structure

```
landing-page/
├── index.html
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.cjs
├── public/
│   ├── favicon.svg
│   └── architecture.png (placeholder)
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    └── components/
        ├── Navbar.tsx
        ├── Hero.tsx
        ├── HowItWorks.tsx
        ├── WhyNoComelon.tsx
        ├── DemoVideo.tsx
        ├── TechStack.tsx
        ├── Features.tsx
        ├── WhatsNext.tsx
        ├── Team.tsx
        ├── CTA.tsx
        └── Footer.tsx
```

---

## 5. Placeholders Required from User

| Item | Format | Notes |
|------|--------|-------|
| YouTube video URL | URL string | Placeholder: `https://www.youtube.com/embed/dQw4w9WgXcQ` |
| Architecture diagram | PNG/SVG image | Export from Lucidchart/draw.io |
| Team member 1 photo | Image URL | Can be local or hosted |
| Team member 1 name | String | |
| Team member 1 LinkedIn | URL | |
| Team member 2 photo | Image URL | |
| Team member 2 name | String | |
| Team member 2 LinkedIn | URL | |
| App URL | URL | For "Try It Now" CTA |
| GitHub repo URL | URL | For nav button |

---

## 6. Responsive Breakpoints

| Breakpoint | Layout Changes |
|------------|----------------|
| Desktop (>1024px) | Full layout, horizontal pipeline |
| Tablet (768-1024px) | Slightly compressed, 2-col grids |
| Mobile (<768px) | Stacked layouts, vertical pipeline, hamburger nav |

---

## 7. Animations

- **Hero**: Gradient blobs float subtly, staggered text fade-in
- **Pipeline**: Steps light up sequentially on scroll intersection
- **Cards**: Lift effect on hover
- **Scroll**: Smooth scroll to section on nav click

---

## 8. Out of Scope

- Backend/API integration
- Authentication
- Analytics (can add later)
- Contact form
- Blog/articles section
