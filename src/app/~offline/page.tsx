'use client';

import { getStr } from '../i18n';

export default function OfflineFallback() {
  const fallbackLang = 'English';

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
            {getStr(fallbackLang, 'offlineTitle') || 'You are currently offline'}
          </h2>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {getStr(fallbackLang, 'offlineMessage') || 'It looks like you lost your internet connection. In the upcoming updates, your offline chat history and phrasebook will be available right here!'}
          </p>
        </div>
      </div>
      
    </div>
  );
}