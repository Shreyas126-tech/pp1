import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Search, HelpCircle, Layers, Loader, AlertCircle } from 'lucide-react';
import { generateQuiz, generateFlashcards } from '../services/api';

const ReviewTools = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' or 'flashcards'
  const [quizData, setQuizData] = useState([]);
  const [flashcardData, setFlashcardData] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    setLoading(true);
    setError('');
    setQuizData([]);
    setFlashcardData([]);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setSelectedAnswers({});
    
    try {
      if (activeTab === 'quiz') {
        const res = await generateQuiz({ topic, num_questions: 8, level: 'Intermediate', language: 'English' });
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setQuizData(res.data);
        } else {
          setError('AI returned empty quiz. Try a different topic.');
        }
      } else {
        const res = await generateFlashcards(topic, 8, 'English');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setFlashcardData(res.data);
        } else {
          setError('AI returned empty flashcards. Try a different topic.');
        }
      }
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message || 'Failed to generate content.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionIdx, optionIdx) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="w-8 h-8 text-saffron-500" />
          AI Review Tools
        </h1>
        <p className="text-gray-400 mt-2">Generate comprehensive quizzes and flashcards covering A-Z of your topic.</p>
      </header>

      {/* Control Panel */}
      <div className="glass-card p-6 border border-white/10 flex flex-col md:flex-row gap-6">
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 self-start">
          <button 
            onClick={() => { setActiveTab('quiz'); setError(''); }}
            className={`px-6 py-2 rounded-lg font-medium transition ${activeTab === 'quiz' ? 'bg-gradient-to-r from-saffron-500 to-primary-600 shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}
          >
            Quizzes
          </button>
          <button 
            onClick={() => { setActiveTab('flashcards'); setError(''); }}
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
              placeholder="Enter a topic to review deeply (e.g., Data Structures)"
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

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/15 border border-red-500/30 text-red-300 p-4 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-auto flex flex-col gap-4">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-4">
            <Loader className="w-10 h-10 animate-spin text-saffron-500" />
            <p>AI is generating {activeTab}... This may take 15-30 seconds.</p>
          </div>
        )}

        {/* Quiz View */}
        {!loading && activeTab === 'quiz' && quizData.length > 0 && (
          <div className="space-y-6 pb-10">
            {quizData.map((q, idx) => {
              const userAnswer = selectedAnswers[idx];
              const hasAnswered = userAnswer !== undefined;
              const correctIdx = parseInt(q.correct_answer, 10);
              
              return (
                <div key={idx} className="glass-card p-6 border-l-4 border-l-saffron-500">
                  <h3 className="text-xl font-semibold mb-4 flex gap-3">
                    <span className="text-saffron-500">{idx + 1}.</span> 
                    {q.question}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {(q.options || []).map((opt, i) => {
                      let btnClass = 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-saffron-500/50';
                      
                      if (hasAnswered) {
                        if (i === correctIdx) {
                          // Always highlight the correct answer in green after any selection
                          btnClass = 'bg-green-500/20 border-green-500/50 text-green-300';
                        } else if (i === userAnswer && i !== correctIdx) {
                          // Highlight the user's wrong pick in red
                          btnClass = 'bg-red-500/20 border-red-500/50 text-red-300';
                        } else {
                          btnClass = 'bg-white/5 border-white/10 opacity-50';
                        }
                      }
                      
                      return (
                        <button 
                          key={i}
                          onClick={() => handleSelectAnswer(idx, i)}
                          disabled={hasAnswered}
                          className={`p-4 border rounded-xl text-left transition-all ${btnClass} ${hasAnswered ? 'cursor-default' : ''}`}
                        >
                          <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {hasAnswered && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 p-4 bg-white/5 border border-white/10 rounded-xl"
                    >
                      {userAnswer === correctIdx ? (
                        <p className="font-bold text-green-400 mb-2">✓ Correct! Well done.</p>
                      ) : (
                        <p className="font-bold text-red-400 mb-2">✗ Incorrect. The correct answer is: {q.options[correctIdx]}</p>
                      )}
                      {q.explanation && (
                        <p className="text-gray-300 text-sm">{q.explanation}</p>
                      )}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Flashcards View */}
        {!loading && activeTab === 'flashcards' && flashcardData.length > 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <p className="mb-4 text-gray-400">Card {currentCardIndex + 1} of {flashcardData.length}</p>
            
            <div 
              className="relative w-full max-w-2xl h-80 cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
              style={{ perspective: '1000px' }}
            >
              <motion.div 
                className="w-full h-full"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front */}
                <div className="absolute w-full h-full glass-card flex flex-col items-center justify-center p-10 text-center border-t-4 border-t-primary-500" style={{ backfaceVisibility: 'hidden' }}>
                  <Layers className="w-10 h-10 text-primary-500 mb-6 opacity-50" />
                  <h3 className="text-2xl font-bold">{flashcardData[currentCardIndex]?.front}</h3>
                  <p className="absolute bottom-4 text-sm text-gray-500">Click to flip</p>
                </div>

                {/* Back */}
                <div className="absolute w-full h-full glass-card flex flex-col items-center justify-center p-10 text-center border-t-4 border-t-saffron-500" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  <p className="text-xl text-gray-200">{flashcardData[currentCardIndex]?.back}</p>
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

        {!loading && !error && !quizData.length && !flashcardData.length && (
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
