import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Activity, BookOpen, AlertCircle, Trash2, Sparkles, X, Loader } from 'lucide-react';
import { uploadDocument, listDocuments, deleteDocument, simplifyDocument } from '../services/api';
import useAuthStore from '../store/authStore';

const Dashboard = () => {
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [simplifying, setSimplifying] = useState(null); // doc id being simplified
  const [simplifiedResult, setSimplifiedResult] = useState(null); // { docName, summary }
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
      console.error("Failed to delete document", err);
    }
  };

  const handleSimplify = async (doc) => {
    setSimplifying(doc.id);
    setError('');
    try {
      const res = await simplifyDocument(doc.id);
      setSimplifiedResult({ docName: doc.filename, summary: res.data.summary });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to simplify document.');
    } finally {
      setSimplifying(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="mb-4">
        <h1 className="text-3xl font-bold">Welcome back, {user?.full_name || user?.email || 'Student'}!</h1>
        <p className="text-gray-400">Ready to conquer your syllabus today?</p>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Documents Analyzed" value={documents.length.toString()} icon={<FileText className="w-6 h-6 text-saffron-500" />} />
        <StatCard title="Study Hours" value="34h" icon={<Activity className="w-6 h-6 text-primary-500" />} />
        <StatCard title="Weak Topics" value="2" icon={<AlertCircle className="w-6 h-6 text-red-500" />} alert />
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/40 text-red-300 p-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Section */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[300px] border-dashed border-2 border-white/20 transition-all hover:border-saffron-500/50">
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Upload Study Material</h2>
            <p className="text-gray-400 text-sm mb-6 text-center max-w-sm">
              Drag and drop your PDFs, notes, or syllabus here. The AI will analyze and prepare it for you.
            </p>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange} 
              className="hidden" 
              accept=".pdf,.txt,.md,.doc,.docx"
            />
            <button 
              className="px-6 py-2 rounded-full bg-gradient-to-r from-saffron-500 to-primary-600 font-medium hover:opacity-90 transition disabled:opacity-50"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Processing AI...' : 'Select Files'}
            </button>
          </div>

          {/* Document List */}
          {documents.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-4">Your Documents</h2>
              <div className="space-y-3">
                {documents.map((doc) => (
                  <motion.div 
                    key={doc.id} 
                    layout
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-saffron-500" />
                      <span className="font-medium text-sm">{doc.filename}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Simplify Button */}
                      <button 
                        onClick={() => handleSimplify(doc)}
                        disabled={simplifying === doc.id}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-saffron-500/20 to-primary-600/20 border border-saffron-500/30 text-saffron-500 hover:from-saffron-500/30 hover:to-primary-600/30 hover:border-saffron-500/50 transition disabled:opacity-50"
                      >
                        {simplifying === doc.id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        {simplifying === doc.id ? 'Simplifying...' : 'Simplify'}
                      </button>
                      {/* Delete Button */}
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="text-gray-400 hover:text-red-400 transition p-2 hover:bg-white/10 rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Analytics/Recommendations */}
        <div className="glass-card p-6 flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-saffron-500" />
            AI Recommendations
          </h2>
          
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <h3 className="font-semibold mb-1">Focus on: Data Structures</h3>
            <p className="text-sm text-gray-400 mb-3">You struggled with Binary Trees in your last quiz.</p>
            <button className="text-sm text-primary-400 hover:text-primary-300">Generate simplified notes &rarr;</button>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <h3 className="font-semibold mb-1">Upcoming Review</h3>
            <p className="text-sm text-gray-400 mb-3">Operating Systems flashcards are ready.</p>
            <button className="text-sm text-primary-400 hover:text-primary-300">Start Review &rarr;</button>
          </div>
        </div>
      </div>

      {/* Simplify Result Modal */}
      <AnimatePresence>
        {simplifiedResult && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSimplifiedResult(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="glass-card p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-saffron-500/20 to-primary-600/20 rounded-xl">
                    <Sparkles className="w-6 h-6 text-saffron-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Simplified Summary</h2>
                    <p className="text-gray-400 text-sm">{simplifiedResult.docName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSimplifiedResult(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white/5 p-6 rounded-xl border border-white/10 whitespace-pre-wrap text-gray-200 leading-relaxed">
                {simplifiedResult.summary}
              </div>

              <button 
                onClick={() => setSimplifiedResult(null)}
                className="mt-6 w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-saffron-500 to-primary-600 hover:opacity-90 transition"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ title, value, icon, alert }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`glass-card p-6 flex items-center gap-4 ${alert ? 'border-red-500/30' : ''}`}
  >
    <div className="bg-white/10 p-3 rounded-xl">
      {icon}
    </div>
    <div>
      <p className="text-gray-400 text-sm">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  </motion.div>
);

export default Dashboard;
