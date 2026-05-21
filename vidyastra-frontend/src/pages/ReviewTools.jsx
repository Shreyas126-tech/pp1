import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Search, HelpCircle, Layers, Loader } from 'lucide-react';
import { generateQuiz, generateFlashcards } from '../services/api';

const ReviewTools = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' or 'flashcards'
  const [quizData, setQuizData] = useState([]);
  const [flashcardData, setFlashcardData] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    setLoading(true);
    setQuizData([]);
    setFlashcardData([]);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    
    try {
      if (activeTab === 'quiz') {
        const res = await generateQuiz({ topic, num_questions: 5, level: 'Intermediate' });
        setQuizData(res.data);
      } else {
        const res = await generateFlashcards(topic, 5);
        setFlashcardData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="w-8 h-8 text-saffron-500" />
          AI Review Tools
        </h1>
        <p className="text-gray-400 mt-2">Generate instant quizzes and flashcards from your uploaded documents to test your knowledge.</p>
      </header>

      {/* Control Panel */}
      <div className="glass-card p-6 border border-white/10 flex flex-col md:flex-row gap-6">
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 self-start">
          <button 
            onClick={() => setActiveTab('quiz')}
            className={`px-6 py-2 rounded-lg font-medium transition ${activeTab === 'quiz' ? 'bg-gradient-to-r from-saffron-500 to-primary-600 shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}
          >
            Quizzes
          </button>
          <button 
            onClick={() => setActiveTab('flashcards')}
            className={`px-6 py-2 rounded-lg font-medium transition ${activeTab === 'flashcards' ? 'bg-gradient-to-r from-saffron-500 to-primary-600 shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}
          >
            Flashcards
          </button>
        </div>

        <form onSubmit={handleGenerate} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic to review (e.g., Data Structures, Operating Systems)"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-saffron-500/50 transition"
            />
          </div>
          <button 
            type="submit"
            disabled={loading || !topic.trim()}
            className="px-6 py-3 bg-gradient-to-r from-saffron-500 to-primary-600 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 min-w-[120px] flex justify-center items-center"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Generate'}
          </button>
        </form>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto flex flex-col gap-4">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-4">
            <Loader className="w-10 h-10 animate-spin text-saffron-500" />
            <p>AI is analyzing documents and generating {activeTab}...</p>
          </div>
        )}

        {/* Quiz View */}
        {!loading && activeTab === 'quiz' && quizData.length > 0 && (
          <div className="space-y-6 pb-10">
            {quizData.map((q, idx) => (
              <div key={idx} className="glass-card p-6 border-l-4 border-l-saffron-500">
                <h3 className="text-xl font-semibold mb-4 flex gap-3">
                  <span className="text-saffron-500">{idx + 1}.</span> 
                  {q.question}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {q.options.map((opt, i) => (
                    <button key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 hover:border-saffron-500/50 transition">
                      {opt}
                    </button>
                  ))}
                </div>
                <details className="group cursor-pointer">
                  <summary className="text-sm text-primary-400 font-medium list-none flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" /> Show Answer & Explanation
                  </summary>
                  <div className="mt-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                    <p className="font-bold text-green-400 mb-2">Correct Answer: {q.options[q.correct_answer]}</p>
                    <p className="text-gray-300 text-sm">{q.explanation}</p>
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}

        {/* Flashcards View */}
        {!loading && activeTab === 'flashcards' && flashcardData.length > 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <p className="mb-4 text-gray-400">Card {currentCardIndex + 1} of {flashcardData.length}</p>
            
            <div 
              className="relative w-full max-w-2xl h-80 perspective-1000 cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div 
                className="w-full h-full preserve-3d"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front */}
                <div className="absolute w-full h-full backface-hidden glass-card flex flex-col items-center justify-center p-10 text-center border-t-4 border-t-primary-500" style={{ backfaceVisibility: 'hidden' }}>
                  <Layers className="w-10 h-10 text-primary-500 mb-6 opacity-50" />
                  <h3 className="text-2xl font-bold">{flashcardData[currentCardIndex].front}</h3>
                  <p className="absolute bottom-4 text-sm text-gray-500">Click to flip</p>
                </div>

                {/* Back */}
                <div className="absolute w-full h-full backface-hidden glass-card flex flex-col items-center justify-center p-10 text-center border-t-4 border-t-saffron-500" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  <p className="text-xl text-gray-200">{flashcardData[currentCardIndex].back}</p>
                </div>
              </motion.div>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => { setCurrentCardIndex(prev => Math.max(0, prev - 1)); setIsFlipped(false); }}
                disabled={currentCardIndex === 0}
                className="px-6 py-2 bg-white/10 rounded-full disabled:opacity-30 hover:bg-white/20 transition"
              >
                Previous
              </button>
              <button 
                onClick={() => { setCurrentCardIndex(prev => Math.min(flashcardData.length - 1, prev + 1)); setIsFlipped(false); }}
                disabled={currentCardIndex === flashcardData.length - 1}
                className="px-6 py-2 bg-white/10 rounded-full disabled:opacity-30 hover:bg-white/20 transition"
              >
                Next Card
              </button>
            </div>
          </div>
        )}

        {!loading && !quizData.length && !flashcardData.length && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 border-2 border-dashed border-white/10 rounded-2xl mx-auto w-full max-w-2xl">
            <Layers className="w-16 h-16 mb-4 opacity-50" />
            <p>Enter a topic above to generate study materials.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewTools;
