import { en, type Dict } from './en';
import { id } from './id';

export const locales = ['en', 'id'] as const;
export type Lang = (typeof locales)[number];
export const defaultLang: Lang = 'en';

export const localeMeta: Record<Lang, { label: string; short: string; htmlLang: string; og: string }> = {
  en: { label: 'English', short: 'EN', htmlLang: 'en', og: 'en_US' },
  id: { label: 'Bahasa Indonesia', short: 'ID', htmlLang: 'id', og: 'id_ID' },
};

const dicts: Record<Lang, Dict> = { en, id };

export function t(lang: Lang): Dict {
  return dicts[lang];
}

export function isLang(value: string | undefined): value is Lang {
  return !!value && (locales as readonly string[]).includes(value);
}

/** Strip the locale prefix: "/id/benchmarks/" -> "/benchmarks/". */
export function stripLocale(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length && isLang(parts[0]) && parts[0] !== defaultLang) parts.shift();
  const path = '/' + parts.join('/');
  return path === '/' ? '/' : path.replace(/\/?$/, '/');
}

/** Localised path for a route key such as "/benchmarks/". */
export function localePath(lang: Lang, path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const [pathname, hash = ''] = clean.split('#');
  const normalised = pathname === '/' ? '/' : pathname.replace(/\/?$/, '/');
  const prefixed = lang === defaultLang ? normalised : `/${lang}${normalised === '/' ? '/' : normalised}`;
  return hash ? `${prefixed}#${hash}` : prefixed;
}

export function langFromPath(pathname: string): Lang {
  const first = pathname.split('/').filter(Boolean)[0];
  return isLang(first) ? first : defaultLang;
}

/**
 * Tiny inline markup used in dictionary strings, so translators never touch
 * components:
 *   [[world]]            -> glossary term "world", label from the glossary
 *   [[world|worlds]]     -> glossary term "world", custom label
 *   **bold**  `code`
 */
export type Segment =
  | { type: 'text'; value: string }
  | { type: 'term'; key: string; label?: string }
  | { type: 'strong'; value: string }
  | { type: 'code'; value: string };

const TOKEN = /\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]|\*\*([^*]+)\*\*|`([^`]+)`/g;

export function parseRich(input: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of input.matchAll(TOKEN)) {
    const index = m.index ?? 0;
    if (index > last) out.push({ type: 'text', value: input.slice(last, index) });
    if (m[1]) out.push({ type: 'term', key: m[1], label: m[2] });
    else if (m[3]) out.push({ type: 'strong', value: m[3] });
    else if (m[4]) out.push({ type: 'code', value: m[4] });
    last = index + m[0].length;
  }
  if (last < input.length) out.push({ type: 'text', value: input.slice(last) });
  return out;
}

/** Plain text version of a rich string (for meta tags and React islands). */
export function plain(input: string): string {
  return input
    .replace(/\[\[([a-z0-9-]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([a-z0-9-]+)\]\]/g, (_, k: string) => k.replace(/-/g, ' '))
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
}

export type { Dict };
