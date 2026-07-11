'use client';

import { useState, useEffect, useRef } from 'react';

export const useSpeechRecognition = (languageCode: string | undefined) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition || !languageCode) {
      alert('Recunoașterea vocală nu este suportată sau limba este invalidă.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = languageCode; 
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      setTranscript(event.results[0][0].transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  return { isListening, transcript, startListening, setTranscript, isSupported };
};
