'use client';

import { useState, useEffect } from 'react';
import { getStr } from '../i18n';

export default function OfflineFallback() {
  const [lang, setLang] = useState('English');

  useEffect(() => {
    setLang(localStorage.getItem('unlost_lang') || 'English');
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[100dvh] font-sans overflow-hidden transition-colors duration-300 bg-white text-gray-900 dark:bg-gray-900 dark:text-white p-4">
      
      <div className="flex flex-col items-center max-w-md w-full">
        <h1 className="text-2xl font-bold mb-8 text-blue-600 dark:text-blue-500 flex items-center space-x-2">
          <span>🌍</span>
          <span>Unlost in Translation</span>
        </h1>
        
        <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <div className="text-4xl mb-4">📡</div>
          
          <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
            {getStr(lang, 'offlineTitle')}
          </h2>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {getStr(lang, 'offlineMessage')}
          </p>
        </div>
      </div>
      
    </div>
  );
}