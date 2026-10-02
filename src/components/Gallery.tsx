import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, X } from 'lucide-react';
import { motion } from 'motion/react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AlbumDefinition {
  id: string;
  title: string;
  files: string[];
}

interface Album extends AlbumDefinition {
  photos: string[];
  cover: string;
}

interface StoredAlbum {
  id: string;
  title: string;
  album_photos: Array<{ storage_path: string; sort_order: number }> | null;
}

const albumDefinitions: AlbumDefinition[] = [
  {
    id: 'operacion_nocturna',
    title: 'Operación Nocturna',
    files: [
      'WhatsApp Image 2026-10-01 at 11.58.15.jpeg',
      'WhatsApp Image 2026-10-01 at 11.58.15 (1).jpeg',
      'WhatsApp Image 2026-10-01 at 11.58.15 (2).jpeg',
      'WhatsApp Image 2026-10-01 at 11.58.15 (3).jpeg',
      'WhatsApp Image 2026-10-01 at 11.58.15 (4).jpeg',
      'WhatsApp Image 2026-10-01 at 11.58.14.jpeg',
    ],
  },
  {
    id: 'operacion_mont_aventura',
    title: 'Operación Mont Aventura',
    files: [
      'WhatsApp Image 2026-10-01 at 11.58.53.jpeg',
      'WhatsApp Image 2026-10-01 at 11.58.53 (1).jpeg',
      'WhatsApp Image 2026-10-01 at 11.58.53 (2).jpeg',
      'WhatsApp Image 2026-10-01 at 11.58.53 (3).jpeg',
    ],
  },
  {
    id: 'operacion_chimera',
    title: 'Operación Chimera',
    files: [
      'WhatsApp Image 2026-09-29 at 09.17.23.jpeg',
      'WhatsApp Image 2026-09-29 at 09.17.22.jpeg',
      'WhatsApp Image 2026-09-29 at 09.17.22 (1).jpeg',
      'WhatsApp Image 2026-09-29 at 09.17.22 (2).jpeg',
      'WhatsApp Image 2026-09-29 at 09.17.22 (3).jpeg',
      'WhatsApp Image 2026-09-29 at 09.17.22 (4).jpeg',
    ],
  },
];

function getLocalAlbums(): Album[] {
  return albumDefinitions.map((album) => {
    const photos = album.files.map((file) => `/gallery/${album.id}/${encodeURIComponent(file)}`);
    const randomCover = Math.floor(Math.random() * photos.length);

    return { ...album, photos, cover: photos[randomCover] };
  });
}

export default function Gallery() {
  const [albums, setAlbums] = useState<Album[]>(getLocalAlbums);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [loadError, setLoadError] = useState(false);
  const [lightbox, setLightbox] = useState<{ albumIndex: number; photoIndex: number } | null>(null);
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [firstVisibleAlbum, setFirstVisibleAlbum] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const isLightboxOpen = lightbox !== null;
  const activeAlbum = lightbox ? albums[lightbox.albumIndex] : null;
  const activePhoto = activeAlbum && lightbox ? activeAlbum.photos[lightbox.photoIndex] : null;

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const updateCarouselState = () => {
      const firstCard = carousel.firstElementChild as HTMLElement | null;
      const gap = Number.parseFloat(getComputedStyle(carousel).columnGap) || 0;
      const step = (firstCard?.getBoundingClientRect().width ?? 0) + gap;
      setCanScrollPrevious(carousel.scrollLeft > 2);
      setCanScrollNext(carousel.scrollLeft + carousel.clientWidth < carousel.scrollWidth - 2);
      setFirstVisibleAlbum(step > 0 ? Math.round(carousel.scrollLeft / step) : 0);
    };

    updateCarouselState();
    carousel.addEventListener('scroll', updateCarouselState, { passive: true });
    const resizeObserver = new ResizeObserver(updateCarouselState);
    resizeObserver.observe(carousel);
    return () => {
      carousel.removeEventListener('scroll', updateCarouselState);
      resizeObserver.disconnect();
    };
  }, [albums, loading, loadError]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchPublishedAlbums() {
      if (!supabase) return;

      const { data, error: albumsError } = await supabase
        .from('albums')
        .select('id,title,album_photos(storage_path,sort_order)')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (albumsError) throw albumsError;

      const publishedAlbums = await Promise.all(((data ?? []) as StoredAlbum[]).map(async (album) => {
        const photos = [...(album.album_photos ?? [])].sort((first, second) => first.sort_order - second.sort_order);
        if (photos.length === 0) return null;

        const { data: signedPhotos, error: storageError } = await supabase.storage
          .from('mission-photos')
          .createSignedUrls(photos.map((photo) => photo.storage_path), 60 * 60);

        if (storageError) throw storageError;
        const photoUrls = (signedPhotos ?? []).flatMap((photo) => photo.signedUrl ? [photo.signedUrl] : []);
        if (photoUrls.length === 0) return null;

        return {
          id: album.id,
          title: album.title,
          files: [],
          photos: photoUrls,
          cover: photoUrls[Math.floor(Math.random() * photoUrls.length)],
        } satisfies Album;
      }));

      if (!active) return;
      setAlbums(publishedAlbums.filter((album): album is Album => album !== null));
      setLoadError(false);
    }

    void fetchPublishedAlbums().catch((error: unknown) => {
      console.error('Error fetching published albums:', error);
      if (active) {
        setAlbums([]);
        setLoadError(true);
      }
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [isLightboxOpen]);

  useEffect(() => {
    if (!lightbox) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(null);
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setLightbox((current) => {
          if (!current) return null;
          const photoCount = albums[current.albumIndex].photos.length;
          return { ...current, photoIndex: (current.photoIndex - 1 + photoCount) % photoCount };
        });
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setLightbox((current) => {
          if (!current) return null;
          const photoCount = albums[current.albumIndex].photos.length;
          return { ...current, photoIndex: (current.photoIndex + 1) % photoCount };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox]);

  const movePhoto = (direction: -1 | 1) => {
    setLightbox((current) => {
      if (!current) return null;
      const photoCount = albums[current.albumIndex].photos.length;
      return { ...current, photoIndex: (current.photoIndex + direction + photoCount) % photoCount };
    });
  };

  const moveCarousel = (direction: -1 | 1) => {
    const carousel = carouselRef.current;
    const firstCard = carousel?.firstElementChild as HTMLElement | null;
    if (!carousel || !firstCard) return;

    const gap = Number.parseFloat(getComputedStyle(carousel).columnGap) || 0;
    carousel.scrollBy({ left: direction * (firstCard.getBoundingClientRect().width + gap), behavior: 'smooth' });
  };

  return (
    <section className="border-b border-outline-variant bg-surface px-6 py-20 md:px-16 md:py-24" id="gallery">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 md:gap-12">
        <div className="flex flex-col justify-between gap-6 border-b border-outline-variant/70 pb-7 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary-container">
              <ImagePlus className="h-4 w-4" />
              <span>02 / Archivo clasificado / Legion-IX</span>
            </div>
            <h2 className="font-tactical text-5xl font-extrabold uppercase leading-none text-primary sm:text-6xl md:text-7xl">
              Expedientes de <span className="text-primary-container">misión</span>
            </h2>
            <p className="mt-4 max-w-xl font-body text-sm leading-relaxed text-on-surface-variant sm:text-base">
              Registro visual de operaciones Legion-IX.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {(canScrollPrevious || canScrollNext) && !loading && !loadError && (
              <div className="flex items-center gap-1.5">
                <button type="button" aria-label="Álbum anterior" title="Álbum anterior" disabled={!canScrollPrevious} onClick={() => moveCarousel(-1)} className="flex h-10 w-10 items-center justify-center border border-outline-variant text-primary transition-colors hover:border-primary-container hover:text-primary-container disabled:cursor-not-allowed disabled:opacity-35">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span aria-live="polite" className="min-w-12 text-center font-mono text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">{firstVisibleAlbum + 1} / {albums.length}</span>
                <button type="button" aria-label="Álbum siguiente" title="Álbum siguiente" disabled={!canScrollNext} onClick={() => moveCarousel(1)} className="flex h-10 w-10 items-center justify-center border border-primary-container text-primary-container transition-colors hover:bg-primary-container hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-35">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex w-fit items-center gap-3 border-l-2 border-primary-container px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <span className="font-tactical text-3xl leading-none text-primary-container">{String(albums.length).padStart(2, '0')}</span>
              <span>Expedientes<br />archivados</span>
            </div>
          </div>
        </div>

        <div ref={carouselRef} role="region" aria-roledescription="carrusel" aria-label="Expedientes de misión" className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:gap-5">
          {loading ? (
            <div role="status" className="w-full shrink-0 border border-outline-variant bg-surface-container px-6 py-10 font-mono text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Sincronizando expedientes...
            </div>
          ) : loadError ? (
            <div role="alert" className="w-full shrink-0 border border-red-400/40 bg-surface-container px-6 py-10">
              <span className="font-mono text-sm font-bold uppercase tracking-widest text-red-200">No se pudo cargar el archivo</span>
              <p className="mt-2 font-body text-sm text-on-surface-variant">Inténtalo de nuevo más tarde.</p>
            </div>
          ) : albums.length > 0 ? albums.map((album, albumIndex) => (
            <motion.button
              key={album.id}
              ref={albumIndex === 0 ? triggerRef : undefined}
              type="button"
              aria-label={`Abrir expediente ${album.title}, ${album.photos.length} fotografías`}
              onClick={(event) => {
                triggerRef.current = event.currentTarget;
                setLightbox({ albumIndex, photoIndex: 0 });
              }}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (albumIndex % 3) * 0.06 }}
              className="group relative aspect-[4/3] w-[86%] shrink-0 snap-start overflow-hidden border border-outline-variant/80 bg-surface-container text-left transition-colors hover:border-primary-container/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
            >
              <img src={album.cover} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" loading="eager" decoding="async" />
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/35" />
              <span aria-hidden="true" className="absolute inset-3 border border-white/20 transition-colors group-hover:border-primary-container/70 sm:inset-4" />
              <span className="absolute left-7 top-7 inline-flex items-center gap-2 border border-primary-container/50 bg-black/45 px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-primary-container backdrop-blur-sm sm:left-9 sm:top-9">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
                Archivo clasificado
              </span>
              <span className="absolute bottom-7 left-7 right-7 flex items-end justify-between gap-3 sm:bottom-9 sm:left-9 sm:right-9">
                <span className="min-w-0">
                  <span className="block break-words font-tactical text-3xl font-bold uppercase leading-tight text-white sm:text-4xl">{album.title}</span>
                  <span className="mt-2 block font-mono text-[9px] font-bold uppercase tracking-widest text-white/70">{String(album.photos.length).padStart(2, '0')} fotografías</span>
                </span>
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/50 bg-black/30 text-white transition-colors group-hover:border-primary-container group-hover:text-primary-container">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </span>
            </motion.button>
          )) : (
            <div className="w-full shrink-0 border border-dashed border-primary-container/40 bg-surface-container px-6 py-10">
              <span className="font-mono text-sm font-bold uppercase tracking-widest text-primary-container">Archivo visual vacío</span>
              <p className="mt-2 font-body text-sm text-on-surface-variant">Las nuevas operaciones aparecerán aquí cuando se publiquen.</p>
            </div>
          )}
        </div>
      </div>

      {activeAlbum && activePhoto && lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${activeAlbum.title}, imagen ${lightbox.photoIndex + 1} de ${activeAlbum.photos.length}`}
          tabIndex={-1}
          onClick={(event) => {
            if (event.target === event.currentTarget) setLightbox(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm sm:p-8"
        >
          <div className="absolute inset-3 border border-outline-variant/60 sm:inset-6" />
          <div className="absolute left-6 top-6 z-10 max-w-[calc(100%-6rem)] font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary-container sm:left-10 sm:top-10">
            <span className="block text-white/60">Expediente clasificado / {activeAlbum.id.replaceAll('_', ' ')}</span>
            <span className="mt-1 block truncate text-sm sm:text-base">{activeAlbum.title} · {String(lightbox.photoIndex + 1).padStart(2, '0')} / {String(activeAlbum.photos.length).padStart(2, '0')}</span>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Cerrar expediente"
            onClick={() => setLightbox(null)}
            className="absolute right-6 top-5 z-20 flex h-11 w-11 items-center justify-center border border-outline-variant bg-surface/80 text-primary transition-colors hover:border-primary-container hover:text-primary-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container sm:right-10 sm:top-8"
          >
            <X className="h-5 w-5" />
          </button>

          {activeAlbum.photos.length > 1 && (
            <button
              type="button"
              aria-label="Fotografía anterior"
              onClick={() => movePhoto(-1)}
              className="absolute left-5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-outline-variant bg-surface/80 text-primary transition-colors hover:border-primary-container hover:text-primary-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container sm:left-10 sm:h-14 sm:w-14"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          <img src={activePhoto} alt={`${activeAlbum.title}, fotografía ${lightbox.photoIndex + 1}`} className="relative z-10 max-h-[78vh] max-w-[min(82vw,1200px)] select-none object-contain" />

          {activeAlbum.photos.length > 1 && (
            <button
              type="button"
              aria-label="Fotografía siguiente"
              onClick={() => movePhoto(1)}
              className="absolute right-5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-outline-variant bg-surface/80 text-primary transition-colors hover:border-primary-container hover:text-primary-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container sm:right-10 sm:h-14 sm:w-14"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}