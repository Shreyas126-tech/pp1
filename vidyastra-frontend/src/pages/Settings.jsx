import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, User as UserIcon, Globe, Settings as SettingsIcon, Volume2, Cpu, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';

const SECTIONS = [
  { id: 'account', label: 'Account', icon: <UserIcon className="w-5 h-5 text-saffron-500" /> },
  { id: 'ollama', label: 'Local AI Connect', icon: <Cpu className="w-5 h-5 text-emerald-500" /> },
  { id: 'voice', label: 'Voice Options', icon: <Volume2 className="w-5 h-5 text-rose-500" /> }
];

const Settings = () => {
  const user = useAuthStore(s => s.user);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('account');
  
  // Local state for settings form
  const [settings, setSettings] = useState({
    theme: 'dark',
    language: 'English',
    voiceSpeed: 'normal',
    voiceEnabled: true,
    autoSpeak: false,
    aiModel: 'ollama',
    simplificationLevel: 'Intermediate',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setSaved(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    // Save to localStorage so settings persist
    localStorage.setItem('vidyastra_settings', JSON.stringify(settings));
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 600);
  };

  // Load saved settings on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('vidyastra_settings');
      if (saved) setSettings(JSON.parse(saved));
    } catch {}
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <header className="mb-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-saffron-500" />
          Settings
        </h1>
        <p className="text-gray-400">Manage your educational preferences and AI settings.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Sidebar Nav */}
        <div className="col-span-1 space-y-2">
          {SECTIONS.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeSection === sec.id
                  ? 'bg-white/10 text-white border border-white/20 shadow-lg'
                  : 'hover:bg-white/5 text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              {sec.icon} {sec.label}
            </button>
          ))}
        </div>

        {/* Main Settings Form */}
        <div className="col-span-1 md:col-span-2">
          <form onSubmit={handleSave} className="glass-card p-6 md:p-8 space-y-8">
            
            {/* Account Section */}
            {activeSection === 'account' && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h2 className="text-xl font-semibold border-b border-white/10 pb-2">Account Profile</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                    <input type="text" disabled value={user?.full_name || 'Student'} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-gray-400 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                    <input type="email" disabled value={user?.email || 'student@example.com'} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-gray-400 cursor-not-allowed" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Theme</label>
                  <select name="theme" value={settings.theme} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-saffron-500">
                    <option value="dark">Dark Mode (Default)</option>
                    <option value="light">Light Mode</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
              </motion.section>
            )}

            {/* AI Models Section */}
            {activeSection === 'ai' && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h2 className="text-xl font-semibold border-b border-white/10 pb-2">AI Model Settings</h2>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">AI Model</label>
                  <select name="aiModel" value={settings.aiModel} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-saffron-500">
                    <option value="ollama">Ollama (Local — qwen2.5:1.5b)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Running 100% locally via Ollama. No internet or API keys needed.</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Default Simplification Level</label>
                  <select name="simplificationLevel" value={settings.simplificationLevel} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-saffron-500">
                    <option value="Beginner">Beginner (Child-friendly, simple words)</option>
                    <option value="Intermediate">Intermediate (Standard student level)</option>
                    <option value="Expert">Expert (Advanced terminology)</option>
                    <option value="Exam">Exam-preparation (Bullet points, key facts)</option>
                  </select>
                </div>
              </motion.section>
            )}

            {/* Voice & Audio Section */}
            {activeSection === 'voice' && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h2 className="text-xl font-semibold border-b border-white/10 pb-2">Voice & Audio</h2>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Voice Speed</label>
                  <select name="voiceSpeed" value={settings.voiceSpeed} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-saffron-500">
                    <option value="slow">Slow</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Fast</option>
                  </select>
                </div>
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-medium">Enable Text-to-Speech</p>
                    <p className="text-xs text-gray-500">Show a "Listen" button on AI responses</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="voiceEnabled" checked={settings.voiceEnabled} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-saffron-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-medium">Auto-Speak Responses</p>
                    <p className="text-xs text-gray-500">Automatically read AI responses aloud</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="autoSpeak" checked={settings.autoSpeak} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-saffron-500"></div>
                  </label>
                </div>
              </motion.section>
            )}

            {/* Actions */}
            <div className="pt-4 flex items-center justify-between">
              {saved && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-green-400 text-sm font-medium"
                >
                  <CheckCircle className="w-4 h-4" /> Settings saved successfully!
                </motion.span>
              )}
              {!saved && <span />}
              <button 
                type="submit" 
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-saffron-500 to-primary-600 font-bold text-white hover:opacity-90 transition disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
