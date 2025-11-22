import React, { useState } from 'react';
import { ModernNivoSlider } from './components/ModernNivoSlider';
import { SlideData, NivoEffectType } from './types';
import { Layout, Zap, Layers, MonitorSmartphone } from 'lucide-react';

// Sample Data
const SLIDES: SlideData[] = [
  {
    id: '1',
    src: 'https://picsum.photos/1920/1080?random=10',
    captionTitle: 'Classic Slice Effects',
    captionText: 'Recreating the iconic slice down, fold, and rain effects with pure React & Tailwind.',
    buttonText: 'Learn More',
    buttonLink: '#'
  },
  {
    id: '2',
    src: 'https://picsum.photos/1920/1080?random=20',
    captionTitle: 'Modern Typography',
    captionText: 'Fully accessible text layers that scale logically on mobile devices without breaking layout.',
    buttonText: 'Get Started',
    buttonLink: '#'
  },
  {
    id: '3',
    src: 'https://picsum.photos/1920/1080?random=30',
    captionTitle: 'Box Rain Grow',
    captionText: 'Complex grid transitions powered by calculated inline styles for maximum performance.',
  },
  {
    id: '4',
    src: 'https://picsum.photos/1920/1080?random=40',
    captionTitle: 'Responsive Design',
    captionText: 'Maintains a minimum height on mobile to ensure content is always readable.',
    buttonText: 'View Code',
    buttonLink: '#'
  }
];

const EFFECTS: NivoEffectType[] = [
  'random', 'sliceDown', 'sliceDownRight', 'sliceUpDown', 'sliceUpDownLeft', 'fold', 'fade', 'boxRain', 'boxRainGrow', 'zoomOut', 'slideLeft'
];

const App: React.FC = () => {
  const [currentEffect, setCurrentEffect] = useState<NivoEffectType>('random');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 py-6">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
                React Nivo Slider
              </h1>
              <p className="text-slate-400 mt-1">
                A modern redux of the jQuery classic with React 18 & Tailwind.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition">
                Documentation
              </a>
              <span className="text-slate-600">|</span>
              <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-5xl mt-8 md:mt-12 space-y-12">
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-800/50 p-4 rounded-lg border border-slate-700 gap-4">
           <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-400" />
              <span className="font-medium text-sm">Transition Effect:</span>
           </div>
           <div className="flex flex-wrap gap-2">
              {EFFECTS.map(eff => (
                <button
                  key={eff}
                  onClick={() => setCurrentEffect(eff)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 border ${
                    currentEffect === eff 
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.3)]' 
                      : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  {eff}
                </button>
              ))}
           </div>
        </div>

        {/* The Slider */}
        <section className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/50 border-4 border-slate-800 bg-slate-900">
          <ModernNivoSlider 
            slides={SLIDES} 
            effect={currentEffect}
            slices={15}
            boxCols={8}
            boxRows={4}
            pauseTime={5000}
            animSpeed={500}
          />
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/50 hover:border-teal-500/30 transition duration-300">
            <Zap className="w-8 h-8 text-yellow-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Performance First</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Uses native CSS transitions injected dynamically via React state. No heavy animation libraries required, keeping the bundle size minimal.
            </p>
          </div>
          <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/50 hover:border-teal-500/30 transition duration-300">
             <Layout className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Classic & Modern</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Supports the iconic "Slice" and "Box Rain" effects from 2011, plus modern "Zoom" and "Parallax" transitions for 2024.
            </p>
          </div>
          <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/50 hover:border-teal-500/30 transition duration-300">
            <MonitorSmartphone className="w-8 h-8 text-teal-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Fully Responsive</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Unlike the original, this slider scales logically. It maintains a minimum height so content isn't squashed on mobile devices.
            </p>
          </div>
        </section>

      </main>
    </div>
  );
};

export default App;