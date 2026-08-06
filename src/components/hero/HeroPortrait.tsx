import Image from 'next/image';

export default function HeroPortrait() {
  return (
    <div className="relative flex h-full w-full items-end justify-center select-none md:justify-end">
      <div className="hero-rise group relative z-10 w-full max-w-[520px] origin-bottom md:ml-auto md:max-w-[560px]">
        <div
          className="relative h-[55vh] w-full overflow-hidden md:h-[72vh]"
          style={{
            WebkitMaskImage: 'radial-gradient(140% 140% at 50% 30%, #000 72%, transparent 100%)',
            maskImage: 'radial-gradient(140% 140% at 50% 30%, #000 72%, transparent 100%)',
          }}
        >
          {/* Soft halo — was a 4%-opacity plane behind the portrait. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 blur-2xl [background:radial-gradient(60%_55%_at_50%_45%,rgba(255,90,54,0.10),transparent_70%)]"
          />

          <Image
            src="/images/frontal_portrait.webp"
            alt="Joel Perca"
            fill
            priority
            sizes="(min-width: 768px) 560px, 100vw"
            className="object-cover object-[50%_32%] transition-transform duration-500 ease-out group-hover:scale-[1.01]"
          />

          {/* Recognition frame (pulsing) — was edgesGeometry at 96% of the plane. */}
          <div aria-hidden className="hero-frame pointer-events-none absolute inset-[2%] border border-accent" />

          {/* Corner brackets on hover — the 3D version drew only TL + BR. */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-[2%] top-[2%] h-[16%] w-[16%] border-l-2 border-t-2 border-accent opacity-0 transition-opacity duration-500 group-hover:opacity-[0.45]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-[2%] right-[2%] h-[16%] w-[16%] border-b-2 border-r-2 border-accent opacity-0 transition-opacity duration-500 group-hover:opacity-[0.45]"
          />

          {/* Sweeping scan bar. Wrapper is full-height so translateY(100%) sweeps the box. */}
          <div aria-hidden className="hero-scan pointer-events-none absolute inset-x-[4%] top-0 h-full">
            <div className="h-[2px] w-full bg-accent/60 shadow-[0_0_12px_rgba(255,90,54,0.55)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
