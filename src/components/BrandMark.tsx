interface BrandMarkProps {
  className: string;
  filterId: string;
}

export default function BrandMark({ className, filterId }: BrandMarkProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 1024 1024" className={className}>
      <defs>
        <filter id={filterId} colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -1 -1 -1 0 2.86" />
        </filter>
      </defs>
      <image href="/logo-legion-vector.png" width="1024" height="1024" filter={`url(#${filterId})`} />
    </svg>
  );
}