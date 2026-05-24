import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Settings2, BookOpen, Volume2, VolumeX, Loader, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { askQuestion } from '../services/api';

const ChatAssistant = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Namaste! I am VidyAstra AI. Upload a document or ask me a question about your syllabus.', originalContent: null, level: 'intermediate', confidence: 1.0 }
  ]);
  const [input, setInput] = useState('');
  const [level, setLevel] = useState('Intermediate');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInput((prev) => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
    
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.start();
        setIsListening(true);
      }
    }
  };

  const speakText = (text, id) => {
    if (isSpeaking === id) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s*/g, '')
      .replace(/`/g, '')
      .replace(/\[Confidence:.*?\]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langCode = 'en-US';
    utterance.lang = langCode;
    
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = langCode.split('-')[0];
    const matchingVoice = voices.find(v => v.lang === langCode) || voices.find(v => v.lang.startsWith(langPrefix));
    if (matchingVoice) utterance.voice = matchingVoice;
    
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(id);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userText = input;
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await askQuestion({
        message: userText,
        session_id: sessionId,
        level: level,
        language: 'English',
      });

      if (!sessionId) {
        setSessionId(res.data.session_id);
      }

      setMessages([
        ...newMessages,
        {
          role: 'ai',
          content: res.data.reply,
          originalContent: null,
          confidence: res.data.confidence_score,
          citations: res.data.citations,
        }
      ]);
      
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message || 'Unknown error';
      setMessages([
        ...newMessages,
        { role: 'ai', content: `Error: ${detail}\n\nPlease make sure Ollama is running and try again.` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <header className="p-4 sm:p-6 border-b border-white/10 flex justify-between items-center bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-saffron-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-saffron-400">
              VidyAstra AI Tutor
            </h1>
            <p className="text-xs text-gray-400">Your personal document assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-saffron-500" />
            <select 
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="bg-transparent border-none text-sm font-medium focus:outline-none"
            >
              <option className="bg-background-dark text-white">Beginner</option>
              <option className="bg-background-dark text-white">Intermediate</option>
              <option className="bg-background-dark text-white">Expert</option>
            </select>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-full transition">
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 glass-card p-4 overflow-y-auto mb-4 flex flex-col gap-4">
        {messages.map((msg, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={idx} 
            className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
          >
            <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-gradient-to-r from-saffron-500 to-primary-600 text-white rounded-br-none' : 'bg-white/10 border border-white/10 rounded-bl-none'}`}>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
            
            {msg.role === 'ai' && (
              <div className="flex items-center flex-wrap gap-3 mt-2 px-2 text-xs text-gray-400">
                {msg.confidence && (
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${msg.confidence > 0.8 ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    Confidence: {(msg.confidence * 100).toFixed(0)}%
                  </span>
                )}
                
                {msg.citations && msg.citations.length > 0 && msg.citations.map((cite, i) => (
                  <span key={i} className="bg-white/5 px-2 py-1 rounded border border-white/10">
                    {cite.source} (Pg {cite.page})
                  </span>
                ))}
                
                <button 
                  onClick={() => speakText(msg.content, idx)}
                  className="hover:text-white transition flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/10"
                >
                  {isSpeaking === idx ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  {isSpeaking === idx ? 'Stop' : 'Listen'}
                </button>
              </div>
            )}
          </motion.div>
        ))}
        
        {loading && (
          <div className="self-start items-start flex gap-2 text-gray-400 p-4">
             <Loader className="w-5 h-5 animate-spin text-saffron-500" />
             <span className="text-sm">VidyAstra is generating a response... (may take 10-20s)</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="glass p-2 rounded-full flex items-center border border-white/10 relative overflow-hidden">
        {isListening && (
          <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />
        )}
        <button 
          type="button" 
          onClick={toggleListening}
          className={`p-3 transition rounded-full hover:bg-white/10 z-10 ${isListening ? 'text-red-500 bg-red-500/20' : 'text-gray-400 hover:text-white'}`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder={loading ? "AI is typing..." : isListening ? "Listening..." : "Ask VidyAstra AI anything about your studies..."}
          className="flex-1 bg-transparent border-none px-4 focus:outline-none disabled:opacity-50 z-10"
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          className="p-3 bg-gradient-to-r from-saffron-500 to-primary-600 rounded-full hover:opacity-90 transition disabled:opacity-50 z-10"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatAssistant;
