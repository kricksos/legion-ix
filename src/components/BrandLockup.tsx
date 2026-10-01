import BrandMark from './BrandMark';

interface BrandLockupProps {
  href: string;
  ariaLabel: string;
  filterId: string;
  className?: string;
}

export default function BrandLockup({ href, ariaLabel, filterId, className = '' }: BrandLockupProps) {
  return (
    <a href={href} aria-label={ariaLabel} className={`group flex items-center gap-3 ${className}`}>
      <BrandMark className="h-8 w-8 shrink-0 sm:h-10 sm:w-10" filterId={filterId} />
      <span className="flex flex-col items-start gap-1">
        <span className="font-display text-xl font-bold uppercase text-primary transition-colors group-hover:text-primary-container sm:text-2xl">LEGION-IX</span>
        <span className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-on-surface-variant sm:text-[9px] sm:tracking-[0.18em]">Colectivo airsoft · Est. 2019</span>
      </span>
    </a>
  );
}