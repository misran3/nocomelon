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
