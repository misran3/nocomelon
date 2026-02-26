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
