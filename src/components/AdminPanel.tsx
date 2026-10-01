import { useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, Check, ImagePlus, LoaderCircle, ShieldCheck, Upload, UsersRound, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type PanelTab = 'events' | 'albums' | 'members';
type EventStatus = 'draft' | 'published' | 'cancelled';
const eventTitlePrefix = 'Operación - ';

interface EventRow {
  id: string;
  title: string;
  starts_at: string | null;
  location_name: string;
  status: EventStatus;
}

interface AlbumRow {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  event_id: string | null;
}

interface MemberRequest {
  user_id: string;
  display_name: string;
  email: string;
  created_at: string;
  email_confirmed: boolean;
  is_admin?: boolean;
}

function makeSlug(value: string) {
  const slug = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug || 'operacion'}-${crypto.randomUUID().slice(0, 8)}`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo completar la operación.';
}

export default function AdminPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<PanelTab>('events');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [memberRequests, setMemberRequests] = useState<MemberRequest[]>([]);
  const [approvedMembers, setApprovedMembers] = useState<MemberRequest[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [eventTitle, setEventTitle] = useState(eventTitlePrefix);
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventCapacity, setEventCapacity] = useState('');
  const [eventStatus, setEventStatus] = useState<EventStatus>('published');
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumDate, setAlbumDate] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [albumEventId, setAlbumEventId] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);

  useEffect(() => {
    if (!open || !isAdmin || !supabase) return;

    let active = true;
    setLoading(true);
    setError('');

    async function loadRecords() {
      if (!supabase) return;
      const [eventResult, albumResult] = await Promise.all([
        supabase.from('events').select('id,title,starts_at,location_name,status').order('created_at', { ascending: false }),
        supabase.from('albums').select('id,title,status,created_at,event_id').order('created_at', { ascending: false }),
      ]);

      if (eventResult.error) throw eventResult.error;
      if (albumResult.error) throw albumResult.error;
      if (!active) return;
      setEvents((eventResult.data ?? []) as EventRow[]);
      setAlbums((albumResult.data ?? []) as AlbumRow[]);
    }

    void loadRecords().catch((loadError: unknown) => {
      if (active) setError(getErrorMessage(loadError));
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [open, isAdmin]);

  useEffect(() => {
    if (!open || !isAdmin || !supabase || tab !== 'members') return;

    let active = true;
    setMembersLoading(true);
    setError('');
    void (async () => {
      try {
        const [requestResult, memberResult] = await Promise.all([
          supabase.rpc('get_pending_member_requests'),
          supabase.rpc('get_approved_members'),
        ]);
        if (requestResult.error) throw requestResult.error;
        if (memberResult.error) throw memberResult.error;
        if (active) {
          setMemberRequests((requestResult.data ?? []) as MemberRequest[]);
          setApprovedMembers((memberResult.data ?? []) as MemberRequest[]);
        }
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError));
      } finally {
        if (active) setMembersLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [open, isAdmin, tab]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, submitting]);

  const handleApproveMember = async (userId: string) => {
    if (!supabase) return;
    setSubmitting(true);
    setNotice('');
    setError('');

    try {
      const { error: approvalError } = await supabase.rpc('approve_member_request', { p_user_id: userId });
      if (approvalError) throw approvalError;
      const approvedMember = memberRequests.find((request) => request.user_id === userId);
      if (approvedMember) setApprovedMembers((members) => [{ ...approvedMember, is_admin: false }, ...members]);
      setMemberRequests((current) => current.filter((request) => request.user_id !== userId));
      setNotice('Miembro aprobado. Ahora puedes asignarle el rol admin desde la lista de miembros.');
    } catch (approvalError) {
      const message = getErrorMessage(approvalError);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromoteMember = async (userId: string) => {
    if (!supabase) return;
    setSubmitting(true);
    setNotice('');
    setError('');

    try {
      const { error: promotionError } = await supabase.rpc('set_user_admin_role', { p_user_id: userId });
      if (promotionError) throw promotionError;
      setApprovedMembers((current) => current.map((member) => member.user_id === userId ? { ...member, is_admin: true } : member));
      setNotice('Rol admin asignado.');
    } catch (promotionError) {
      const message = getErrorMessage(promotionError);
      setError(message.includes('email_not_confirmed') ? 'Debe confirmar el correo antes de recibir el rol admin.' : message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateEvent = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    if (!supabase) return;
    setSubmitting(true);
    setNotice('');
    setError('');

    try {
      const { error: insertError } = await supabase.from('events').insert({
        title: eventTitle.trim(),
        slug: makeSlug(eventTitle),
        description: eventDescription.trim(),
        starts_at: eventDate ? new Date(eventDate).toISOString() : null,
        location_name: eventLocation.trim(),
        capacity: eventCapacity ? Number(eventCapacity) : null,
        status: eventStatus,
      });
      if (insertError) throw insertError;

      setEventTitle(eventTitlePrefix);
      setEventDate('');
      setEventLocation('');
      setEventDescription('');
      setEventCapacity('');
      setNotice('Operación guardada.');
      const { data, error: refreshError } = await supabase.from('events').select('id,title,starts_at,location_name,status').order('created_at', { ascending: false });
      if (refreshError) throw refreshError;
      setEvents((data ?? []) as EventRow[]);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAlbum = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    if (!supabase || photos.length === 0) return;
    setSubmitting(true);
    setNotice('');
    setError('');

    let albumId: string | null = null;
    const uploadedPaths: string[] = [];

    try {
      const { data: album, error: albumError } = await supabase
        .from('albums')
        .insert({
          title: albumTitle.trim(),
          slug: makeSlug(albumTitle),
          description: albumDescription.trim(),
          occurred_on: albumDate || null,
          event_id: albumEventId || null,
          status: 'draft',
        })
        .select('id')
        .single();

      if (albumError) throw albumError;
      albumId = album.id;

      for (const [sortOrder, photo] of photos.entries()) {
        const safeName = photo.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-');
        const storagePath = `${album.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('mission-photos').upload(storagePath, photo, {
          contentType: photo.type,
          upsert: false,
        });
        if (uploadError) throw uploadError;
        uploadedPaths.push(storagePath);
      }

      const { error: photoRowsError } = await supabase.from('album_photos').insert(
        uploadedPaths.map((storagePath, sortOrder) => ({ album_id: album.id, storage_path: storagePath, sort_order: sortOrder })),
      );
      if (photoRowsError) throw photoRowsError;

      const { error: publishError } = await supabase.from('albums').update({ status: 'published' }).eq('id', album.id);
      if (publishError) throw publishError;

      setAlbumTitle('');
      setAlbumDate('');
      setAlbumDescription('');
      setAlbumEventId('');
      setPhotos([]);
      setNotice('Expediente publicado con sus fotografías.');
      const { data, error: refreshError } = await supabase.from('albums').select('id,title,status,created_at,event_id').order('created_at', { ascending: false });
      if (refreshError) throw refreshError;
      setAlbums((data ?? []) as AlbumRow[]);
    } catch (submitError) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from('mission-photos').remove(uploadedPaths);
      }
      if (albumId) {
        await supabase.from('albums').delete().eq('id', albumId);
      }
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-panel-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-6"
    >
      <div className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden border border-outline-variant bg-surface shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant/80 px-5 py-5 sm:px-8">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary-container">
              <ShieldCheck className="h-4 w-4" />
              Administración / Legion-IX
            </div>
            <h2 id="admin-panel-title" className="font-tactical text-3xl font-bold uppercase text-primary sm:text-4xl">Panel de control</h2>
          </div>
          <button type="button" aria-label="Cerrar panel admin" onClick={onClose} disabled={submitting} className="flex h-10 w-10 shrink-0 items-center justify-center border border-outline-variant text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container disabled:opacity-50">
            <X className="h-4 w-4" />
          </button>
        </header>

        {!isAdmin ? (
          <p role="alert" className="m-6 border border-red-400/50 p-4 font-mono text-xs font-bold uppercase tracking-widest text-red-200">Esta cuenta no tiene permisos de administrador.</p>
        ) : !supabase ? (
          <p role="alert" className="m-6 border border-outline-variant p-4 font-body text-sm text-on-surface-variant">Falta configurar Supabase en `.env.local`.</p>
        ) : (
          <>
            <div className="flex border-b border-outline-variant/70 px-5 sm:px-8">
              <button type="button" onClick={() => { setTab('events'); setNotice(''); setError(''); }} className={`border-b-2 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${tab === 'events' ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant hover:text-primary'}`}>
                Eventos
              </button>
              <button type="button" onClick={() => { setTab('albums'); setNotice(''); setError(''); }} className={`border-b-2 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${tab === 'albums' ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant hover:text-primary'}`}>
                Álbumes
              </button>
              <button type="button" onClick={() => { setTab('members'); setNotice(''); setError(''); }} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${tab === 'members' ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant hover:text-primary'}`}>
                <UsersRound className="h-3.5 w-3.5" />
                Miembros
              </button>
            </div>

            {tab === 'members' ? (
              <section className="min-h-0 overflow-y-auto p-5 sm:p-8">
                <div className="mb-6 max-w-3xl border-l-2 border-primary-container pl-4">
                  <h3 className="font-tactical text-2xl font-bold uppercase text-primary">Solicitudes de alta</h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-on-surface-variant">Primero aprueba el alta como miembro. Después, desde la lista de miembros aprobados, podrás asignar el rol admin como una decisión independiente.</p>
                </div>
                {error && <p role="alert" className="mb-4 border border-red-400/50 bg-red-950/25 p-3 font-mono text-[10px] font-bold uppercase text-red-200">{error}</p>}
                {notice && <p role="status" className="mb-4 border border-emerald-300/40 bg-emerald-950/20 p-3 font-mono text-[10px] font-bold uppercase text-emerald-100">{notice}</p>}
                {membersLoading ? (
                  <div role="status" className="flex items-center gap-3 border border-outline-variant bg-surface-container-low p-5 font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Consultando solicitudes...
                  </div>
                ) : memberRequests.length === 0 ? (
                  <p className="border border-dashed border-outline-variant p-5 font-body text-sm text-on-surface-variant">No hay solicitudes pendientes.</p>
                ) : (
                  <div className="flex flex-col divide-y divide-outline-variant/70 border-y border-outline-variant/70">
                    {memberRequests.map((request) => (
                      <article key={request.user_id} className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                        <div className="min-w-0">
                          <h4 className="break-words font-tactical text-2xl font-bold uppercase text-primary">{request.display_name || 'Nuevo miembro'}</h4>
                          <p className="mt-1 break-all font-body text-sm text-on-surface-variant">{request.email}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                            <span>Alta: {new Date(request.created_at).toLocaleDateString('es-ES')}</span>
                            <span className={request.email_confirmed ? 'text-emerald-200' : 'text-amber-200'}>{request.email_confirmed ? 'Correo confirmado' : 'Correo pendiente'}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" disabled={submitting} onClick={() => void handleApproveMember(request.user_id)} className="inline-flex min-h-10 items-center justify-center gap-2 border border-primary-container px-3 font-mono text-[9px] font-bold uppercase tracking-widest text-primary-container transition-colors hover:bg-primary-container hover:text-on-primary disabled:opacity-50">
                            <Check className="h-3.5 w-3.5" />
                            Aprobar miembro
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                <div className="mt-10 border-t border-outline-variant/70 pt-6">
                  <h3 className="font-tactical text-2xl font-bold uppercase text-primary">Miembros aprobados</h3>
                  <p className="mt-2 font-body text-sm text-on-surface-variant">El rol admin se asigna aquí, después de aprobar la pertenencia.</p>
                  <div className="mt-4 flex flex-col divide-y divide-outline-variant/70 border-y border-outline-variant/70">
                    {approvedMembers.map((member) => (
                      <article key={member.user_id} className="grid gap-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                        <div className="min-w-0">
                          <h4 className="break-words font-tactical text-xl font-bold uppercase text-primary">{member.display_name || 'Miembro'}</h4>
                          <p className="mt-1 break-all font-body text-sm text-on-surface-variant">{member.email}</p>
                          <span className={member.email_confirmed ? 'mt-2 inline-block font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-200' : 'mt-2 inline-block font-mono text-[9px] font-bold uppercase tracking-widest text-amber-200'}>{member.email_confirmed ? 'Correo confirmado' : 'Correo pendiente'}</span>
                        </div>
                        {member.is_admin ? (
                          <span className="inline-flex items-center gap-2 border border-primary-container/60 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-primary-container"><ShieldCheck className="h-3.5 w-3.5" />Admin</span>
                        ) : (
                          <button type="button" disabled={submitting || !member.email_confirmed} title={!member.email_confirmed ? 'El correo debe estar confirmado' : undefined} onClick={() => void handlePromoteMember(member.user_id)} className="inline-flex min-h-10 items-center justify-center gap-2 bg-primary-container px-3 font-mono text-[9px] font-bold uppercase tracking-widest text-on-primary transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-40"><ShieldCheck className="h-3.5 w-3.5" />Asignar rol admin</button>
                        )}
                      </article>
                    ))}
                    {!membersLoading && approvedMembers.length === 0 && <p className="py-4 font-body text-sm text-on-surface-variant">Todavía no hay miembros aprobados.</p>}
                  </div>
                </div>
              </section>
            ) : (
            <div className="grid min-h-0 overflow-y-auto lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
              <div className="p-5 sm:p-8">
                {tab === 'events' ? (
                  <form className="flex flex-col gap-4" onSubmit={handleCreateEvent}>
                    <h3 className="font-tactical text-2xl font-bold uppercase text-primary">Nueva operación</h3>
                    <div>
                      <label htmlFor="admin-event-title" className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Nombre</label>
                      <input id="admin-event-title" required value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} className="min-h-11 w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary-container" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="admin-event-date" className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Fecha y hora</label>
                        <input id="admin-event-date" type="datetime-local" value={eventDate} onChange={(event) => setEventDate(event.target.value)} className="min-h-11 w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary-container" />
                      </div>
                      <div>
                        <label htmlFor="admin-event-capacity" className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Plazas (opcional)</label>
                        <input id="admin-event-capacity" type="number" min="1" value={eventCapacity} onChange={(event) => setEventCapacity(event.target.value)} className="min-h-11 w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary-container" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="admin-event-location" className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Ubicación</label>
                      <input id="admin-event-location" required value={eventLocation} onChange={(event) => setEventLocation(event.target.value)} className="min-h-11 w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary-container" />
                    </div>
                    <div>
                      <label htmlFor="admin-event-description" className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Briefing</label>
                      <textarea id="admin-event-description" rows={3} value={eventDescription} onChange={(event) => setEventDescription(event.target.value)} className="w-full resize-y border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary-container" />
                    </div>
                    <div>
                      <label htmlFor="admin-event-status" className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Publicación</label>
                      <select id="admin-event-status" value={eventStatus} onChange={(event) => setEventStatus(event.target.value as EventStatus)} className="min-h-11 w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary-container">
                        <option value="draft">Borrador</option>
                        <option value="published">Publicar ahora</option>
                      </select>
                    </div>
                    <button type="submit" disabled={submitting} className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 bg-primary-container px-4 font-mono text-xs font-bold uppercase tracking-widest text-on-primary disabled:opacity-50">
                      {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                      Guardar operación
                    </button>
                  </form>
                ) : (
                  <form className="flex flex-col gap-4" onSubmit={handleCreateAlbum}>
                    <h3 className="font-tactical text-2xl font-bold uppercase text-primary">Nuevo expediente</h3>
                    <div>
                      <label htmlFor="admin-album-title" className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Operación</label>
                      <input id="admin-album-title" required value={albumTitle} onChange={(event) => setAlbumTitle(event.target.value)} className="min-h-11 w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary-container" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="admin-album-date" className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Fecha</label>
                        <input id="admin-album-date" type="date" value={albumDate} onChange={(event) => setAlbumDate(event.target.value)} className="min-h-11 w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary-container" />
                      </div>
                      <div>
                        <label htmlFor="admin-album-event" className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Evento relacionado</label>
                        <select id="admin-album-event" value={albumEventId} onChange={(event) => setAlbumEventId(event.target.value)} className="min-h-11 w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary-container">
                          <option value="">Sin vincular</option>
                          {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="admin-album-description" className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Nota de archivo</label>
                      <textarea id="admin-album-description" rows={2} value={albumDescription} onChange={(event) => setAlbumDescription(event.target.value)} className="w-full resize-y border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary-container" />
                    </div>
                    <div>
                      <label htmlFor="admin-album-photos" className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Fotografías</label>
                      <input id="admin-album-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple required onChange={(event) => setPhotos(Array.from(event.target.files ?? []))} className="min-h-11 w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-xs text-on-surface file:mr-3 file:border-0 file:bg-surface-container file:px-3 file:py-1 file:font-mono file:text-[9px] file:font-bold file:uppercase file:text-primary-container" />
                      {photos.length > 0 && <p className="mt-2 font-mono text-[9px] uppercase tracking-widest text-on-surface-variant">{photos.length} archivos seleccionados</p>}
                    </div>
                    <button type="submit" disabled={submitting || photos.length === 0} className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 bg-primary-container px-4 font-mono text-xs font-bold uppercase tracking-widest text-on-primary disabled:opacity-50">
                      {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Subir y publicar expediente
                    </button>
                  </form>
                )}
              </div>

              <aside className="border-t border-outline-variant/80 bg-surface-container-low p-5 sm:p-8 lg:border-l lg:border-t-0">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">{tab === 'events' ? 'Eventos registrados' : 'Expedientes registrados'}</h3>
                  {loading && <LoaderCircle className="h-4 w-4 animate-spin text-primary-container" />}
                </div>
                {error && <p role="alert" className="mb-4 border border-red-400/50 bg-red-950/25 p-3 font-mono text-[10px] font-bold uppercase text-red-200">{error}</p>}
                {notice && <p role="status" className="mb-4 border border-emerald-300/40 bg-emerald-950/20 p-3 font-mono text-[10px] font-bold uppercase text-emerald-100">{notice}</p>}
                <div className="flex flex-col divide-y divide-outline-variant/70">
                  {tab === 'events' ? events.map((event) => (
                    <div key={event.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <span className="block break-words font-tactical text-xl font-bold uppercase text-primary">{event.title}</span>
                        <span className="mt-1 block font-mono text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">{event.location_name || 'Ubicación pendiente'}</span>
                      </div>
                      <span className={`shrink-0 border px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-widest ${event.status === 'published' ? 'border-emerald-300/40 text-emerald-200' : event.status === 'cancelled' ? 'border-red-300/40 text-red-200' : 'border-outline-variant text-on-surface-variant'}`}>
                        {event.status === 'published' ? 'Publicado' : event.status === 'cancelled' ? 'Cancelado' : 'Borrador'}
                      </span>
                    </div>
                  )) : albums.map((album) => (
                    <div key={album.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <span className="block break-words font-tactical text-xl font-bold uppercase text-primary">{album.title}</span>
                        <span className="mt-1 block font-mono text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">{new Date(album.created_at).toLocaleDateString('es-ES')}</span>
                      </div>
                      <span className={`shrink-0 border px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-widest ${album.status === 'published' ? 'border-emerald-300/40 text-emerald-200' : 'border-outline-variant text-on-surface-variant'}`}>
                        {album.status === 'published' ? 'Publicado' : album.status === 'archived' ? 'Archivado' : 'Borrador'}
                      </span>
                    </div>
                  ))}
                  {!loading && (tab === 'events' ? events.length === 0 : albums.length === 0) && (
                    <p className="py-5 font-body text-sm text-on-surface-variant">Todavía no hay registros.</p>
                  )}
                </div>
              </aside>
            </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}