'use client';

import { useState, useRef, useEffect } from 'react';
import { getStr } from './i18n';

type Interaction = {
  id: string;
  sourceLang: string;
  targetLang: string;
  originalText: string;
  translation: string;
};

type DraftTranslation = {
  originalText: string;
  translation: string;
  sanity_check: string;
  warning: string | null;
  sourceLang: string;
  targetLang: string;
};

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Italian',
  'Portuguese',
  'Chinese (Mandarin)',
  'Korean',
  'Russian',
  'Arabic',
  'Romanian',
  'Thai'
];

const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  'English': 'English',
  'Spanish': 'Español',
  'French': 'Français',
  'German': 'Deutsch',
  'Japanese': '日本語',
  'Italian': 'Italiano',
  'Portuguese': 'Português',
  'Chinese (Mandarin)': '中文',
  'Korean': '한국어',
  'Russian': 'Русский',
  'Arabic': 'العربية',
  'Romanian': 'Română',
  'Thai': 'ไทย'
};

const LANG_CODES: Record<string, string> = {
  'English': 'en',
  'Spanish': 'es',
  'French': 'fr',
  'German': 'de',
  'Japanese': 'ja',
  'Italian': 'it',
  'Portuguese': 'pt',
  'Chinese (Mandarin)': 'zh',
  'Korean': 'ko',
  'Russian': 'ru',
  'Arabic': 'ar',
  'Romanian': 'ro',
  'Thai': 'th'
};

export default function Home() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [input, setInput] = useState('');
  const [loadingMode, setLoadingMode] = useState<'intent' | 'direct' | false>(false);
  const [sourceLanguage, setSourceLanguage] = useState('English');
  const [targetLanguage, setTargetLanguage] = useState('Thai');
  const [draft, setDraft] = useState<DraftTranslation | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Viewport height for mobile keyboard handling
  const [viewportHeight, setViewportHeight] = useState('100dvh');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle mobile keyboard viewport sizing
  useEffect(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      const initialHeight = window.innerHeight;
      
      const handleResize = () => {
        const currentHeight = window.visualViewport?.height || initialHeight;
        setViewportHeight(`${currentHeight}px`);
        setIsKeyboardOpen(currentHeight < initialHeight * 0.85);
        
        // Force scroll to top to prevent browser from pushing content up
        window.scrollTo(0, 0);
      };
      
      const handleScroll = () => {
        if (window.scrollY > 0 || document.documentElement.scrollTop > 0) {
          window.scrollTo(0, 0);
        }
      };
      
      window.visualViewport.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleResize(); // Set initially
      
      return () => {
        window.visualViewport?.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interactions, isHistoryOpen]);

  // Auto focus input when not in draft or history mode
  useEffect(() => {
    if (!draft && !isHistoryOpen && !loadingMode) {
      textareaRef.current?.focus();
    }
  }, [draft, isHistoryOpen, loadingMode]);

  const handleSwap = () => {
    const nextSource = targetLanguage;
    const nextTarget = sourceLanguage;
    setSourceLanguage(nextSource);
    setTargetLanguage(nextTarget);
  };

  const getDestLangName = (lang: string) => {
    try {
      const sourceCode = LANG_CODES[sourceLanguage];
      const targetCode = LANG_CODES[lang];
      const translated = new Intl.DisplayNames([sourceCode], { type: 'language' }).of(targetCode);
      if (translated) {
        const capitalized = translated.charAt(0).toUpperCase() + translated.slice(1);
        if (LANGUAGE_DISPLAY_NAMES[lang].toLowerCase() === capitalized.toLowerCase()) {
           return LANGUAGE_DISPLAY_NAMES[lang];
        }
        return `${LANGUAGE_DISPLAY_NAMES[lang]} (${capitalized})`;
      }
    } catch(e) {}
    return LANGUAGE_DISPLAY_NAMES[lang];
  };

  const handleSubmit = async (skipChecks: boolean) => {
    if (!input.trim() || loadingMode !== false || draft) return;
    setLoadingMode(skipChecks ? 'direct' : 'intent');

    try {
      const payload = { 
        history: interactions.map(i => ({ speakerLang: i.sourceLang, text: i.originalText })),
        sourceLanguage,
        targetLanguage,
        currentInput: input
      };

      if (skipChecks) {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, skipChecks: true }),
        });
        if (!response.ok) throw new Error('Translation failed');
        const data = await response.json();

         setInteractions((prev) => [
           ...prev,
           {
             id: Math.random().toString(36).substring(7),
             sourceLang: sourceLanguage,
             targetLang: targetLanguage,
             originalText: input,
             translation: data.translation
           }
         ]);
         
         // Auto hand-off flow for direct translate
         const nextSource = targetLanguage;
         const nextTarget = sourceLanguage;
         setSourceLanguage(nextSource);
         setTargetLanguage(nextTarget);
         setInput('');
         setIsHistoryOpen(true);
      } else {
        // Progressive UI - Parallel Fetching
        setDraft({
          originalText: input,
          translation: getStr(sourceLanguage, 'translating'),
          sanity_check: getStr(sourceLanguage, 'checkingIntent'),
          warning: null,
          sourceLang: sourceLanguage,
          targetLang: targetLanguage
        });
        setInput('');

        const transPromise = fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, skipChecks: true }),
        }).then(res => res.json()).then(data => {
          setDraft(prev => prev ? { ...prev, translation: data.translation } : null);
        });

        const intentPromise = fetch('/api/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(res => res.json()).then(data => {
          setDraft(prev => prev ? { 
            ...prev, 
            sanity_check: data.sanity_check,
            warning: data.warning 
          } : null);
        });

        await Promise.all([transPromise, intentPromise]);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to translate. Please try again.');
    } finally {
      setLoadingMode(false);
    }
  };

  const handleApprove = () => {
    if (!draft) return;
    setInteractions((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        sourceLang: draft.sourceLang,
        targetLang: draft.targetLang,
        originalText: draft.originalText,
        translation: draft.translation
      }
    ]);
    
    // Auto hand-off flow
    const nextSource = draft.targetLang;
    const nextTarget = draft.sourceLang;
    setSourceLanguage(nextSource);
    setTargetLanguage(nextTarget);
    setDraft(null);
    setIsHistoryOpen(true);
  };

  const handleDiscard = () => {
    if (!draft) return;
    setInput(draft.originalText);
    setDraft(null);
  };

  return (
    <div 
      className={`relative flex flex-col font-sans overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'dark bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
      style={{ height: viewportHeight }}
    >
      
      {/* HISTORY DRAWER (Z-10) */}
      <div 
        className={`absolute top-0 left-0 w-full bg-gray-50 dark:bg-gray-900 shadow-inner dark:shadow-gray-950/50 transition-transform duration-300 ease-in-out z-10 flex flex-col ${
          isHistoryOpen ? 'translate-y-0 h-full pt-[76px]' : '-translate-y-full h-full pt-[76px]'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6 pt-6">
          {interactions.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 mt-10 italic">{getStr(sourceLanguage, 'noHistory')}</div>
          ) : (
            interactions.map((interaction) => {
              const isRight = interaction.sourceLang === sourceLanguage;
              let displayText = interaction.originalText;
              
              if (interaction.sourceLang === sourceLanguage) {
                displayText = interaction.originalText;
              } else if (interaction.targetLang === sourceLanguage) {
                displayText = interaction.translation;
              }

              return (
                <div key={interaction.id} className={`flex flex-col w-full ${isRight ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] sm:max-w-[70%] rounded-3xl p-5 shadow-sm ${
                    isRight 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'
                  }`}>
                    <p className="text-xl leading-snug">{displayText}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endOfMessagesRef} />
        </div>
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] dark:shadow-none">
          <button 
            onClick={() => setIsHistoryOpen(false)} 
            className="w-full bg-blue-600 text-white font-bold py-5 text-xl rounded-2xl active:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-colors"
          >
            {getStr(sourceLanguage, 'replyIn')} {LANGUAGE_DISPLAY_NAMES[sourceLanguage]}
          </button>
        </div>
      </div>

      {/* HEADER (Z-20) */}
      <header className={`relative z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 pt-1.5 pb-2 flex flex-col shrink-0 shadow-sm dark:shadow-gray-950/50 transition-all duration-300 ${isKeyboardOpen && !draft ? 'hidden' : 'block'}`}>
        <div className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 dark:text-gray-500 text-center pb-1 w-full opacity-80">
          Unlost in Translation
        </div>
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center space-x-1 flex-[2]">
          <select 
            value={sourceLanguage} 
            onChange={(e) => setSourceLanguage(e.target.value)}
            className="flex-1 text-center font-bold text-blue-600 dark:text-blue-400 text-lg outline-none bg-transparent truncate max-w-[120px]"
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang} className="text-black dark:text-white bg-white dark:bg-gray-800">{LANGUAGE_DISPLAY_NAMES[lang]}</option>
            ))}
          </select>
          
          <button 
            onClick={handleSwap}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Swap Languages"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </button>

          <select 
            value={targetLanguage} 
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="flex-1 text-center font-bold text-blue-600 dark:text-blue-400 text-lg outline-none bg-transparent truncate max-w-[120px]"
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang} className="text-black dark:text-white bg-white dark:bg-gray-800">{getDestLangName(lang)}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-1 justify-end flex-1">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-full transition-colors text-xl"
            title="Toggle Theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <button 
            onClick={() => setIsHistoryOpen(!isHistoryOpen)} 
            className={`p-2 rounded-full transition-colors ${isHistoryOpen ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
            title="History"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA (Z-0) */}
      <main className="relative z-0 flex-1 flex flex-col overflow-hidden transition-colors duration-300">
        {!draft ? (
          <div className="flex-1 flex flex-col p-4 sm:p-6 h-full">
            
            <div className="flex items-center flex-wrap gap-2 mb-4 font-bold uppercase tracking-wider text-[11px] sm:text-xs shrink-0">
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800 shadow-sm">
                🎤 {getStr(sourceLanguage, 'you')}: {LANGUAGE_DISPLAY_NAMES[sourceLanguage]}
              </span>
              <span className="text-gray-400 dark:text-gray-500">→</span>
              <span className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
                {getStr(sourceLanguage, 'translatingTo')}: {LANGUAGE_DISPLAY_NAMES[targetLanguage]}
              </span>
            </div>

            <textarea
              ref={textareaRef}
              className="flex-1 w-full text-3xl sm:text-5xl text-gray-800 dark:text-white placeholder-gray-200 dark:placeholder-gray-700 resize-none outline-none bg-transparent py-2 leading-tight font-medium overflow-y-auto"
              placeholder={getStr(sourceLanguage, 'typeHere')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loadingMode !== false}
            />
            
            <div className="shrink-0 pt-3 pb-1 flex gap-2 sm:gap-3">
              <button 
                onClick={() => handleSubmit(false)}
                disabled={loadingMode !== false || !input.trim()}
                className="flex-1 bg-blue-600 text-white rounded-2xl py-4 sm:py-5 text-lg sm:text-xl font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/20 disabled:opacity-50 disabled:shadow-none flex justify-center items-center active:bg-blue-700 transition-colors"
              >
                {loadingMode === 'intent' ? (
                   <span className="flex items-center">
                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     {getStr(sourceLanguage, 'checkingIntent')}
                   </span>
                ) : (
                  getStr(sourceLanguage, 'checkIntent')
                )}
              </button>

              <button 
                onClick={() => handleSubmit(true)}
                disabled={loadingMode !== false || !input.trim()}
                title={getStr(sourceLanguage, 'directTranslate')}
                className="w-16 sm:w-20 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl flex justify-center items-center active:bg-gray-200 dark:active:bg-gray-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {loadingMode === 'direct' ? (
                  <svg className="animate-spin h-6 w-6 text-gray-700 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 sm:w-8 sm:h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col relative h-full">
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-28">
              <div className="mb-6">
                <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{LANGUAGE_DISPLAY_NAMES[draft.sourceLang]}</p>
                <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300">{draft.originalText}</p>
              </div>
              
              <div className="mb-8 border-l-4 border-blue-500 pl-4 py-1">
                <p className="text-sm font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-2">{LANGUAGE_DISPLAY_NAMES[draft.targetLang]}</p>
                <p className={`text-3xl sm:text-5xl text-blue-900 dark:text-blue-300 font-medium leading-tight ${draft.translation === getStr(sourceLanguage, 'translating') ? 'animate-pulse opacity-70' : ''}`}>
                  {draft.translation}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-5 border border-gray-100 dark:border-gray-700/50 shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${draft.warning ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                  <strong className="text-gray-800 dark:text-gray-200 text-base sm:text-lg">{getStr(sourceLanguage, 'sanityCheck')}</strong>
                </div>
                <p className={`text-gray-600 dark:text-gray-300 text-lg sm:text-xl italic leading-relaxed ${draft.sanity_check === getStr(sourceLanguage, 'checkingIntent') ? 'animate-pulse opacity-70' : ''}`}>
                  "{draft.sanity_check}"
                </p>
                
                {draft.warning && (
                  <div className="mt-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 text-amber-900 dark:text-amber-200 rounded-2xl p-4 text-sm font-medium">
                    <strong className="text-amber-800 dark:text-amber-400">⚠️ {getStr(sourceLanguage, 'warning')}</strong>
                    <p className="mt-1 opacity-90">{draft.warning}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full p-3 sm:p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex space-x-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-none">
              <button 
                onClick={handleDiscard} 
                disabled={loadingMode !== false}
                className="flex-1 py-4 sm:py-5 rounded-2xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors text-base sm:text-lg disabled:opacity-50"
              >
                {getStr(sourceLanguage, 'discard')}
              </button>
              <button 
                onClick={handleApprove} 
                disabled={loadingMode !== false}
                className="flex-[2] py-4 sm:py-5 rounded-2xl font-bold text-white bg-blue-600 active:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-colors text-base sm:text-lg disabled:opacity-50 disabled:shadow-none"
              >
                {getStr(sourceLanguage, 'approve')}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
