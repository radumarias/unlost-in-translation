export const playAudio = (text: string, language = 'en-US') => {
  if (!('speechSynthesis' in window)) {
    alert('Browser-ul tău nu suportă citirea textului.');
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language; 
  utterance.pitch = 1;
  utterance.rate = 1;

  window.speechSynthesis.speak(utterance);
};
