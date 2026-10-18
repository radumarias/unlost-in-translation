// Single source of truth for supported languages, shared by the UI and the API prompts.
const LANGUAGE_INFO: Record<string, { nativeName: string; flag: string; code: string }> = {
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
};

export const LANGUAGES = Object.keys(LANGUAGE_INFO);

export const LANGUAGE_DISPLAY_NAMES: Record<string, string> = { 'Auto-detect': 'Auto-detect' };
export const LANGUAGE_FLAGS: Record<string, string> = { 'Auto-detect': '✨' };
export const LANG_CODES: Record<string, string> = {};

for (const [name, { nativeName, flag, code }] of Object.entries(LANGUAGE_INFO)) {
  LANGUAGE_DISPLAY_NAMES[name] = nativeName;
  LANGUAGE_FLAGS[name] = flag;
  LANG_CODES[name] = code;
}
