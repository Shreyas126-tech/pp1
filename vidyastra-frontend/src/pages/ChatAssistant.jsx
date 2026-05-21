import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Settings2, BookOpen, Volume2, VolumeX, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { askQuestion } from '../services/api';

const ChatAssistant = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Namaste! I am VidyAstra AI. Upload a document or ask me a question about your syllabus.', level: 'intermediate', confidence: 1.0 }
  ]);
  const [input, setInput] = useState('');
  const [level, setLevel] = useState('Intermediate');
  const [language, setLanguage] = useState('English');
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
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setInput((prev) => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      // Set language for recognition based on selected language
      const langMap = {
        'English': 'en-IN',
        'Hindi': 'hi-IN',
        'Kannada': 'kn-IN',
        'Tamil': 'ta-IN',
        'Telugu': 'te-IN',
        'Malayalam': 'ml-IN'
      };
      if (recognitionRef.current) {
        recognitionRef.current.lang = langMap[language] || 'en-IN';
        recognitionRef.current.start();
        setIsListening(true);
      }
    }
  };

  const speakText = (text) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to set voice based on language
    const langMap = {
      'English': 'en-IN',
      'Hindi': 'hi-IN',
      'Kannada': 'kn-IN',
      'Tamil': 'ta-IN',
      'Telugu': 'te-IN',
      'Malayalam': 'ml-IN'
    };
    utterance.lang = langMap[language] || 'en-IN';
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
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
        language: language,
      });

      if (!sessionId) {
        setSessionId(res.data.session_id);
      }

      setMessages([
        ...newMessages,
        {
          role: 'ai',
          content: res.data.reply,
          confidence: res.data.confidence_score,
          citations: res.data.citations,
        }
      ]);
      
      // Auto-speak if configured
      // speakText(res.data.reply);
      
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        { role: 'ai', content: 'Sorry, I encountered an error while processing your request.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar for Settings */}
      <div className="glass px-4 py-3 rounded-2xl mb-4 flex flex-wrap justify-between items-center gap-4 border border-white/10">
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
          
          <div className="h-6 w-px bg-white/20"></div>

          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent border-none text-sm font-medium focus:outline-none"
          >
            <option className="bg-background-dark text-white">English</option>
            <option className="bg-background-dark text-white">Hindi</option>
            <option className="bg-background-dark text-white">Kannada</option>
            <option className="bg-background-dark text-white">Tamil</option>
            <option className="bg-background-dark text-white">Telugu</option>
            <option className="bg-background-dark text-white">Malayalam</option>
          </select>
        </div>
        
        <button className="p-2 hover:bg-white/10 rounded-full transition">
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

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
                  <span key={i} className="bg-white/5 px-2 py-1 rounded border border-white/10 hover:bg-white/10 cursor-pointer transition">
                    📄 {cite.source} (Pg {cite.page})
                  </span>
                ))}
                
                <button 
                  onClick={() => speakText(msg.content)}
                  className="hover:text-white transition flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/10"
                >
                  {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  {isSpeaking ? 'Stop' : 'Listen'}
                </button>
              </div>
            )}
          </motion.div>
        ))}
        
        {loading && (
          <div className="self-start items-start flex gap-2 text-gray-400 p-4">
             <Loader className="w-5 h-5 animate-spin text-saffron-500" />
             <span className="text-sm">VidyAstra is thinking...</span>
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
