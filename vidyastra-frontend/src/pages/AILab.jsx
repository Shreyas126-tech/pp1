import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, MapPin, CalendarDays, Loader, X, Lightbulb, PenTool, Users, SearchCode, AlertCircle, Music, BookOpen, Laugh, Briefcase, GraduationCap } from 'lucide-react';
import { explainLike, generateMindMap, generateStudyPlan, draftProfessional, simulateInterview, reviewLogic } from '../services/api';
import ActionToolbar from '../components/ActionToolbar';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif'
});

const Mermaid = ({ chart }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && chart) {
      const renderChart = async () => {
        try {
          const id = `mermaid-svg-${Math.round(Math.random() * 100000)}`;
          const { svg } = await mermaid.render(id, chart);
          if (ref.current) {
            ref.current.innerHTML = svg;
          }
        } catch (e) {
          console.error("Mermaid parsing error", e);
          if (ref.current) {
            ref.current.innerHTML = `<p class="text-red-400">Error rendering diagram. The AI output might not be perfectly formatted.</p><pre class="text-xs text-gray-500 mt-2">${chart}</pre>`;
          }
        }
      };
      renderChart();
    }
  }, [chart]);

  return <div ref={ref} className="flex justify-center w-full overflow-x-auto p-4" />;
};

const MindMapView = ({ data }) => {
  if (!data) return <p className="text-gray-400">Invalid mind map data.</p>;
  return (
    <div className="w-full bg-gray-900/50 rounded-xl border border-white/10">
      <Mermaid chart={data} />
    </div>
  );
};

const EXPLAIN_MODES = [
  { id: '5-year-old', label: 'Like I\'m 5', icon: <Lightbulb className="w-5 h-5" />, color: 'from-yellow-500 to-orange-500' },
  { id: 'teacher', label: 'Like a Teacher', icon: <GraduationCap className="w-5 h-5" />, color: 'from-blue-500 to-cyan-500' },
  { id: 'storyteller', label: 'As a Story', icon: <BookOpen className="w-5 h-5" />, color: 'from-purple-500 to-pink-500' },
  { id: 'meme-lord', label: 'Meme Style', icon: <Laugh className="w-5 h-5" />, color: 'from-green-500 to-emerald-500' },
  { id: 'interviewer', label: 'Interview Prep', icon: <Briefcase className="w-5 h-5" />, color: 'from-red-500 to-rose-500' },
  { id: 'poet', label: 'As a Poem', icon: <Music className="w-5 h-5" />, color: 'from-indigo-500 to-violet-500' },
];

const TABS = [
  { id: 'explain', label: 'Explain Concept', icon: <Lightbulb className="w-4 h-4" /> },
  { id: 'mindmap', label: 'Mind Map', icon: <MapPin className="w-4 h-4" /> },
  { id: 'studyplan', label: 'Study Planner', icon: <CalendarDays className="w-4 h-4" /> },
  { id: 'draft', label: 'Professional Drafter', icon: <PenTool className="w-4 h-4" /> },
  { id: 'interview', label: 'Interview Sim', icon: <Users className="w-4 h-4" /> },
  { id: 'review', label: 'Logic & Code Review', icon: <SearchCode className="w-4 h-4" /> },
];

const AILab = () => {
  const [activeTab, setActiveTab] = useState('explain');
  const [input, setInput] = useState('');
  const [selectedMode, setSelectedMode] = useState('teacher');
  const [days, setDays] = useState(7);
  const [formatType, setFormatType] = useState('email');
  
  const [loading, setLoading] = useState(false);
  const [originalResult, setOriginalResult] = useState(null);
  const [translatedResult, setTranslatedResult] = useState(null);
  const [resultType, setResultType] = useState(null);
  const [error, setError] = useState('');

  const handleAction = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setOriginalResult(null);
    setTranslatedResult(null);
    setError('');
    try {
      let text = null;
      if (activeTab === 'explain') {
        const res = await explainLike(input, selectedMode);
        text = res.data.explanation;
      } else if (activeTab === 'mindmap') {
        const res = await generateMindMap(input);
        text = res.data.mermaid; // mermaid string for diagram
      } else if (activeTab === 'studyplan') {
        const res = await generateStudyPlan(input, days);
        text = res.data.plan;
      } else if (activeTab === 'draft') {
        const res = await draftProfessional(input, formatType);
        text = res.data.draft;
      } else if (activeTab === 'interview') {
        const res = await simulateInterview(input);
        text = res.data.simulation;
      } else if (activeTab === 'review') {
        const res = await reviewLogic(input);
        text = res.data.review;
      }
      setOriginalResult(text);
      setResultType(activeTab);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to generate content.');
      setResultType('error');
    }
    setLoading(false);
  };

  const getPlaceholder = () => {
    switch (activeTab) {
      case 'explain': return 'Paste any complex text, concept, or paragraph here...';
      case 'mindmap': return 'e.g., Machine Learning, Photosynthesis...';
      case 'studyplan': return 'e.g., Data Structures and Algorithms...';
      case 'draft': return 'Enter context (e.g., Applying for Senior Dev role)...';
      case 'interview': return 'Enter job role (e.g., React Developer)...';
      case 'review': return 'Paste your code or proof here for review...';
      default: return '';
    }
  };

  const getResultIcon = () => {
    switch (resultType) {
      case 'mindmap': return <MapPin className="w-5 h-5 text-saffron-500" />;
      case 'studyplan': return <CalendarDays className="w-5 h-5 text-saffron-500" />;
      case 'draft': return <PenTool className="w-5 h-5 text-saffron-500" />;
      case 'interview': return <Users className="w-5 h-5 text-saffron-500" />;
      case 'review': return <SearchCode className="w-5 h-5 text-saffron-500" />;
      default: return <Lightbulb className="w-5 h-5 text-saffron-500" />;
    }
  };

  const getResultTitle = () => {
    switch (resultType) {
      case 'mindmap': return 'Mind Map';
      case 'studyplan': return 'Study Plan';
      case 'draft': return 'Professional Draft';
      case 'interview': return 'Mock Interview Simulator';
      case 'review': return 'Expert Logic Review';
      default: return 'AI Explanation';
    }
  };

  const handleTranslated = (newText) => {
    setTranslatedResult(newText);
  };

  const clearResults = () => {
    setOriginalResult(null);
    setTranslatedResult(null);
  };

  const isTextResult = resultType !== 'mindmap';

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <header className="mb-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-saffron-500" />
          AI Lab
          <span className="text-xs bg-gradient-to-r from-saffron-500 to-primary-600 text-white px-2 py-0.5 rounded-full font-normal ml-2">Exclusive</span>
        </h1>
        <p className="text-gray-400">Professional real-world tools and educational utilities.</p>
      </header>

      {/* Tab Buttons */}
      <div className="flex gap-3 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); clearResults(); setError(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-saffron-500 to-primary-600 text-white shadow-lg shadow-saffron-500/20'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Input Section */}
      <div className="glass-card p-6 space-y-4">
        <label className="text-sm text-gray-400">Input context for {TABS.find(t => t.id === activeTab)?.label}:</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={['explain', 'review', 'draft'].includes(activeTab) ? 5 : 2}
          placeholder={getPlaceholder()}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-saffron-500 resize-none"
        />

        {activeTab === 'explain' && (
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Choose explanation style:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EXPLAIN_MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    selectedMode === mode.id
                      ? `bg-gradient-to-r ${mode.color} text-white shadow-lg`
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {mode.icon} {mode.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'studyplan' && (
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-400">Duration:</label>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-saffron-500">
              <option value={3}>3 Days (Quick)</option>
              <option value={7}>7 Days (Standard)</option>
              <option value={14}>14 Days (Deep Dive)</option>
              <option value={30}>30 Days (Mastery)</option>
            </select>
          </div>
        )}

        {activeTab === 'draft' && (
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-400">Format:</label>
            <select value={formatType} onChange={(e) => setFormatType(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-saffron-500">
              <option value="email">Professional Email</option>
              <option value="cover letter">Cover Letter</option>
              <option value="report summary">Report Summary</option>
            </select>
          </div>
        )}

        <button
          onClick={handleAction}
          disabled={loading || !input.trim()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-saffron-500 to-primary-600 font-bold text-white hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/15 border border-red-500/30 text-red-300 p-4 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-4">
          <Loader className="w-10 h-10 animate-spin text-saffron-500" />
          <p>AI is generating your content... This may take 15-30 seconds.</p>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {originalResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {getResultIcon()}
                {getResultTitle()}
              </h2>
              <button onClick={clearResults} className="p-2 hover:bg-white/10 rounded-full transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {resultType === 'mindmap' ? (
              <MindMapView data={originalResult} />
            ) : (
              <>
                {/* Dual Column for text results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div className="bg-white/5 p-5 rounded-xl border border-white/10 flex flex-col">
                    <h3 className="text-sm font-bold text-saffron-500 mb-3 uppercase tracking-wider">Original English</h3>
                    <div className="whitespace-pre-wrap text-gray-200 leading-relaxed overflow-y-auto max-h-[50vh] text-sm">
                      {typeof originalResult === 'string' ? originalResult : JSON.stringify(originalResult, null, 2)}
                    </div>
                  </div>
                  <div className="bg-white/5 p-5 rounded-xl border border-white/10 flex flex-col">
                    <h3 className="text-sm font-bold text-primary-400 mb-3 uppercase tracking-wider">Translation</h3>
                    <div className="whitespace-pre-wrap text-gray-200 leading-relaxed overflow-y-auto max-h-[50vh] text-sm">
                      {translatedResult || <span className="text-gray-500 italic">Select a language below to translate...</span>}
                    </div>
                  </div>
                </div>

                {activeTab !== 'mindmap' && (
                  <ActionToolbar
                    originalText={typeof originalResult === 'string' ? originalResult : ''}
                    translatedText={translatedResult}
                    onTranslated={handleTranslated}
                  />
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Replaced by Mermaid map at top

export default AILab;
