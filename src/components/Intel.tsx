import { ArrowRight, Eye, Shield, Target, Users, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { motion } from 'motion/react';

export default function Intel() {
  const niveles = [
    { level: 1, hours: 20, rank: <span className="font-bold text-xl leading-none text-primary-container">I</span> },
    { level: 2, hours: 40, rank: <span className="font-bold text-xl leading-none tracking-widest text-primary-container">II</span> },
    { level: 3, hours: 60, rank: <span className="font-bold text-xl leading-none tracking-widest text-primary-container">III</span> },
    { level: 4, hours: 80, rank: <div className="w-4 h-1 bg-primary-container"></div> },
    { level: 5, hours: 100, rank: <div className="flex flex-col gap-1"><div className="w-4 h-1 bg-primary-container"></div><div className="w-4 h-1 bg-primary-container"></div></div> },
    { level: 6, hours: 130, rank: <div className="flex flex-col gap-1"><div className="w-4 h-1 bg-primary-container"></div><div className="w-4 h-1 bg-primary-container"></div><div className="w-4 h-1 bg-primary-container"></div></div> },
    { level: 7, hours: 160, rank: <ChevronUp size={24} strokeWidth={4} className="text-primary-container" /> },
    { level: 8, hours: 200, rank: <div className="flex flex-col -space-y-3 text-primary-container"><ChevronUp size={24} strokeWidth={4} /><ChevronUp size={24} strokeWidth={4} /></div> },
    { level: 9, hours: 250, rank: <div className="flex flex-col -space-y-3 text-primary-container"><ChevronUp size={24} strokeWidth={4} /><ChevronUp size={24} strokeWidth={4} /><ChevronUp size={24} strokeWidth={4} /></div> },
    { level: 10, hours: 300, rank: <Star size={16} fill="currentColor" className="text-primary-container" /> },
    { level: 11, hours: 350, rank: <div className="flex gap-1 text-primary-container"><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /></div> },
    { level: 12, hours: 400, rank: <div className="flex flex-col items-center -space-y-1 text-primary-container"><Star size={14} fill="currentColor" /><div className="flex gap-1"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div></div> },
    { level: 13, hours: 500, rank: <div className="flex flex-col items-center -space-y-1 text-primary-container"><Star size={14} fill="currentColor" /><ChevronDown size={24} strokeWidth={4} /></div> },
    { level: 14, hours: 600, rank: <div className="flex flex-col items-center text-primary-container"><div className="flex flex-col items-center gap-0.5"><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /></div><ChevronDown size={24} strokeWidth={4} className="-mt-1" /></div> },
    { level: 15, hours: 800, rank: <div className="flex flex-col items-center text-primary-container"><div className="flex flex-col items-center gap-0.5"><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /></div><ChevronDown size={24} strokeWidth={4} className="-mt-1" /></div> },
  ];

  return (
    <section id="intel" className="relative overflow-hidden border-b border-outline-variant bg-surface px-6 py-20 md:px-16 md:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 opacity-[0.08] grid-bg lg:block" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-12 md:gap-16">
        <header className="grid gap-8 border-b border-outline-variant/70 pb-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary-container">
              <Eye className="h-4 w-4" />
              <span>01 / Archivo de unidad / Legion-IX</span>
            </div>
            <h2 className="font-tactical text-5xl font-extrabold uppercase leading-none text-primary sm:text-6xl md:text-7xl">
              Manual de <span className="text-primary-container">unidad</span>
            </h2>
          </div>
          <div className="flex gap-5 border-l-2 border-primary-container pl-4 font-mono text-[10px] font-bold uppercase leading-relaxed tracking-widest text-on-surface-variant">
            <span className="font-tactical text-4xl leading-none text-primary-container">IX</span>
            <span>Fundada en 2019<br />Compañerismo · Juego limpio</span>
          </div>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-6 lg:grid-cols-[minmax(14rem,0.75fr)_minmax(0,1.25fr)] lg:gap-14"
        >
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary-container">01 / Identidad</span>
            <h3 className="mt-3 border-l-2 border-primary-container pl-4 font-tactical text-4xl font-bold uppercase leading-none text-primary sm:text-5xl">¿Quiénes somos?</h3>
          </div>
          <div className="flex flex-col gap-4 font-body text-base leading-relaxed text-on-surface-variant sm:text-lg">
            <p>
              Fundados en 2019, nacimos con una filosofía muy clara: en nuestro equipo, <span className="font-semibold text-primary">nadie es más que nadie</span>. Somos un grupo abierto a todo el mundo, donde lo que realmente prima es el buen ambiente, el buen rollo y las ganas de disfrutar del airsoft en estado puro.
            </p>
            <p>
              No buscamos "lobos solitarios"; somos un equipo y, como tal, lo que pedimos es compromiso para jugar juntos, apoyarnos en el campo y disfrutar de cada partida como una piña.
            </p>
          </div>
        </motion.section>

        <div className="grid border-y border-outline-variant/70 md:grid-cols-2 md:divide-x md:divide-outline-variant/70">
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="py-7 md:pr-9 md:py-9"
          >
            <div className="mb-5 flex items-center gap-3">
              <Target className="h-5 w-5 text-primary-container" />
              <div>
                <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">02 / Propósito</span>
                <h3 className="font-tactical text-3xl font-bold uppercase text-primary">Objetivo</h3>
              </div>
            </div>
            <p className="max-w-xl border-l-2 border-primary-container pl-4 font-body text-base italic leading-relaxed text-on-surface-variant">
              "Practicar airsoft en equipo desde el compañerismo y el fairplay, divirtiéndonos, enriqueciéndonos y mejorando tanto como personas como equipo."
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border-t border-outline-variant/70 py-7 md:border-t-0 md:py-9 md:pl-9"
          >
            <div className="mb-5 flex items-center gap-3">
              <Eye className="h-5 w-5 text-primary-container" />
              <div>
                <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">03 / Dirección</span>
                <h3 className="font-tactical text-3xl font-bold uppercase text-primary">Misión / Visión</h3>
              </div>
            </div>
            <div className="flex flex-col gap-4 font-body text-sm leading-relaxed text-on-surface-variant sm:text-base">
              <p><span className="font-bold text-primary-container">Nuestra misión:</span> Practicar airsoft desde el trabajo en equipo, apostando siempre por la mejora, el aprendizaje continuo en cada entrenamiento y partida.</p>
              <p><span className="font-bold text-primary-container">Nuestra visión:</span> Llegar a ser un equipo reconocido y respetado por nuestro comportamiento, estilo de juego y honestidad tanto en el ámbito del airsoft como fuera de él.</p>
            </div>
          </motion.section>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-6 lg:grid-cols-[minmax(14rem,0.75fr)_minmax(0,1.25fr)] lg:gap-14"
        >
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary-container">04 / Código de campo</span>
            <h3 className="mt-3 flex items-center gap-3 border-l-2 border-primary-container pl-4 font-tactical text-4xl font-bold uppercase leading-none text-primary sm:text-5xl">
              <Shield className="h-7 w-7 shrink-0 text-primary-container" />
              Valores
            </h3>
            <p className="mt-4 font-body text-sm leading-relaxed text-on-surface-variant">El pegamento que nos mantiene unidos dentro y fuera del campo se resume en cuatro pilares innegociables:</p>
          </div>
          <ol className="grid gap-x-6 sm:grid-cols-2">
            <li className="border-t border-outline-variant/70 py-5">
              <div className="mb-2 flex items-baseline gap-3"><span className="font-mono text-[10px] font-bold text-primary-container">01</span><h4 className="font-tactical text-2xl font-bold uppercase text-primary">Seguridad</h4></div>
              <p className="font-body text-sm leading-relaxed text-on-surface-variant">Lo primero es lo primero. Siempre gafas.</p>
            </li>
            <li className="border-t border-outline-variant/70 py-5">
              <div className="mb-2 flex items-baseline gap-3"><span className="font-mono text-[10px] font-bold text-primary-container">02</span><h4 className="font-tactical text-2xl font-bold uppercase text-primary">Respeto</h4></div>
              <p className="font-body text-sm leading-relaxed text-on-surface-variant">Hacia los compañeros, los rivales, árbitros y organizadores.</p>
            </li>
            <li className="border-t border-outline-variant/70 py-5">
              <div className="mb-2 flex items-baseline gap-3"><span className="font-mono text-[10px] font-bold text-primary-container">03</span><h4 className="font-tactical text-2xl font-bold uppercase text-primary">Juego limpio</h4></div>
              <p className="font-body text-sm leading-relaxed text-on-surface-variant">El airsoft es un juego de honor. Cantar las bajas y ser honestos es nuestra mayor victoria.</p>
            </li>
            <li className="border-t border-outline-variant/70 py-5">
              <div className="mb-2 flex items-baseline gap-3"><span className="font-mono text-[10px] font-bold text-primary-container">04</span><h4 className="font-tactical text-2xl font-bold uppercase text-primary">Compañerismo</h4></div>
              <p className="font-body text-sm leading-relaxed text-on-surface-variant">Nadie se queda atrás. La fuerza del equipo está en cada uno de sus miembros.</p>
            </li>
          </ol>
        </motion.section>

        <motion.section
          id="niveles-internos"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border-y border-outline-variant/70 py-8 md:py-10"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(14rem,0.75fr)_minmax(0,1.25fr)] lg:gap-14">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary-container">05 / Progresión interna</span>
              <h3 className="mt-3 flex items-center gap-3 border-l-2 border-primary-container pl-4 font-tactical text-4xl font-bold uppercase leading-none text-primary sm:text-5xl">
                <Users className="h-7 w-7 shrink-0 text-primary-container" />
                Sistema de niveles
              </h3>
            </div>
            <div className="flex flex-col gap-5 font-body text-sm leading-relaxed text-on-surface-variant sm:text-base">
              <p>En Legion-IX contamos con un sistema de niveles internos, pero con una regla de oro: lo único que aportan los niveles son horas de juego y experiencia acumulada.</p>
              <p>Aquí los niveles NO dan privilegios. Un nivel más alto unicamente significa que llevas más batallas a la espalda, pero el respeto, las decisiones y el valor de cada miembro en el grupo es exactamente el mismo. La veterania es un grado.</p>
              <p>Los veteranos están para ayudar y al servicio de los nuevos reclutas que quieran incorporarse a nuestras filas, es aquí donde reside la verdadera esencia de la Legion-IX... <span className="font-bold uppercase tracking-widest text-primary">¡Fuerza y Honor!</span></p>
            </div>
          </div>

          <ol className="mt-8 grid grid-cols-3 gap-px border border-outline-variant/70 bg-outline-variant/70 sm:grid-cols-5 lg:grid-cols-8">
            {niveles.map((nivel) => (
              <li key={nivel.level} className="flex min-h-24 flex-col items-center justify-center gap-1 bg-surface px-2 py-3 transition-colors hover:bg-surface-container">
                <span className="flex h-8 items-center justify-center">{nivel.rank}</span>
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Nivel {nivel.level}</span>
                <span className="font-tactical text-lg font-bold leading-none text-primary">{nivel.hours}H</span>
              </li>
            ))}
          </ol>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col gap-6 border-l-2 border-primary-container py-2 pl-5 sm:pl-7 md:flex-row md:items-center md:justify-between md:gap-10"
        >
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary-container">06 / Incorporación</span>
            <h3 className="mt-2 font-tactical text-3xl font-bold uppercase text-primary sm:text-4xl">¿Quieres unirte a Legion-IX?</h3>
            <p className="mt-2 max-w-3xl font-body text-sm leading-relaxed text-on-surface-variant sm:text-base">
              Tanto si tienes experiencia como si eres nuevo en el airsoft. Si buscas un sitio donde jugar, divertirte en serio pero sin malos rollos, donde aprender táctica y, sobre todo, donde reírte y pasarlo bien... <span className="font-bold text-primary">este es tu equipo.</span>
            </p>
          </div>
          <a href="#contact" className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-3 self-start bg-primary-container px-5 font-mono text-xs font-bold uppercase tracking-widest text-on-primary transition-colors hover:bg-primary md:self-center">
            Iniciar reclutamiento
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
