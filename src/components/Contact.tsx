import { useState, useEffect, type FormEvent } from 'react';
import { ArrowRight, Mail, Radio, Send } from 'lucide-react';
import { motion } from 'motion/react';

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [contactEmail, setContactEmail] = useState('jsfarma@gmail.com');

  useEffect(() => {
    async function fetchEmail() {
      try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQ9NwZ3Q9PrxoT6jeH96bIMbp0nIPYO1vXlWK8kFEhVF25Lx356cU5zE3ORfRocadvjqycOrFZqvK1l/pub?output=csv');
        if (response.ok) {
          const text = await response.text();
          const email = text.split(/\r?\n/)[0]?.trim();
          if (email && email.includes('@')) {
            setContactEmail(email);
          }
        }
      } catch (err) {
        console.error('Error fetching contact email:', err);
      }
    }
    fetchEmail();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(false);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbyPp4KLTi5N1Gp19z5L1Ex6aYNwxwOGkC6wLAxAsvxFZoR_LzdQswesK_OVrBLM6bjHYA/exec', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSuccess(true);
        form.reset();
      } else {
        console.error('Error enviando la transmisión');
        setError(true);
      }
    } catch (error) {
      console.error('Error de red:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="relative overflow-hidden border-b border-outline-variant bg-surface-container-low px-6 py-20 md:px-16 md:py-24" id="contact">
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 opacity-[0.08] grid-bg lg:block" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-10 md:gap-12">
        <header className="border-b border-outline-variant/70 pb-7">
          <div className="mb-4 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary-container">
            <Radio className="h-4 w-4" />
            <span>04 / Canal de contacto / abierto</span>
          </div>
          <h2 className="font-tactical text-5xl font-extrabold uppercase leading-none text-primary sm:text-6xl md:text-7xl">
            Inicia la <span className="text-primary-container">transmisión</span>
          </h2>
        </header>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(24rem,1.15fr)] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-start gap-6"
          >
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary-container">Incorporación</span>
              <h3 className="mt-2 max-w-xl font-tactical text-4xl font-bold uppercase leading-tight text-primary sm:text-5xl">
                Únete a <span className="text-primary-container">Legion-IX</span>
              </h3>
            </div>
            <p className="max-w-xl font-body text-base leading-relaxed text-on-surface-variant sm:text-lg">
              ¿Quieres unirte a nuestras filas o coordinar una operación conjunta? Envía tu transmisión. Responderemos a la brevedad.
            </p>
            <div className="mt-2 border-l-2 border-primary-container pl-4">
              <span className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Correo de contacto</span>
              <a href={`mailto:${contactEmail}`} className="break-all font-tactical text-2xl font-semibold text-primary transition-colors hover:text-primary-container sm:text-3xl">
                {contactEmail}
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="border border-outline-variant/80 bg-surface-container p-5 sm:p-8"
          >
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-outline-variant/70 pb-4">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">Formulario de contacto</span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-primary-container">Transmisión segura</span>
            </div>
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Nombre</label>
                <input type="text" id="name" name="nombre" autoComplete="name" required className="min-h-12 w-full border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary-container focus-visible:ring-1 focus-visible:ring-primary-container" placeholder="Tu nombre" />
              </div>
              <div>
                <label htmlFor="email" className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Email</label>
                <input type="email" id="email" name="email" autoComplete="email" required className="min-h-12 w-full border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary-container focus-visible:ring-1 focus-visible:ring-primary-container" placeholder="tu@email.com" />
              </div>
              <div>
                <label htmlFor="message" className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Mensaje</label>
                <textarea id="message" name="mensaje" required rows={4} className="w-full resize-y border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary-container focus-visible:ring-1 focus-visible:ring-primary-container" placeholder="Escribe tu mensaje" />
              </div>
              <button type="submit" disabled={loading} className="group inline-flex min-h-12 w-full items-center justify-center gap-3 bg-primary-container px-5 font-mono text-xs font-bold uppercase tracking-widest text-on-primary transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />
                    Transmitiendo...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar transmisión
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
              {success && (
                <div role="status" className="border border-primary-container/60 bg-primary-container/10 px-4 py-3 font-mono text-xs font-bold uppercase leading-relaxed tracking-widest text-primary-container">
                  Transmisión recibida. Nos pondremos en contacto.
                </div>
              )}
              {error && (
                <div role="alert" className="border border-red-400/50 bg-red-950/25 px-4 py-3 font-mono text-xs font-bold uppercase leading-relaxed tracking-widest text-red-200">
                  No se pudo enviar la transmisión. Inténtalo de nuevo o escríbenos directamente.
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
