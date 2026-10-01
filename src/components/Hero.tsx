import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const heroVideoSrc = new URL('../../video/call-of-duty-black-ops-6-moewalls-com-optimized.mp4', import.meta.url).href;

export default function Hero() {
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setShouldPlayVideo(!motionPreference.matches);

    updateMotionPreference();
    motionPreference.addEventListener('change', updateMotionPreference);

    return () => motionPreference.removeEventListener('change', updateMotionPreference);
  }, []);

  useEffect(() => {
    const updateNetworkStatus = () => setIsOnline(navigator.onLine);

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  return (
    <section id="inicio" aria-labelledby="hero-title" className="hero-section relative isolate flex min-h-[78svh] items-center overflow-hidden border-b border-outline-variant px-6 py-16 md:min-h-[calc(100svh-5rem)] md:px-16">
      {shouldPlayVideo && (
        <video aria-hidden="true" className="absolute inset-0 z-0 h-full w-full object-cover" autoPlay muted loop playsInline preload="none" tabIndex={-1}>
          <source src={heroVideoSrc} type="video/mp4" />
        </video>
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10"
        style={{
          backgroundImage: 'linear-gradient(90deg, rgba(10, 13, 11, 0.84) 0%, rgba(10, 13, 11, 0.64) 48%, rgba(10, 13, 11, 0.28) 100%), linear-gradient(0deg, #121414 0%, rgba(18, 20, 20, 0.12) 48%, rgba(10, 13, 11, 0.28) 100%)',
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 opacity-30 grid-bg" />
      <div aria-hidden="true" className="hero-frame pointer-events-none absolute inset-4 z-10 md:inset-7" />
      <div aria-hidden="true" className="hero-sweep pointer-events-none absolute inset-y-10 left-0 right-0 z-10 overflow-hidden" />
      <div role="status" aria-live="polite" aria-atomic="true" className="absolute right-8 top-8 z-20 inline-flex items-center gap-2 border border-outline-variant/80 bg-surface/75 px-3 py-2 backdrop-blur-sm md:right-16 md:top-10">
        <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.75)]' : 'bg-red-400'}`} />
        <span className={`font-mono text-[9px] font-bold uppercase tracking-widest sm:text-[10px] ${isOnline ? 'text-emerald-100' : 'text-red-200'}`}>
          {isOnline ? 'RED CONECTADA' : 'SIN CONEXIÓN'}
        </span>
      </div>

      <div className="relative z-20 mx-auto flex w-full max-w-7xl items-center">
        <div className="flex max-w-4xl flex-col items-start">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-7 inline-flex items-center gap-3 border-l-2 border-primary-container bg-surface/50 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-primary-container backdrop-blur-sm"
          >
            <span className="hero-status-dot h-2 w-2 rounded-full bg-emerald-300" />
            COLECTIVO AIRSOFT · EST. 2019
          </motion.div>

          <motion.h1
            id="hero-title"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="max-w-4xl font-tactical text-6xl font-extrabold uppercase leading-[0.92] text-primary sm:text-7xl md:text-8xl"
          >
            Forjados en el combate.<br className="hidden sm:block" /> <span className="text-primary-container">Unidos por la legión.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="mt-6 max-w-xl border-l border-emerald-300/60 pl-4 font-body text-base leading-relaxed text-on-surface sm:text-lg"
          >
            Estrategia, juego limpio y compañerismo. Somos Legion-IX: un equipo para disfrutar cada partida juntos.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
          >
            <a href="#calendar" className="group inline-flex min-h-12 items-center justify-center gap-3 bg-primary-container px-6 font-mono text-xs font-bold uppercase tracking-widest text-on-primary transition-colors hover:bg-primary sm:min-w-56">
              Ver próximos eventos
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a href="#intel" className="inline-flex min-h-12 items-center justify-center gap-3 border border-primary/50 bg-surface/35 px-6 font-mono text-xs font-bold uppercase tracking-widest text-primary backdrop-blur-sm transition-colors hover:border-emerald-300 hover:text-emerald-200 sm:min-w-48">
              Conoce al equipo
            </a>
          </motion.div>
        </div>

      </div>

    </section>
  );
}
