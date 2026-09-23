/**
 * Site-wide motion: Lenis smooth scrolling and scroll reveals for
 * [data-reveal]. Reveals use IntersectionObserver + CSS transitions, so they
 * never read layout (no forced reflow, no main-thread cost per element).
 * Nothing runs when the visitor prefers reduced motion; content is visible
 * without this file.
 */
import Lenis from 'lenis';

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduce) {
  const lenis = new Lenis({ lerp: 0.11, smoothWheel: true, anchors: false, allowNestedScroll: true, autoRaf: true });

  // Same-page anchors scroll through Lenis.
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -72 });
    history.pushState(null, '', url.hash);
  });

  // Pause smooth scrolling while a full-screen popover (mobile nav) is open.
  document.getElementById('mobile-nav')?.addEventListener('toggle', (e) => {
    if ((e as ToggleEvent).newState === 'open') lenis.stop();
    else lenis.start();
  });

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const delay = Number(el.dataset.revealDelay ?? 0);
        if (delay) el.style.transitionDelay = `${delay}s`;
        el.setAttribute('data-revealed', '');
        io.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => io.observe(el));

  root.setAttribute('data-motion-ready', '');
}
