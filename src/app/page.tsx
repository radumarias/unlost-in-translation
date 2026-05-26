'use client';

import { useState, useRef, useEffect } from 'react';
import { getStr } from './i18n';

type Interaction = {
  id: string;
  sourceLang: string;
  targetLang: string;
  originalText: string;
  translation: string;
  imageUrl?: string;
};

type DraftTranslation = {
  originalText: string;
  translation: string;
  sanity_check: string;
  warning: string | null;
  sourceLang: string;
  targetLang: string;
  roundTrip: string | null;
  rewriteDirection?: string | null;
  rewrittenSource?: string | null;
  alternativeDirections?: string[] | null;
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

const LANGUAGE_FLAGS: Record<string, string> = {
  'English': '🇬🇧',
  'Spanish': '🇪🇸',
  'French': '🇫🇷',
  'German': '🇩🇪',
  'Japanese': '🇯🇵',
  'Italian': '🇮🇹',
  'Portuguese': '🇵🇹',
  'Chinese (Mandarin)': '🇨🇳',
  'Korean': '🇰🇷',
  'Russian': '🇷🇺',
  'Arabic': '🇸🇦',
  'Romanian': '🇷🇴',
  'Thai': '🇹🇭'
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

const TONES = [
  { id: 'Auto', icon: '✨', labelKey: 'toneAuto' },
  { id: 'Casual', icon: '😊', labelKey: 'toneCasual' },
  { id: 'Formal', icon: '👔', labelKey: 'toneFormal' },
  { id: 'Business', icon: '💼', labelKey: 'toneBusiness' },
  { id: 'Playful', icon: '🥳', labelKey: 'tonePlayful' },
  { id: 'Empathetic', icon: '❤️', labelKey: 'toneEmpathetic' },
  { id: 'Direct', icon: '🎯', labelKey: 'toneDirect' },
];

const SITUATIONS = [
  { id: 'General', icon: '🌍', labelKey: 'sitGeneral' },
  { id: 'Medical', icon: '🏥', labelKey: 'sitMedical' },
  { id: 'Dating', icon: '❤️', labelKey: 'sitDating' },
  { id: 'Service', icon: '🍽️', labelKey: 'sitService' },
  { id: 'Emergency', icon: '🚨', labelKey: 'sitEmergency' },
];

export default function Home() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [input, setInput] = useState('');
  const [loadingMode, setLoadingMode] = useState<'intent' | 'direct' | 'camera' | false>(false);
  const [sourceLanguage, setSourceLanguage] = useState('English');
  const [targetLanguage, setTargetLanguage] = useState('Thai');
  const [draft, setDraft] = useState<DraftTranslation | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [tone, setTone] = useState('Auto');
  const [situation, setSituation] = useState('General');
  const [fullScreenText, setFullScreenText] = useState<string | null>(null);
  const [fetchingAlternativeDir, setFetchingAlternativeDir] = useState<string | null>(null);
  const [isFetchingInitialRewrite, setIsFetchingInitialRewrite] = useState(false);
  const [isToneMenuOpen, setIsToneMenuOpen] = useState(false);
  const [isSituationMenuOpen, setIsSituationMenuOpen] = useState(false);
  const [isSourceMenuOpen, setIsSourceMenuOpen] = useState(false);
  const [isTargetMenuOpen, setIsTargetMenuOpen] = useState(false);
  
  // Viewport height for mobile keyboard handling
  const [viewportHeight, setViewportHeight] = useState('100dvh');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toneMenuRef = useRef<HTMLDivElement>(null);
  const situationMenuRef = useRef<HTMLDivElement>(null);
  const sourceMenuRef = useRef<HTMLDivElement>(null);
  const targetMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toneMenuRef.current && !toneMenuRef.current.contains(event.target as Node)) {
        setIsToneMenuOpen(false);
      }
      if (situationMenuRef.current && !situationMenuRef.current.contains(event.target as Node)) {
        setIsSituationMenuOpen(false);
      }
      if (sourceMenuRef.current && !sourceMenuRef.current.contains(event.target as Node)) {
        setIsSourceMenuOpen(false);
      }
      if (targetMenuRef.current && !targetMenuRef.current.contains(event.target as Node)) {
        setIsTargetMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingMode('camera');

    try {
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const payload = {
        imageBase64: base64String,
        userLanguage: sourceLanguage,
        otherLanguage: targetLanguage,
      };

      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Vision failed');
      const data = await response.json();

      const detectedLang = data.detectedLanguage || targetLanguage;
      
      if (detectedLang !== sourceLanguage && detectedLang !== targetLanguage) {
        setTargetLanguage(detectedLang);
      }

      const translationTargetLang = detectedLang === sourceLanguage ? targetLanguage : sourceLanguage;

      setInteractions((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          sourceLang: detectedLang,
          targetLang: translationTargetLang,
          originalText: data.originalText,
          translation: data.translation,
          imageUrl: base64String,
        },
      ]);
      setIsHistoryOpen(true);
    } catch (error) {
      console.error(error);
      alert('Failed to process image.');
    } finally {
      setLoadingMode(false);
      // Reset file input so same file can be selected again
      e.target.value = '';
    }
  };

  const handleSubmit = async (skipChecks: boolean, overrideInput?: string) => {
    const textToSubmit = overrideInput || input;
    if (!textToSubmit.trim() || loadingMode !== false || (draft && !overrideInput)) return;
    setLoadingMode(skipChecks ? 'direct' : 'intent');

    try {
      const payload = {
        history: interactions.map(i => ({ speakerLang: i.sourceLang, text: i.originalText })),
        sourceLanguage,
        targetLanguage,
        tone,
        situation,
        currentInput: textToSubmit
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
             originalText: textToSubmit,
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
          originalText: textToSubmit,
          translation: getStr(sourceLanguage, 'translating'),
          sanity_check: getStr(sourceLanguage, 'checkingIntent'),
          warning: null,
          sourceLang: sourceLanguage,
          targetLang: targetLanguage,
          roundTrip: getStr(sourceLanguage, 'generatingRoundTrip')
        });
        setInput('');

        const transPromise = fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, skipChecks: true }),
        }).then(res => res.json()).then(async data => {
          setDraft(prev => prev ? { ...prev, translation: data.translation } : null);
          
          // Initiate Round Trip Translation (B -> A)
          try {
            const rtPayload = {
              history: [], // No history for literal round-trip
              sourceLanguage: targetLanguage,
              targetLanguage: sourceLanguage,
              tone: 'Auto',
              situation,
              currentInput: data.translation
            };
            const rtRes = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...rtPayload, skipChecks: true }),
            });
            const rtData = await rtRes.json();
            setDraft(prev => prev ? { ...prev, roundTrip: rtData.translation } : null);
          } catch (e) {
            setDraft(prev => prev ? { ...prev, roundTrip: "Failed to generate back-translation." } : null);
          }
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

          if (data.warning) {
            fetchInitialRewrite(payload.currentInput, data.warning);
          }
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

  const handleUseRewrite = (newSource: string) => {
    setDraft(null);
    setInput(newSource);
    setTimeout(() => {
      handleSubmit(false, newSource);
    }, 0);
  };

  const fetchInitialRewrite = async (currentInputText: string, warningText: string) => {
    setIsFetchingInitialRewrite(true);
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: interactions,
          sourceLanguage,
          targetLanguage,
          tone,
          situation,
          currentInput: currentInputText,
          warning: warningText
        })
      });
      const data = await res.json();
      setDraft(prev => prev ? {
        ...prev,
        rewriteDirection: data.rewriteDirection,
        rewrittenSource: data.rewrittenSource,
        rewrittenTarget: data.rewrittenTarget,
        alternativeDirections: data.alternativeDirections
      } : null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingInitialRewrite(false);
    }
  };

  const handleFetchAlternative = async (direction: string) => {
    if (!draft) return;
    setFetchingAlternativeDir(direction);
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: interactions,
          sourceLanguage,
          targetLanguage,
          tone,
          situation,
          currentInput: draft.originalText,
          warning: draft.warning,
          direction
        })
      });
      const data = await res.json();
      setDraft(prev => prev ? {
        ...prev,
        rewriteDirection: direction,
        rewrittenSource: data.rewrittenSource,
        rewrittenTarget: data.rewrittenTarget
      } : null);
    } finally {
      setFetchingAlternativeDir(null);
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
    setLoadingMode(false);
  };

  const handleDiscard = () => {
    if (!draft) return;
    setInput(draft.originalText);
    setDraft(null);
    setLoadingMode(false);
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
                  <div className={`group relative max-w-[85%] sm:max-w-[70%] rounded-3xl p-5 shadow-sm ${
                    isRight 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'
                  }`}>
                    <div className="flex justify-between items-start space-x-4">
                      <div>
                        {interaction.imageUrl && (
                          <div className="mb-3 rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                            <img src={interaction.imageUrl} alt="Captured" className="max-h-48 w-auto object-cover" />
                          </div>
                        )}
                        <p className="text-xl leading-snug">{displayText}</p>
                      </div>
                      <button 
                        onClick={() => setFullScreenText(interaction.translation)} 
                        className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${isRight ? 'text-blue-200 hover:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        title="Expand"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
                      </button>
                    </div>
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
          <div className="flex items-center space-x-0 sm:space-x-1 flex-[2] relative">
          
          <div className="relative flex-1 max-w-[150px]" ref={sourceMenuRef}>
            <button
              onClick={() => setIsSourceMenuOpen(!isSourceMenuOpen)}
              className="w-full flex items-center justify-center space-x-1 sm:space-x-2 p-1.5 sm:p-2 font-bold text-blue-600 dark:text-blue-400 text-base sm:text-lg rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors outline-none"
            >
              <span className="text-xl hidden sm:inline-block">{LANGUAGE_FLAGS[sourceLanguage]}</span>
              <span className="truncate">{LANGUAGE_DISPLAY_NAMES[sourceLanguage]}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4 opacity-50 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            
            {isSourceMenuOpen && (
              <div className="absolute left-0 mt-2 w-56 max-h-80 overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-gray-950 border border-gray-100 dark:border-gray-800 z-50 custom-scrollbar transform origin-top-left transition-all">
                <div className="p-1.5">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      onClick={() => { setSourceLanguage(lang); setIsSourceMenuOpen(false); }}
                      className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold flex items-center space-x-3 transition-colors ${
                        sourceLanguage === lang 
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="text-xl">{LANGUAGE_FLAGS[lang]}</span>
                      <span>{LANGUAGE_DISPLAY_NAMES[lang]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleSwap}
            className="p-1.5 sm:p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shrink-0"
            title="Swap Languages"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </button>

          <div className="relative flex-1 max-w-[150px]" ref={targetMenuRef}>
            <button
              onClick={() => setIsTargetMenuOpen(!isTargetMenuOpen)}
              className="w-full flex items-center justify-center space-x-1 sm:space-x-2 p-1.5 sm:p-2 font-bold text-blue-600 dark:text-blue-400 text-base sm:text-lg rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors outline-none"
            >
              <span className="text-xl hidden sm:inline-block">{LANGUAGE_FLAGS[targetLanguage]}</span>
              <span className="truncate">{getDestLangName(targetLanguage)}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4 opacity-50 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            
            {isTargetMenuOpen && (
              <div className="absolute left-0 mt-2 w-56 max-h-80 overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-gray-950 border border-gray-100 dark:border-gray-800 z-50 custom-scrollbar transform origin-top-left transition-all">
                <div className="p-1.5">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      onClick={() => { setTargetLanguage(lang); setIsTargetMenuOpen(false); }}
                      className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold flex items-center space-x-3 transition-colors ${
                        targetLanguage === lang 
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="text-xl">{LANGUAGE_FLAGS[lang]}</span>
                      <span>{getDestLangName(lang)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1 justify-end flex-1">
          <div className="relative" ref={situationMenuRef}>
            <button
              onClick={() => setIsSituationMenuOpen(!isSituationMenuOpen)}
              className="flex items-center space-x-1 px-3 py-1.5 mr-1 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-2xl transition-colors outline-none shadow-sm"
              title="Conversation Context"
            >
              <span className="text-base">{SITUATIONS.find(s => s.id === situation)?.icon}</span>
              <span className="hidden sm:inline-block ml-1 whitespace-nowrap">{getStr(sourceLanguage, SITUATIONS.find(s => s.id === situation)?.labelKey || 'sitGeneral')}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 ml-1 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            
            {isSituationMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-gray-950 border border-gray-100 dark:border-gray-800 overflow-hidden z-50 transform origin-top-right transition-all">
                <div className="p-1.5">
                  {SITUATIONS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setSituation(s.id); setIsSituationMenuOpen(false); }}
                      className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold flex items-center space-x-3 transition-colors ${
                        situation === s.id 
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="text-xl">{s.icon}</span>
                      <span>{getStr(sourceLanguage, s.labelKey)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={toneMenuRef}>
            <button
              onClick={() => setIsToneMenuOpen(!isToneMenuOpen)}
              className="flex items-center space-x-1 px-3 py-1.5 mr-1 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-2xl transition-colors outline-none shadow-sm"
              title="Conversation Tone"
            >
              <span className="text-base">{TONES.find(t => t.id === tone)?.icon}</span>
              <span className="hidden sm:inline-block ml-1 whitespace-nowrap">{getStr(sourceLanguage, TONES.find(t => t.id === tone)?.labelKey || 'toneAuto')}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 ml-1 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            
            {isToneMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-gray-950 border border-gray-100 dark:border-gray-800 overflow-hidden z-50 transform origin-top-right transition-all">
                <div className="p-1.5">
                  {TONES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setTone(t.id); setIsToneMenuOpen(false); }}
                      className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold flex items-center space-x-3 transition-colors ${
                        tone === t.id 
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="text-xl">{t.icon}</span>
                      <span>{getStr(sourceLanguage, t.labelKey)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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

            <div className="flex-1 relative flex flex-col min-h-0 w-full">
              <textarea
                ref={textareaRef}
                className="flex-1 w-full text-3xl sm:text-5xl text-gray-800 dark:text-white placeholder-gray-200 dark:placeholder-gray-700 resize-none outline-none bg-transparent py-2 leading-tight font-medium overflow-y-auto pr-10 sm:pr-12"
                placeholder={getStr(sourceLanguage, 'typeHere')}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loadingMode !== false}
              />
              {input.length > 0 && loadingMode === false && (
                <button
                  onClick={() => { setInput(''); textareaRef.current?.focus(); }}
                  className="absolute top-2 right-0 text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 transition-colors bg-white/80 dark:bg-gray-900/80 rounded-full p-1.5 backdrop-blur-sm shadow-sm border border-gray-100 dark:border-gray-800"
                  title="Clear text"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="shrink-0 pt-3 pb-1 flex gap-2 sm:gap-3">
              <input type="file" id="camera-input" accept="image/*" capture="environment" className="hidden" onChange={handleCameraCapture} />
              <button 
                onClick={() => document.getElementById('camera-input')?.click()}
                disabled={loadingMode !== false}
                className="w-16 sm:w-20 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl flex justify-center items-center active:bg-gray-200 dark:active:bg-gray-700 transition-colors disabled:opacity-50 shadow-sm"
                title={getStr(sourceLanguage, 'cameraTranslation')}
              >
                {loadingMode === 'camera' ? (
                  <svg className="animate-spin h-6 w-6 text-gray-700 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 sm:w-8 sm:h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                )}
              </button>
              
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
            
              {/* CURRENT DRAFT TEXT */}
              <div className="mb-6">
                <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{LANGUAGE_DISPLAY_NAMES[draft.sourceLang]}</p>
                <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300">{draft.originalText}</p>
              </div>
              
              <div className="mb-8 border-l-4 border-blue-500 pl-4 py-1 relative group">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest">{LANGUAGE_DISPLAY_NAMES[draft.targetLang]}</p>
                  <button onClick={() => setFullScreenText(draft.translation)} className="text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300 transition-colors opacity-0 group-hover:opacity-100" title="Expand Translation">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
                  </button>
                </div>
                <p className={`text-3xl sm:text-5xl text-blue-900 dark:text-blue-300 font-medium leading-tight ${draft.translation === getStr(sourceLanguage, 'translating') ? 'animate-pulse opacity-70' : ''}`}>
                  {draft.translation}
                </p>
              </div>

              <div className="mb-8 border-l-4 border-emerald-500 pl-4 py-1 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-r-3xl pr-4">
                <div className="flex items-center space-x-2 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-emerald-500 dark:text-emerald-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  <p className="text-sm font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">{getStr(sourceLanguage, 'roundTrip')} ({LANGUAGE_DISPLAY_NAMES[draft.sourceLang]})</p>
                </div>
                <p className={`text-2xl sm:text-3xl text-emerald-900 dark:text-emerald-300 font-medium leading-tight ${draft.roundTrip === getStr(sourceLanguage, 'generatingRoundTrip') ? 'animate-pulse opacity-70' : ''}`}>
                  {draft.roundTrip}
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

                    {isFetchingInitialRewrite && (
                      <div className="mt-4 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-amber-100 dark:border-amber-800 flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-300 animate-pulse">{getStr(sourceLanguage, 'generatingSuggestions')}</span>
                      </div>
                    )}

                    {!isFetchingInitialRewrite && draft.rewriteDirection && draft.rewrittenSource && (
                      <div className={`mt-4 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-amber-100 dark:border-amber-800 transition-opacity duration-300 ${fetchingAlternativeDir ? 'opacity-50 pointer-events-none' : ''}`}>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          {getStr(sourceLanguage, 'suggestedFix')}: {draft.rewriteDirection}
                        </p>
                        <p className="text-lg text-gray-900 dark:text-gray-100 mb-3 font-medium">"{draft.rewrittenSource}"</p>
                        <button 
                          onClick={() => handleUseRewrite(draft.rewrittenSource!)}
                          className="px-4 py-2 bg-blue-600 active:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
                        >
                          {getStr(sourceLanguage, 'useThisVersion')}
                        </button>
                      </div>
                    )}

                    {!isFetchingInitialRewrite && draft.alternativeDirections && draft.alternativeDirections.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">{getStr(sourceLanguage, 'otherWaysToRewrite')}</p>
                        <div className="flex flex-wrap gap-2">
                          {draft.alternativeDirections.map((dir, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleFetchAlternative(dir)}
                              disabled={fetchingAlternativeDir !== null}
                              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-800 dark:text-amber-100 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              {fetchingAlternativeDir === dir ? (
                                <svg className="animate-spin h-3 w-3 inline mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                              ) : null}
                              {dir}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full p-3 sm:p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex space-x-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-none">
              <button 
                onClick={handleDiscard} 
                className="flex-1 py-4 sm:py-5 rounded-2xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors text-base sm:text-lg"
              >
                {getStr(sourceLanguage, 'discard')}
              </button>
              <button 
                onClick={handleApprove} 
                disabled={!draft || draft.roundTrip === getStr(sourceLanguage, 'generatingRoundTrip')}
                className="flex-[2] py-4 sm:py-5 rounded-2xl font-bold text-white bg-blue-600 active:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-colors text-base sm:text-lg disabled:opacity-50 disabled:shadow-none"
              >
                {getStr(sourceLanguage, 'approve')}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* FLASHCARD / FULL-SCREEN MODE MODAL */}
      {fullScreenText && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white dark:bg-gray-900 animate-in fade-in duration-200"
          onClick={() => setFullScreenText(null)}
        >
          <button 
            className="absolute top-6 right-6 p-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors outline-none"
            onClick={() => setFullScreenText(null)}
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div 
            className="max-w-4xl w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-5xl md:text-7xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white break-words">
              {fullScreenText}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
