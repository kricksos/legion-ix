import { lazy, Suspense, useState, useEffect } from 'react';
import { CalendarDays, Crosshair, MapPin, UserRoundCheck, UsersRound } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const AuthDialog = lazy(() => import('./AuthDialog'));

interface Event {
  id?: string;
  title: string;
  date: string;
  location: string;
}

const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTFxE7K4-jMr4vtMO3oQzwQBlGRVGKi5mxenzqhhomYP-4K0kqWBDo9r2a-y3wQEtirY7qFq4PPvbeB/pub?output=csv';

export default function Calendar() {
  const { user, memberStatus } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [registrationIds, setRegistrationIds] = useState<string[]>([]);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [registrationErrorEventId, setRegistrationErrorEventId] = useState<string | null>(null);
  const [participantsByEvent, setParticipantsByEvent] = useState<Record<string, string[]>>({});
  const [participantsOpenEventId, setParticipantsOpenEventId] = useState<string | null>(null);
  const [participantsLoadingEventId, setParticipantsLoadingEventId] = useState<string | null>(null);
  const [participantsError, setParticipantsError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchEvents() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data, error: queryError } = await supabase
            .from('events')
            .select('id,title,starts_at,location_name,status')
            .eq('status', 'published')
            .order('starts_at', { ascending: true, nullsFirst: false });

          if (queryError) throw queryError;
          const publishedEvents = (data ?? []).map((event) => ({
            id: event.id,
            title: event.title,
            date: event.starts_at
              ? new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' }).format(new Date(event.starts_at))
              : '',
            location: event.location_name,
          }));

          if (active) {
            setEvents(publishedEvents);
            setError(false);
          }
          return;
        }

        const response = await fetch(sheetUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const csvText = await response.text();

        const lines = csvText.split(/\r?\n/);
        const parsedEvents: Event[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          let columns: string[] = [];
          let current = '';
          let inQuotes = false;

          for (let char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              columns.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          columns.push(current.trim());

          if (columns.length >= 3) {
              parsedEvents.push({
                id: `sheet-${i}`,
              title: columns[0].replace(/^"|"$/g, ''),
              date: columns[1].replace(/^"|"$/g, ''),
              location: columns[2].replace(/^"|"$/g, '')
            });
          }
        }

        if (active) {
          setEvents(parsedEvents);
          setError(false);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchEvents();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!supabase || !user) {
      setRegistrationIds([]);
      return;
    }

    let active = true;
    void supabase
      .from('event_registrations')
      .select('event_id')
      .eq('user_id', user.id)
      .eq('status', 'registered')
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) {
          console.error('No se pudieron cargar las inscripciones:', queryError);
          setRegistrationIds([]);
          return;
        }
        setRegistrationIds((data ?? []).map((registration) => registration.event_id));
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;
    const eventIds = events.flatMap((event) => event.id && !event.id.startsWith('sheet-') ? [event.id] : []);
    if (eventIds.length === 0) return;

    let active = true;
    void Promise.all(eventIds.map(async (eventId) => {
      const { data, error: countError } = await supabase.rpc('get_event_registration_count', { p_event_id: eventId });
      if (countError) throw countError;
      return [eventId, Number(data ?? 0)] as const;
    })).then((results) => {
      if (active) setRegistrationCounts(Object.fromEntries(results));
    }).catch((countError: unknown) => {
      console.error('No se pudieron cargar los contadores de inscripción:', countError);
    });

    return () => {
      active = false;
    };
  }, [events]);

  useEffect(() => {
    setParticipantsOpenEventId(null);
    setParticipantsByEvent({});
    setParticipantsError('');
  }, [user?.id]);

  const refreshRegistrationCount = async (eventId: string) => {
    if (!supabase) return;
    const { data, error: countError } = await supabase.rpc('get_event_registration_count', { p_event_id: eventId });
    if (countError) {
      console.error('No se pudo actualizar el contador de inscritos:', countError);
      return;
    }
    setRegistrationCounts((current) => ({ ...current, [eventId]: Number(data ?? 0) }));
  };

  const handleToggleParticipants = async (event: Event) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (memberStatus !== 'approved') {
      setParticipantsOpenEventId(event.id ?? null);
      setParticipantsError('Solo los miembros aprobados pueden consultar la lista de asistentes.');
      return;
    }
    if (!supabase || !event.id) return;
    if (participantsOpenEventId === event.id) {
      setParticipantsOpenEventId(null);
      return;
    }

    setParticipantsOpenEventId(event.id);
    setParticipantsError('');
    if (participantsByEvent[event.id]) return;

    setParticipantsLoadingEventId(event.id);
    try {
      const { data, error: participantsQueryError } = await supabase.rpc('get_event_participants', { p_event_id: event.id });
      if (participantsQueryError) throw participantsQueryError;
      setParticipantsByEvent((current) => ({
        ...current,
        [event.id!]: (data ?? []).map((participant) => participant.display_name),
      }));
    } catch (participantsQueryError) {
      setParticipantsError(participantsQueryError instanceof Error ? participantsQueryError.message : 'No se pudo cargar la lista.');
    } finally {
      setParticipantsLoadingEventId(null);
    }
  };

  const handleRegistration = async (event: Event) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (memberStatus !== 'approved') {
      setRegistrationError('Tu alta debe ser aprobada por la administración antes de apuntarte.');
      setRegistrationErrorEventId(event.id ?? null);
      return;
    }
    if (!supabase || !event.id) return;

    setPendingEventId(event.id);
    setRegistrationMessage('');
    setRegistrationError('');
    setRegistrationErrorEventId(null);

    try {
      if (registrationIds.includes(event.id)) {
        const { error: cancelError } = await supabase.rpc('cancel_my_event_registration', { p_event_id: event.id });
        if (cancelError) throw cancelError;
        setRegistrationIds((current) => current.filter((id) => id !== event.id));
        setRegistrationMessage('Inscripción cancelada.');
        void refreshRegistrationCount(event.id);
      } else {
        const { error: registerError } = await supabase.rpc('register_for_event', { p_event_id: event.id });
        if (registerError) throw registerError;
        setRegistrationIds((current) => current.includes(event.id!) ? current : [...current, event.id!]);
        setRegistrationMessage(`Inscripción confirmada para ${event.title}.`);
        void refreshRegistrationCount(event.id);
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : '';
      setRegistrationError(message.includes('event_full') ? 'La operación ha alcanzado su aforo.' : message.includes('member_approval_required') ? 'Tu alta debe ser aprobada por la administración antes de apuntarte.' : 'No se pudo actualizar la inscripción. Inténtalo de nuevo.');
      setRegistrationErrorEventId(event.id);
    } finally {
      setPendingEventId(null);
    }
  };

  return (
    <>
    <section className="relative overflow-hidden border-b border-outline-variant bg-surface-container-low px-6 py-20 md:px-16 md:py-24" id="calendar">
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 opacity-[0.08] grid-bg lg:block" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-10 md:gap-12">
        <div className="flex flex-col justify-between gap-8 border-b border-outline-variant/70 pb-8 md:flex-row md:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary-container">
              <Crosshair className="h-4 w-4" />
              <span>03 / SALA DE OPERACIONES / REGISTRO</span>
            </div>
            <h2 className="font-tactical text-5xl font-extrabold uppercase leading-none text-primary sm:text-6xl md:text-7xl">
              Órdenes de <span className="text-primary-container">despliegue</span>
            </h2>
            <p className="mt-4 max-w-xl font-body text-sm leading-relaxed text-on-surface-variant sm:text-base">
              Agenda de operaciones y puntos de encuentro de Legion-IX.
            </p>
          </div>
          <div className="flex w-fit items-center gap-4 border-l-2 border-primary-container bg-surface-container px-5 py-3">
            <span className="font-tactical text-4xl font-bold leading-none text-primary-container">
              {loading ? '--' : String(events.length).padStart(2, '0')}
            </span>
            <span className="font-mono text-[10px] font-bold uppercase leading-relaxed tracking-widest text-on-surface-variant">
              Registros<br />en agenda
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {loading ? (
            <div role="status" className="border border-outline-variant bg-surface-container px-6 py-10 font-mono text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Sincronizando registro de operaciones...
            </div>
          ) : error ? (
            <div role="status" className="border border-red-400/40 bg-surface-container px-6 py-10">
              <span className="font-mono text-sm font-bold uppercase tracking-widest text-red-200">No se pudo cargar la agenda</span>
              <p className="mt-2 font-body text-sm text-on-surface-variant">Comprueba la conexión e inténtalo de nuevo más tarde.</p>
            </div>
          ) : events.length === 0 ? (
            <div className="border border-dashed border-primary-container/40 bg-surface-container px-6 py-10">
              <span className="font-mono text-sm font-bold uppercase tracking-widest text-primary-container">Sin operaciones registradas</span>
              <p className="mt-2 font-body text-sm text-on-surface-variant">Las nuevas fechas aparecerán aquí cuando estén disponibles.</p>
            </div>
          ) : (
            events.map((ev, i) => (
              <motion.article
                key={`${ev.title}-${i}`}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group relative overflow-hidden border border-outline-variant/80 bg-surface-container transition-colors duration-300 hover:border-primary-container/70 hover:bg-surface-container-high"
              >
                <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-primary-container/50 transition-colors group-hover:bg-primary-container" />
                <div className={`grid gap-6 p-5 sm:p-7 md:items-center md:gap-8 ${isSupabaseConfigured ? 'md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)_minmax(10rem,auto)]' : 'md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]'}`}>
                  <div className="flex min-w-0 items-center gap-5 sm:gap-7">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-on-surface-variant sm:text-[10px]">
                        <span className="inline-flex items-center gap-1.5 text-primary-container">
                          <Crosshair className="h-3.5 w-3.5" />
                          Registro de operación
                        </span>
                        <span aria-hidden="true" className="text-outline-variant">/</span>
                        <span>{ev.date ? 'Fecha registrada' : 'Fecha pendiente'}</span>
                      </div>
                      <h3 className="break-words font-tactical text-3xl font-bold uppercase leading-tight text-primary sm:text-4xl">
                        {ev.title}
                      </h3>
                    </div>
                  </div>

                  <dl className="grid gap-4 border-t border-outline-variant/70 pt-4 sm:grid-cols-2 md:border-l md:border-t-0 md:pl-7 md:pt-0">
                    <div className="min-w-0">
                      <dt className="mb-1 inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        <CalendarDays className="h-3.5 w-3.5 text-primary-container" />
                        Fecha
                      </dt>
                      <dd className="break-words font-body text-sm font-semibold text-primary">{ev.date || 'Pendiente'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="mb-1 inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        <MapPin className="h-3.5 w-3.5 text-primary-container" />
                        Zona de operaciones
                      </dt>
                      <dd className="break-words font-body text-sm font-semibold text-primary">{ev.location || 'Pendiente'}</dd>
                    </div>
                  </dl>
                  {isSupabaseConfigured && (
                    <div className="flex flex-col gap-2 border-t border-outline-variant/70 pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                          {registrationCounts[ev.id ?? ''] ?? '--'} inscritos
                        </span>
                        <button
                          type="button"
                          aria-expanded={participantsOpenEventId === ev.id}
                          aria-controls={`participants-${ev.id ?? 'unknown'}`}
                          onClick={() => void handleToggleParticipants(ev)}
                          disabled={Boolean(user && memberStatus !== 'approved')}
                          title={user && memberStatus !== 'approved' ? 'Solo para miembros aprobados' : undefined}
                          className="inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest text-primary-container underline decoration-primary-container/40 underline-offset-4 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <UsersRound className="h-3.5 w-3.5" />
                          {participantsOpenEventId === ev.id ? 'Ocultar lista' : 'Ver asistentes'}
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={pendingEventId === ev.id || Boolean(user && memberStatus !== 'approved')}
                        onClick={() => void handleRegistration(ev)}
                        className={`inline-flex min-h-11 items-center justify-center gap-2 px-4 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors disabled:cursor-wait disabled:opacity-60 ${registrationIds.includes(ev.id ?? '') ? 'border border-primary-container text-primary-container hover:bg-primary-container hover:text-on-primary' : 'bg-primary-container text-on-primary hover:bg-primary'}`}
                      >
                        {pendingEventId === ev.id ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <UserRoundCheck className="h-4 w-4" />}
                        {!user ? 'Acceder para apuntarme' : memberStatus === 'pending' ? 'Pendiente de aprobación' : memberStatus === 'rejected' ? 'Alta no aprobada' : memberStatus !== 'approved' ? 'Estado no disponible' : registrationIds.includes(ev.id ?? '') ? 'Cancelar plaza' : 'Apuntarme'}
                      </button>
                      {registrationError && registrationErrorEventId === ev.id && <p role="alert" className="font-mono text-[9px] uppercase leading-relaxed text-red-200">{registrationError}</p>}
                    </div>
                  )}
                </div>
                {isSupabaseConfigured && participantsOpenEventId === ev.id && (
                  <div id={`participants-${ev.id ?? 'unknown'}`} className="border-t border-outline-variant/70 px-5 py-4 sm:px-7">
                    <span className="mb-3 block font-mono text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Personal inscrito · solo nombres</span>
                    {participantsLoadingEventId === ev.id ? (
                      <span role="status" className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant">Cargando lista...</span>
                    ) : participantsError ? (
                      <span role="alert" className="font-mono text-[9px] uppercase tracking-widest text-red-200">{participantsError}</span>
                    ) : (participantsByEvent[ev.id ?? ''] ?? []).length > 0 ? (
                      <ul className="flex flex-wrap gap-2">
                        {(participantsByEvent[ev.id ?? ''] ?? []).map((name, participantIndex) => (
                          <li key={`${ev.id}-${participantIndex}`} className="border border-outline-variant px-3 py-1.5 font-body text-xs text-on-surface">{name}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant">Aún no hay asistentes inscritos.</span>
                    )}
                  </div>
                )}
              </motion.article>
            ))
          )}
        </div>
      </div>
    </section>
      {authOpen && (
        <Suspense fallback={null}>
          <AuthDialog open onClose={() => setAuthOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
