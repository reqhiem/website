'use client';

import { motion } from 'framer-motion';
import { FileText, ArrowRight, Terminal } from 'lucide-react';
import dynamic from 'next/dynamic';
import HeroPortrait from './HeroPortrait';

const HeroBackground = dynamic(() => import('./HeroBackground'), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-transparent" /> 
});

interface HeroProps {
  person?: any;
  site?: any;
  insights?: any;
  lang?: "es" | "en";
}

export function Hero({ person, site, insights, lang }: HeroProps) {
  return (
    <section className="relative min-h-[90vh] w-full flex items-center overflow-hidden bg-transparent">
      <HeroBackground />
      
      {/* Background Grid - slightly more visible for "schematic" feel */}
      <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-[0.08] pointer-events-none bg-center mix-blend-multiply dark:mix-blend-overlay" />
      
      <div className="container-page relative z-10 w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center h-full pt-20 md:pt-0">
        
        {/* Left Column */}
        <div className="flex flex-col items-start gap-8 order-2 md:order-1">
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="h-[1px] w-12 bg-[color:var(--color-accent)]/50" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[color:var(--color-muted)]">
                System Architecture & AI
              </span>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.0] tracking-tight -ml-[2px]">
                Software <br/>
                Engineering <br/>
                <span className="text-[color:var(--color-muted)] font-light italic">+</span> <br/>
                <span className="text-[color:var(--color-accent)]">
                  Applied AI
                </span>
              </h1>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg md:text-xl text-[color:var(--color-muted)] max-w-lg leading-relaxed border-l-2 border-[color:var(--color-accent)]/20 pl-6"
            >
              I build scalable, real-world AI systems — merging clean engineering with cutting-edge research to bridge the gap between prototype and production.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap gap-4 pt-2"
          >
            <a 
              href="#projects" 
              className="group relative px-6 py-3 bg-[color:var(--color-ink)] text-[color:var(--color-paper)] font-medium text-sm tracking-wide uppercase rounded-sm hover:bg-[color:var(--color-accent)] transition-colors flex items-center gap-2"
            >
              <Terminal className="w-4 h-4" />
              Initialize Projects
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            
            <a 
              href="/resume.pdf" 
              className="px-6 py-3 bg-transparent border border-[color:var(--color-ink)]/20 text-[color:var(--color-ink)] font-medium text-sm tracking-wide uppercase rounded-sm hover:border-[color:var(--color-ink)] transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              System Log / Resume
            </a>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="relative h-[55vh] md:h-[72vh] flex items-end justify-center md:justify-end order-1 md:order-2 perspective-1000 overflow-hidden">
          <HeroPortrait />
        </div>
      </div>
    </section>
  );
}
