import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Brain, BookOpen, Mic } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background-dark text-white">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-saffron-500/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-600/20 blur-[150px]" />
      
      {/* Navigation */}
      <nav className="w-full flex justify-between items-center p-6 lg:px-20 z-10 glass-card mx-auto mt-4 max-w-7xl">
        <div className="flex items-center gap-2">
          <Brain className="w-8 h-8 text-saffron-500" />
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
            VidyAstra AI
          </span>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-6 py-2 rounded-full font-medium transition hover:bg-white/10">
            Login
          </Link>
          <Link to="/dashboard" className="px-6 py-2 rounded-full font-medium bg-gradient-to-r from-saffron-500 to-primary-600 hover:opacity-90 transition">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6">
            The Future of <span className="text-gradient">Indian Education</span> is Here.
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Experience research-grade AI that adapts to your learning style. Upload notes, ask questions in your native language, and master concepts effortlessly.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/dashboard">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-full text-lg font-bold bg-gradient-to-r from-saffron-500 to-primary-600 shadow-[0_0_20px_rgba(255,153,51,0.4)]"
              >
                Start Learning Now
              </motion.button>
            </Link>
          </div>
        </motion.div>
        
        {/* Features Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl"
        >
          <FeatureCard 
            icon={<BookOpen className="w-8 h-8 text-primary-500" />}
            title="Adaptive RAG"
            description="Upload PDFs and notes. The AI simplifies explanations from beginner to expert level."
          />
          <FeatureCard 
            icon={<Mic className="w-8 h-8 text-saffron-500" />}
            title="Multilingual Voice Tutor"
            description="Speak in Hindi, Kannada, Tamil, Telugu, or Malayalam and get instant voice responses."
          />
          <FeatureCard 
            icon={<Sparkles className="w-8 h-8 text-india-green-500" />}
            title="Smart Analytics"
            description="Track your weak topics and get personalized AI-generated quizzes to improve."
          />
        </motion.div>
      </main>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="glass-card p-8 flex flex-col items-center text-center transition hover:scale-105 duration-300">
    <div className="bg-white/10 p-4 rounded-full mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

export default LandingPage;
