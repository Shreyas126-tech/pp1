import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Languages, Loader } from 'lucide-react';
import { translateText } from '../services/api';

const LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'fr-FR', label: 'French' },
];

const ActionToolbar = ({ originalText, translatedText, onTranslated }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [voices, setVoices] = useState([]);

  // Preload voices on mount (Chrome loads them async)
  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setVoices(v);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const findBestVoice = useCallback((langCode) => {
    if (voices.length === 0) return null;
    const langPrefix = langCode.split('-')[0];
    // Try exact match first
    let voice = voices.find(v => v.lang === langCode);
    if (voice) return voice;
    // Try partial match (e.g., "hi" matches "hi-IN")
    voice = voices.find(v => v.lang.startsWith(langPrefix));
    if (voice) return voice;
    // Try any voice containing the language code
    voice = voices.find(v => v.lang.toLowerCase().includes(langPrefix.toLowerCase()));
    return voice || null;
  }, [voices]);

  const handleSpeak = useCallback((textToSpeak, langCodeToUse, id) => {
    if (isSpeaking === id) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    if (!textToSpeak) return;

    // Clean any remaining markdown symbols
    const clean = textToSpeak
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s*/g, '')
      .replace(/`/g, '')
      .replace(/_/g, '')
      .replace(/~~/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = langCodeToUse;
    utterance.rate = 0.95;

    const bestVoice = findBestVoice(langCodeToUse);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(id);
  }, [findBestVoice, isSpeaking]);

  const handleLanguageChange = async (e) => {
    const langCode = e.target.value;
    setSelectedLang(langCode);

    // If English, signal parent to clear translation
    if (langCode === 'en-US') {
      if (onTranslated) onTranslated(null);
      return;
    }

    const langLabel = LANGUAGES.find(l => l.code === langCode)?.label || 'English';
    setTranslating(true);
    try {
      const res = await translateText(originalText, langLabel);
      if (res.data?.translated_text && onTranslated) {
        onTranslated(res.data.translated_text);
      }
    } catch (err) {
      console.error('Translation failed:', err);
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl mt-4 w-full justify-between flex-wrap">
      <div className="flex items-center gap-2">
        <Languages className="w-4 h-4 text-gray-400" />
        <select
          value={selectedLang}
          onChange={handleLanguageChange}
          disabled={translating}
          className="bg-transparent text-sm text-gray-300 focus:outline-none cursor-pointer"
        >
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code} className="bg-gray-900">{l.label}</option>
          ))}
        </select>
        {translating && <Loader className="w-3 h-3 animate-spin text-saffron-500" />}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleSpeak(originalText, 'en-US', 'original')}
          disabled={translating}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            isSpeaking === 'original'
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'
          }`}
        >
          {isSpeaking === 'original' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          {isSpeaking === 'original' ? 'Stop' : 'Listen (EN)'}
        </button>

        {translatedText && selectedLang !== 'en-US' && (
          <button
            onClick={() => handleSpeak(translatedText, selectedLang, 'translated')}
            disabled={translating}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              isSpeaking === 'translated'
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-saffron-500/20 text-saffron-400 hover:bg-saffron-500/30'
            }`}
          >
            {isSpeaking === 'translated' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {isSpeaking === 'translated' ? 'Stop' : 'Listen (Translation)'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ActionToolbar;
