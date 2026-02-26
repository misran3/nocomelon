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
