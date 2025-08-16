import { env } from 'next-runtime-env';
import packageJSON from '../package.json';

export const locales = packageJSON.i18n.outputLocales;
export const defaultLocale = packageJSON.i18n.entry;

export const NEXT_PUBLIC_DEFAULT_LANGUAGE =
  env('NEXT_PUBLIC_DEFAULT_LANGUAGE') ?? process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE ?? defaultLocale;

export const NEXT_PUBLIC_SITE_URL = env('NEXT_PUBLIC_SITE_URL') ?? process.env.NEXT_PUBLIC_SITE_URL;
export const NEXT_PUBLIC_API_URL = env('NEXT_PUBLIC_API_URL') ?? process.env.NEXT_PUBLIC_API_URL;
export const NEXT_PUBLIC_CDN_URL =
  env('NEXT_PUBLIC_CDN_URL') || process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.jsdelivr.net';

export const NEXT_PUBLIC_DEFAULT_USER_EMAIL =
  env('NEXT_PUBLIC_DEFAULT_USER_EMAIL') ?? process.env.NEXT_PUBLIC_DEFAULT_USER_EMAIL;
export const NEXT_PUBLIC_DEFAULT_USER_PASSWORD =
  env('NEXT_PUBLIC_DEFAULT_USER_PASSWORD') ?? process.env.NEXT_PUBLIC_DEFAULT_USER_PASSWORD;

export const NEXT_PUBLIC_EMAIL = env('NEXT_PUBLIC_EMAIL') ?? process.env.NEXT_PUBLIC_EMAIL;

export const NEXT_PUBLIC_TELEGRAM_LINK =
  env('NEXT_PUBLIC_TELEGRAM_LINK') ?? process.env.NEXT_PUBLIC_TELEGRAM_LINK;
export const NEXT_PUBLIC_DISCORD_LINK =
  env('NEXT_PUBLIC_DISCORD_LINK') ?? process.env.NEXT_PUBLIC_DISCORD_LINK;
export const NEXT_PUBLIC_GITHUB_LINK =
  env('NEXT_PUBLIC_GITHUB_LINK') ?? process.env.NEXT_PUBLIC_GITHUB_LINK;
export const NEXT_PUBLIC_LINKEDIN_LINK =
  env('NEXT_PUBLIC_LINKEDIN_LINK') ?? process.env.NEXT_PUBLIC_LINKEDIN_LINK;
export const NEXT_PUBLIC_TWITTER_LINK =
  env('NEXT_PUBLIC_TWITTER_LINK') ?? process.env.NEXT_PUBLIC_TWITTER_LINK;
export const NEXT_PUBLIC_INSTAGRAM_LINK =
  env('NEXT_PUBLIC_INSTAGRAM_LINK') ?? process.env.NEXT_PUBLIC_INSTAGRAM_LINK;
