import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Activity, BookOpen, AlertCircle, Trash2, Sparkles, X, Loader, Headphones, Briefcase, Brain, Play, Pause, Volume2 } from 'lucide-react';
import { uploadDocument, listDocuments, deleteDocument, simplifyDocument, generatePodcast, generateCareerMapping, generateFlashcards } from '../services/api';
import useAuthStore from '../store/authStore';
import ActionToolbar from '../components/ActionToolbar';

const Dashboard = () => {
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  
  // Loading states
  const [simplifying, setSimplifying] = useState(null);
  const [podcasting, setPodcasting] = useState(null);
  const [careering, setCareering] = useState(null);
  const [flashing, setFlashing] = useState(null);

  // Result Modals
  const [simplifiedResult, setSimplifiedResult] = useState(null);
  const [podcastResult, setPodcastResult] = useState(null);
  const [careerResult, setCareerResult] = useState(null);
  const [flashcardResult, setFlashcardResult] = useState(null);

  // Podcast playback
  const [playingPodcast, setPlayingPodcast] = useState(false);
  const [currentLineIdx, setCurrentLineIdx] = useState(-1);

  const fileInputRef = useRef(null);
  const user = useAuthStore(s => s.user);

  const fetchDocuments = async () => {
    try {
      const res = await listDocuments();
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await uploadDocument(file);
      await fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload document.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDocument(id);
      await fetchDocuments();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const handleSimplify = async (doc) => {
    setSimplifying(doc.id);
    setError('');
    try {
      const res = await simplifyDocument(doc.id);
      setSimplifiedResult({ docName: doc.filename, summary: res.data.summary, translatedSummary: null });
    } catch (err) {
      setError('Failed to simplify document.');
    } finally {
      setSimplifying(null);
    }
  };

  const handlePodcast = async (doc) => {
    setPodcasting(doc.id);
    setError('');
    try {
      const res = await generatePodcast(doc.filename);
      setPodcastResult({ docName: doc.filename, script: res.data.script });
    } catch (err) {
      setError('Failed to generate podcast.');
    } finally {
      setPodcasting(null);
    }
  };

  const handleCareers = async (doc) => {
    setCareering(doc.id);
    setError('');
    try {
      const res = await generateCareerMapping(doc.filename);
      setCareerResult({ docName: doc.filename, mapping: res.data.mapping, translatedMapping: null });
    } catch (err) {
      setError('Failed to generate career map.');
    } finally {
      setCareering(null);
    }
  };

  const handleFlashcards = async (doc) => {
    setFlashing(doc.id);
    setError('');
    try {
      const res = await generateFlashcards(doc.filename, 8, 'English');
      // res.data is the array of flashcard items
      const cards = Array.isArray(res.data) ? res.data : [];
      if (cards.length === 0) {
        setError('No flashcards generated. Try a different document.');
      } else {
        setFlashcardResult({ docName: doc.filename, cards });
      }
    } catch (err) {
      setError('Failed to generate flashcards.');
    } finally {
      setFlashing(null);
    }
  };

  // Dual-voice Podcast Playback
  const playPodcast = () => {
    if (!podcastResult?.script) return;
    if (playingPodcast) {
      window.speechSynthesis.cancel();
      setPlayingPodcast(false);
      setCurrentLineIdx(-1);
      return;
    }

    setPlayingPodcast(true);
    const voices = window.speechSynthesis.getVoices();
    let i = 0;
    
    const playNext = () => {
      if (i >= podcastResult.script.length) {
        setPlayingPodcast(false);
        setCurrentLineIdx(-1);
        return;
      }
      setCurrentLineIdx(i);
      const line = podcastResult.script[i];
      const utterance = new SpeechSynthesisUtterance(line.text);
      utterance.rate = 1.05;

      if (voices.length > 1) {
        const maleVoices = voices.filter(v => v.name.includes('Male') || v.name.includes('David') || v.name.includes('Mark'));
        const femaleVoices = voices.filter(v => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha'));
        if (line.speaker === 'Host') {
          utterance.voice = femaleVoices[0] || voices[0];
        } else {
          utterance.voice = maleVoices[0] || voices[Math.min(1, voices.length - 1)];
        }
      }

      utterance.onend = () => { i++; playNext(); };
      utterance.onerror = () => { setPlayingPodcast(false); setCurrentLineIdx(-1); };
      window.speechSynthesis.speak(utterance);
    };

    playNext();
  };

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  const isAnyLoading = simplifying || podcasting || careering || flashing;

  return (
    <div className="flex flex-col gap-6">
      <header className="mb-4">
        <h1 className="text-3xl font-bold">Welcome back, {user?.full_name || 'Student'}!</h1>
        <p className="text-gray-400">Your AI-powered study dashboard.</p>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Documents Analyzed" value={documents.length.toString()} icon={<FileText className="w-6 h-6 text-saffron-500" />} />
        <StatCard title="Study Hours" value="34h" icon={<Activity className="w-6 h-6 text-primary-500" />} />
        <StatCard title="Weak Topics" value="2" icon={<AlertCircle className="w-6 h-6 text-red-500" />} alert />
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/40 text-red-300 p-3 rounded-xl text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[200px] border-dashed border-2 border-white/20 transition-all hover:border-saffron-500/50">
            <Upload className="w-10 h-10 text-gray-400 mb-3" />
            <h2 className="text-lg font-bold mb-1">Upload Study Material</h2>
            <p className="text-gray-400 text-sm mb-4 text-center">PDF, TXT, DOCX</p>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt,.md,.doc,.docx" />
            <button
              className="px-6 py-2 rounded-full bg-gradient-to-r from-saffron-500 to-primary-600 font-medium hover:opacity-90 transition disabled:opacity-50"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Processing AI...' : 'Select Files'}
            </button>
          </div>

          {documents.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-4">Your Documents</h2>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <motion.div key={doc.id} layout className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-saffron-500" />
                        <span className="font-medium">{doc.filename}</span>
                      </div>
                      <button onClick={() => handleDelete(doc.id)} className="text-gray-400 hover:text-red-400 transition p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <ActionBtn icon={<Sparkles className="w-4 h-4"/>} text="Simplify" loading={simplifying === doc.id} onClick={() => handleSimplify(doc)} disabled={isAnyLoading} />
                      <ActionBtn icon={<Headphones className="w-4 h-4 text-blue-400"/>} text="Podcast" loading={podcasting === doc.id} onClick={() => handlePodcast(doc)} disabled={isAnyLoading} />
                      <ActionBtn icon={<Briefcase className="w-4 h-4 text-emerald-400"/>} text="Careers" loading={careering === doc.id} onClick={() => handleCareers(doc)} disabled={isAnyLoading} />
                      <ActionBtn icon={<Brain className="w-4 h-4 text-purple-400"/>} text="Flashcards" loading={flashing === doc.id} onClick={() => handleFlashcards(doc)} disabled={isAnyLoading} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {/* Simplify Modal - Dual Column */}
        {simplifiedResult && (
          <ModalWrapper onClose={() => setSimplifiedResult(null)} title="Simplified Summary" icon={<Sparkles className="w-6 h-6 text-saffron-500"/>} fullWidth>
            <DualColumnView
              originalText={simplifiedResult.summary}
              translatedText={simplifiedResult.translatedSummary}
              onTranslated={(t) => setSimplifiedResult({ ...simplifiedResult, translatedSummary: t })}
            />
          </ModalWrapper>
        )}

        {/* Podcast Modal */}
        {podcastResult && (
          <ModalWrapper onClose={() => { setPodcastResult(null); window.speechSynthesis.cancel(); setPlayingPodcast(false); }} title="AI Podcast" icon={<Headphones className="w-6 h-6 text-blue-400"/>}>
            <button
              onClick={playPodcast}
              className="w-full flex justify-center items-center gap-2 py-4 mb-6 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 transition shadow-lg shadow-blue-500/20"
            >
              {playingPodcast ? <Pause className="w-5 h-5"/> : <Play className="w-5 h-5"/>}
              {playingPodcast ? 'Stop Playing' : 'Play Podcast (Dual Voice)'}
            </button>
            <div className="space-y-4">
              {podcastResult.script?.map((line, idx) => (
                <div key={idx} className={`flex flex-col ${line.speaker === 'Host' ? 'items-start' : 'items-end'}`}>
                  <span className={`text-xs font-bold mb-1 ${line.speaker === 'Host' ? 'text-blue-400' : 'text-emerald-400'}`}>{line.speaker}</span>
                  <div className={`p-4 rounded-2xl max-w-[85%] ${currentLineIdx === idx ? 'ring-2 ring-saffron-500 bg-white/15' : 'bg-white/5'} border border-white/10 text-sm`}>
                    {line.text}
                  </div>
                </div>
              ))}
            </div>
          </ModalWrapper>
        )}

        {/* Career Modal - Dual Column */}
        {careerResult && (
          <ModalWrapper onClose={() => setCareerResult(null)} title="Career Applicator" icon={<Briefcase className="w-6 h-6 text-emerald-400"/>} fullWidth>
            <DualColumnView
              originalText={careerResult.mapping}
              translatedText={careerResult.translatedMapping}
              onTranslated={(t) => setCareerResult({ ...careerResult, translatedMapping: t })}
            />
          </ModalWrapper>
        )}

        {/* Flashcards Modal */}
        {flashcardResult && (
          <ModalWrapper onClose={() => setFlashcardResult(null)} title="Document Flashcards" icon={<Brain className="w-6 h-6 text-purple-400"/>} fullWidth>
            <DualColumnFlashcards cards={flashcardResult.cards} />
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Dual Column View for Original + Translation ──
const DualColumnView = ({ originalText, translatedText, onTranslated }) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div className="bg-white/5 p-5 rounded-xl border border-white/10 flex flex-col">
          <h3 className="text-sm font-bold text-saffron-500 mb-3 uppercase tracking-wider">Original English</h3>
          <div className="whitespace-pre-wrap text-gray-200 leading-relaxed overflow-y-auto max-h-[55vh] text-sm">
            {originalText}
          </div>
        </div>
        <div className="bg-white/5 p-5 rounded-xl border border-white/10 flex flex-col">
          <h3 className="text-sm font-bold text-primary-400 mb-3 uppercase tracking-wider">Translation</h3>
          <div className="whitespace-pre-wrap text-gray-200 leading-relaxed overflow-y-auto max-h-[55vh] text-sm">
            {translatedText || <span className="text-gray-500 italic">Select a language below to translate...</span>}
          </div>
        </div>
      </div>
      <ActionToolbar
        originalText={originalText}
        translatedText={translatedText}
        onTranslated={(t) => onTranslated(t)}
      />
    </>
  );
};

// ── Dual Column Flashcards ──
const DualColumnFlashcards = ({ cards }) => {
  const [translatedCards, setTranslatedCards] = useState(null);
  
  // Use numbered delimiters that won't get mangled by translation
  const originalText = cards.map((c, i) => `[Q${i+1}] ${c.front}\n[A${i+1}] ${c.back}`).join('\n---\n');
  const translatedText = translatedCards ? translatedCards.map((c, i) => `[Q${i+1}] ${c.front}\n[A${i+1}] ${c.back}`).join('\n---\n') : '';

  const handleTranslated = (t) => {
    if (!t) {
      setTranslatedCards(null);
      return;
    }
    // Parse translated text back into cards using the numbered markers
    try {
      const newCards = [];
      for (let i = 0; i < cards.length; i++) {
        const qTag = `[Q${i+1}]`;
        const aTag = `[A${i+1}]`;
        const qIdx = t.indexOf(qTag);
        const aIdx = t.indexOf(aTag);
        
        if (qIdx !== -1 && aIdx !== -1) {
          const front = t.substring(qIdx + qTag.length, aIdx).replace(/\n/g, ' ').trim();
          // Find the end: either the next Q tag or the next --- or end of string
          const nextQTag = `[Q${i+2}]`;
          const nextQIdx = t.indexOf(nextQTag, aIdx);
          const endIdx = nextQIdx !== -1 ? t.lastIndexOf('---', nextQIdx) : t.length;
          const back = t.substring(aIdx + aTag.length, endIdx !== -1 ? endIdx : t.length).replace(/\n/g, ' ').replace(/---/g, '').trim();
          newCards.push({ front, back });
        }
      }
      if (newCards.length > 0) {
        setTranslatedCards(newCards);
      } else {
        // Fallback: just show the raw translated text as a single card
        setTranslatedCards([{ front: 'Translated Content', back: t }]);
      }
    } catch {
      setTranslatedCards([{ front: 'Translated Content', back: t }]);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div className="bg-white/5 p-5 rounded-xl border border-white/10 flex flex-col">
          <h3 className="text-sm font-bold text-saffron-500 mb-3 uppercase tracking-wider">Original English</h3>
          <div className="space-y-4 overflow-y-auto max-h-[55vh]">
            {cards.map((card, idx) => (
              <FlashcardView key={idx} card={card} index={idx} />
            ))}
          </div>
        </div>
        <div className="bg-white/5 p-5 rounded-xl border border-white/10 flex flex-col">
          <h3 className="text-sm font-bold text-primary-400 mb-3 uppercase tracking-wider">Translation</h3>
          <div className="space-y-4 overflow-y-auto max-h-[55vh]">
            {translatedCards ? (
              translatedCards.map((card, idx) => (
                <FlashcardView key={idx} card={card} index={idx} />
              ))
            ) : (
              <span className="text-gray-500 italic text-sm">Select a language below to translate...</span>
            )}
          </div>
        </div>
      </div>
      <ActionToolbar
        originalText={originalText}
        translatedText={translatedText}
        onTranslated={handleTranslated}
      />
    </>
  );
};

// ── Flashcard with flip ──
const FlashcardView = ({ card, index }) => {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      onClick={() => setFlipped(!flipped)}
      className="bg-white/5 p-5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition min-h-[120px] flex flex-col justify-center"
    >
      <div className="text-xs text-gray-500 mb-2">{flipped ? 'Answer' : `Card ${index + 1} - Click to flip`}</div>
      <div className={`text-sm ${flipped ? 'text-gray-200' : 'text-saffron-400 font-semibold'}`}>
        {flipped ? card.back : card.front}
      </div>
    </div>
  );
};

const ActionBtn = ({ icon, text, loading, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition disabled:opacity-40"
  >
    {loading ? <Loader className="w-4 h-4 animate-spin" /> : icon}
    {loading ? '...' : text}
  </button>
);

const StatCard = ({ title, value, icon, alert }) => (
  <motion.div whileHover={{ y: -5 }} className={`glass-card p-6 flex items-center gap-4 ${alert ? 'border-red-500/30' : ''}`}>
    <div className="bg-white/10 p-3 rounded-xl">{icon}</div>
    <div>
      <p className="text-gray-400 text-sm">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  </motion.div>
);

const ModalWrapper = ({ children, onClose, title, icon, fullWidth }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`glass-card p-6 md:p-8 ${fullWidth ? 'max-w-5xl' : 'max-w-2xl'} w-full max-h-[90vh] overflow-y-auto`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl">{icon}</div>
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X className="w-5 h-5" /></button>
      </div>
      {children}
    </motion.div>
  </motion.div>
);

export default Dashboard;
