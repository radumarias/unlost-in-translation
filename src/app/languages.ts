// Single source of truth for supported languages, shared by the UI and the API prompts.
type LanguageInfo = { nativeName: string; flag: string; code: string };

const LANGUAGE_INFO = {
  'English': { nativeName: 'English', flag: '🇬🇧', code: 'en' },
  'Spanish': { nativeName: 'Español', flag: '🇪🇸', code: 'es' },
  'French': { nativeName: 'Français', flag: '🇫🇷', code: 'fr' },
  'German': { nativeName: 'Deutsch', flag: '🇩🇪', code: 'de' },
  'Japanese': { nativeName: '日本語', flag: '🇯🇵', code: 'ja' },
  'Italian': { nativeName: 'Italiano', flag: '🇮🇹', code: 'it' },
  'Portuguese': { nativeName: 'Português', flag: '🇵🇹', code: 'pt' },
  'Chinese (Mandarin)': { nativeName: '中文', flag: '🇨🇳', code: 'zh' },
  'Korean': { nativeName: '한국어', flag: '🇰🇷', code: 'ko' },
  'Russian': { nativeName: 'Русский', flag: '🇷🇺', code: 'ru' },
  'Arabic': { nativeName: 'العربية', flag: '🇸🇦', code: 'ar' },
  'Romanian': { nativeName: 'Română', flag: '🇷🇴', code: 'ro' },
  'Thai': { nativeName: 'ไทย', flag: '🇹🇭', code: 'th' },
  'Finnish': { nativeName: 'Suomi', flag: '🇫🇮', code: 'fi' },
} as const satisfies Record<string, LanguageInfo>;

export type Language = keyof typeof LANGUAGE_INFO;

const LANGUAGE_ENTRIES = Object.entries(LANGUAGE_INFO) as [Language, LanguageInfo][];

export const LANGUAGES = LANGUAGE_ENTRIES.map(([name]) => name);

// Human-readable list for LLM prompts, e.g. "English, Spanish, ...".
export const LANGUAGE_LIST = LANGUAGES.join(', ');

export const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  'Auto-detect': 'Auto-detect',
  ...Object.fromEntries(LANGUAGE_ENTRIES.map(([name, { nativeName }]) => [name, nativeName])),
};

export const LANGUAGE_FLAGS: Record<string, string> = {
  'Auto-detect': '✨',
  ...Object.fromEntries(LANGUAGE_ENTRIES.map(([name, { flag }]) => [name, flag])),
};

export const LANG_CODES: Record<string, string> = Object.fromEntries(
  LANGUAGE_ENTRIES.map(([name, { code }]) => [name, code])
);
