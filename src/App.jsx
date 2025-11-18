// App.jsx (Part 1/4)
import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { BookOpen, Zap, Clock, TrendingUp, Upload, Type, BarChart3, Users, FileText, Moon, Sun, Download, Share2, Search, CornerDownRight, MessageSquare, Edit3, Loader, CheckCircle, BookOpenCheck, Globe, Save, X, Trash2, Volume2 } from 'lucide-react';

// --- API & FIREBASE CONFIGURATION ---
const BASE_URL = import.meta.env.VITE_API_URL;

const API_URL = `${BASE_URL}/api`;
const TTS_URL = `${BASE_URL}/api/tts`;

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// --- GLOBAL REACT CONTEXT ---
const AppContext = createContext(null);

// --- MOCK DATA & UTILITIES ---
const FREE_BOOKS_LIBRARY = [
  { id: 101, title: "The Art of War (Sun Tzu)", type: "Non-fiction", content: "Sun Tzu said: The art of war is of vital importance to the State. It is a matter of life and death, a road either to safety or to ruin. Hence it is a subject of inquiry which can on no account be neglected..." },
  { id: 102, title: "A Study in Scarlet (Excerpt)", type: "Fiction", content: "In the year 1878 I took my degree of Doctor of Medicine of the University of London..." },
  { id: 103, title: "Animal Farm (Orwell Summary)", type: "Fiction", content: "Old Major, the old boar on the Manor Farm calls the animals for a meeting..." },
  { id: 104, title: "Poor Folk / The Overcoat (Dostoevsky)", type: "Fiction", content: "Makar Devushkin, a poor and aging government clerk, is living a life similar to the main character in Gogol's 'The Overcoat'..." }
];

const LANGUAGES = [
  'English', 'Hindi', 'Spanish', 'French', 'German', 'Japanese', 'Russian', 'Mandarin (Simplified)'
];

// small helper to safely get JSON from a Response (handles HTML error pages)
async function safeParseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  if (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try {
      return JSON.parse(text);
    } catch (e) {
      // fallback attempt: try to extract JSON substring
      const match = text.match(/{[\s\S]*}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch (e2) { /* fall through */ }
      }
    }
  }
  // If we get here, server replied with non-JSON (HTML error page or similar)
  throw new Error(`Invalid JSON response from server: ${text.slice(0, 250).replace(/\n/g, ' ')}`);
}

// --- DECOUPLED COMPONENTS ---
const SentimentGraph = ({ summaryData }) => {
  const { isDarkMode } = useContext(AppContext);
  const scores = summaryData?.sentimentScores || [0.6, 0.2, 0.9, 0.4, 0.7];

  const primaryLight = isDarkMode ? '#818cf8' : '#6366f1';
  const secondaryDark = isDarkMode ? '#a21caf' : '#d946ef';

  return (
    <div className="p-4 bg-white/5 rounded-xl shadow-inner h-64 flex flex-col justify-end">
      <h4 className="text-sm font-semibold mb-3 text-gray-300">Sentiment Over Sections ({summaryData?.sentimentScores ? 'AI Analysis' : 'Mock Data'})</h4>
      <div className="flex items-end h-full gap-2">
        {scores.map((score, index) => (
          <div key={index} className="flex-1 group relative flex flex-col items-center justify-end h-full">
            <div
              className={`w-full rounded-t-lg transition-all duration-500`}
              style={{ height: `${score * 80 + 20}%`, backgroundColor: score > 0.5 ? primaryLight : secondaryDark }}
            ></div>
            <span className="text-xs mt-1 text-gray-400 opacity-80">Sec {index + 1}</span>
            <div className="absolute bottom-full transform px-2 py-1 bg-gray-700 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mb-2">
              {(score * 100).toFixed(0)}% Positive
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Sidebar = () => {
  const {
    currentPage,
    navigate,
    isDarkMode,
    toggleDarkMode,
    summaryData,
    isAuthReady,
    userId
  } = useContext(AppContext);

  const activeNav = isDarkMode ? `bg-gray-700 text-indigo-400 shadow-inner` : `bg-indigo-100 text-indigo-700 shadow-md`;
  const inactiveNav = isDarkMode ? `text-gray-400 hover:bg-gray-800` : `text-gray-600 hover:bg-gray-100`;
  const NavButtonClass = `flex items-center space-x-2 p-2 rounded-lg transition-colors duration-200 text-sm font-medium`;

  return (
    <div className={`w-full lg:w-64 p-4 lg:p-6 flex-shrink-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white border-r border-gray-200'} lg:fixed lg:h-screen overflow-y-auto z-10 shadow-xl`}>
      <div className="flex items-center justify-between lg:justify-start mb-8 border-b pb-4 border-gray-700">
        <h1 className="text-3xl font-extrabold flex items-center">
          <BookOpen className={`w-8 h-8 mr-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
          <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Narrato</span>
        </h1>
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-full lg:hidden transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-gray-100 text-gray-500'}`}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <nav className="space-y-2">
        <button onClick={() => navigate('home')} className={`${NavButtonClass} ${currentPage === 'home' ? activeNav : inactiveNav}`}>
          <CornerDownRight className="w-5 h-5" /><span>Home / Landing</span>
        </button>
        <button onClick={() => navigate('upload')} className={`${NavButtonClass} ${currentPage === 'upload' ? activeNav : inactiveNav}`}>
          <Upload className="w-5 h-5" /><span>Upload / Summarize</span>
        </button>
        <button onClick={() => navigate('summary')} disabled={!summaryData} className={`${NavButtonClass} ${currentPage === 'summary' ? activeNav : inactiveNav} ${!summaryData ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <FileText className="w-5 h-5" /><span>Summary Output</span>
        </button>
        <button onClick={() => navigate('insights')} disabled={!summaryData} className={`${NavButtonClass} ${currentPage === 'insights' ? activeNav : inactiveNav} ${!summaryData ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <BarChart3 className="w-5 h-5" /><span>Insights / Analytics</span>
        </button>
        <button onClick={() => navigate('dashboard')} className={`${NavButtonClass} ${currentPage === 'dashboard' ? activeNav : inactiveNav}`}>
          <Search className="w-5 h-5" /><span>User Dashboard</span>
        </button>
        <button onClick={() => navigate('research')} className={`${NavButtonClass} ${currentPage === 'research' ? activeNav : inactiveNav}`}>
          <MessageSquare className="w-5 h-5" /><span>Research & Resources</span>
        </button>
      </nav>

      <div className="mt-8 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 mb-2">Current App ID: <span className={`font-mono text-xs ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{appId}</span></p>
        <p className="text-xs text-gray-500">User Status: <span className="font-semibold text-white">{isAuthReady ? (userId ? 'Authenticated' : 'Anonymous') : 'Loading...'}</span></p>
        {userId && <p className="text-xs text-gray-500 mt-1 truncate">User ID: <span className="font-mono text-[10px] text-gray-300">{userId}</span></p>}
      </div>
    </div>
  );
};
// App.jsx (Part 2/4)
const Home = () => {
  const { navigate } = useContext(AppContext);
  return (
    <div className="w-full">
      <header className="w-full bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Narrato</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-10 text-gray-700 font-medium">
            <button onClick={() => navigate('home')} className="hover:text-blue-600">Home</button>
            <button onClick={() => navigate('upload')} className="hover:text-blue-600">Upload</button>
            <button onClick={() => navigate('dashboard')} className="hover:text-blue-600">Dashboard</button>
          </nav>
          <button
            onClick={() => navigate('upload')}
            className="bg-orange-500 text-white px-5 py-2 rounded-xl font-semibold shadow hover:bg-orange-600"
          >
            Get Started
          </button>
        </div>
      </header>
      <section
        className="w-full py-20 px-6 text-center text-white"
        style={{ background: "linear-gradient(to right, #2b6cb0, #805ad5, #d53f8c)" }}
      >
        <h1 className="text-7xl font-extrabold mb-6 drop-shadow-lg">Narrato</h1>
        <h2 className="text-3xl font-semibold mb-6">Read Smarter. Understand Deeper.</h2>
        <p className="max-w-3xl mx-auto text-lg text-blue-50 leading-relaxed">
          Upload any book or text — get smart, structured summaries and insights in seconds.
          AI-powered analysis for fiction, non-fiction, academic texts, and professional reports.
        </p>
        <div className="flex justify-center gap-6 mt-10">
          <button
            onClick={() => navigate('upload')}
            className="bg-orange-500 text-white px-7 py-3 rounded-xl font-bold shadow-lg hover:bg-orange-600"
          >
            <BookOpen className="inline w-5 h-5 mr-2" />
            Get Started
          </button>
          <button
            onClick={() => navigate('summary')}
            className="px-7 py-3 rounded-xl font-semibold bg-white/20 border border-white/40 backdrop-blur-sm text-white hover:bg-white/30"
          >
            See Demo
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 max-w-4xl mx-auto mt-16">
          <div><p className="text-4xl font-extrabold">500+</p><p className="text-sm text-blue-100">Pages in Minutes</p></div>
          <div><p className="text-4xl font-extrabold">95%</p><p className="text-sm text-blue-100">Accuracy</p></div>
          <div><p className="text-4xl font-extrabold">10+</p><p className="text-sm text-blue-100">Analysis Types</p></div>
          <div><p className="text-4xl font-extrabold">3min</p><p className="text-sm text-blue-100">Average Time</p></div>
        </div>
      </section>
    </div>
  );
};

const UploadPage = () => {
  const {
    isLoading,
    error,
    isDarkMode,
    handleGenerateSummary,
    uploadState, setUploadState,
    targetLanguage, setTargetLanguage,
    handleFileChange, handleSelectBook, handleDragOver, handleDragLeave, handleDrop
  } = useContext(AppContext);

  const CardClass = isDarkMode ? 'bg-gray-800 shadow-2xl' : 'bg-white shadow-xl border border-gray-100';
  const InputClass = isDarkMode
    ? 'bg-gray-700 text-white border-gray-600 focus:border-indigo-500'
    : 'bg-gray-50 text-gray-900 border-gray-300 focus:border-indigo-600';
  const PrimaryButtonColor = `bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-600/50`;
  const PrimaryButtonClass = `px-6 py-3 rounded-xl font-bold transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4`;

  const { file, title, textToSummarize } = uploadState;
  const isReady = !!textToSummarize && !isLoading && !textToSummarize.includes('(Warning: The file');
  const fileLabel = file ? file.name : 'Drag & drop a file here, or click to select';

  return (
    <div className={`p-8 rounded-3xl ${CardClass} max-w-5xl mx-auto shadow-2xl`}>
      <h2 className={`text-4xl font-extrabold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'} border-b border-gray-700 pb-4`}>
        <Upload className={`inline w-8 h-8 mr-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
        Summarization Workbench
      </h2>

      {error && (
        <div className="p-4 mb-4 rounded-xl bg-red-900/50 border border-red-400 text-red-100 font-medium shadow-md">
          Error: {error}
        </div>
      )}

      <div className={`p-6 rounded-xl ${CardClass} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} mb-8 shadow-inner`}>
        <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>1. Upload Your Own Text (.TXT Recommended)</h3>
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 transition-colors ${InputClass} ${file ? 'border-indigo-500' : 'border-gray-500 hover:border-indigo-500'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.epub,.txt"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="text-center">
            {file ? (
              <p className="text-lg font-semibold text-indigo-400 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 mr-2" />
                File Ready: {fileLabel}
              </p>
            ) : (
              <p className="text-lg font-medium text-gray-400">{fileLabel}</p>
            )}
          </div>
        </div>
        <p className="mt-4 text-sm text-yellow-400 font-medium text-center bg-yellow-900/20 p-2 rounded-lg">
          ⚠️ **PDF/EPUB Limitation:** For accurate, real summarization, you **must** upload a **plain .TXT** file.
        </p>
        {title && textToSummarize && (
          <div className={`mt-4 p-3 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'} rounded-lg text-sm`}>
            <p className={`font-semibold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Current Source: {title}</p>
            <p className="text-gray-400">Length: {textToSummarize.split(/\s+/).length} words</p>
          </div>
        )}
      </div>

      <div className={`p-6 rounded-xl ${CardClass} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} mb-8 shadow-inner`}>
        <h3 className={`text-xl font-bold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          <BookOpenCheck className="w-5 h-5 mr-2 text-fuchsia-400" />
          2. Free Books Library (Guaranteed Content)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FREE_BOOKS_LIBRARY.map(book => (
            <div
              key={book.id}
              onClick={() => handleSelectBook(book)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${uploadState.title === book.title ? 'bg-fuchsia-700/50 border-fuchsia-400 shadow-lg' : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700'}`}
            >
              <p className="font-bold text-white">{book.title}</p>
              <p className="text-sm text-gray-400">{book.type} | Click to select</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <div className={`p-6 rounded-xl ${CardClass} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} shadow-inner`}>
          <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>3. Specify Text Type</h3>
          <div className="space-y-3">
            {['Fiction', 'Non-fiction', 'Research', 'Biography'].map(type => (
              <label key={type} className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${uploadState.type === type ? 'bg-indigo-700/50' : 'bg-gray-700/30 hover:bg-gray-700'}`}>
                <input
                  type="radio" name="bookType" value={type}
                  checked={uploadState.type === type}
                  onChange={(e) => setUploadState(prev => ({ ...prev, type: e.target.value }))}
                  className="form-radio text-indigo-500 w-5 h-5"
                />
                <span className="ml-3 font-medium text-white">{type}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={`p-6 rounded-xl ${CardClass} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} shadow-inner`}>
          <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-fuchsia-400' : 'text-fuchsia-600'}`}>4. Choose Summary Style</h3>
          <div className="space-y-3">
            {['Short Abstract (100 words)', 'Medium Summary (1 page)', 'Comprehensive (Max Length)'].map(style => (
              <label key={style} className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${uploadState.style === style ? 'bg-fuchsia-700/50' : 'bg-gray-700/30 hover:bg-gray-700'}`}>
                <input
                  type="radio" name="summaryStyle" value={style}
                  checked={uploadState.style === style}
                  onChange={(e) => setUploadState(prev => ({ ...prev, style: e.target.value }))}
                  className="form-radio text-fuchsia-500 w-5 h-5"
                />
                <span className="ml-3 font-medium text-white">{style}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className={`p-6 rounded-xl ${CardClass} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} mb-8 shadow-inner`}>
        <h3 className={`text-xl font-bold mb-4 flex items-center ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
          <Globe className="w-5 h-5 mr-2" /> 5. Target Summary Language (Translation)
        </h3>
        <select
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value)}
          className={`w-full p-3 rounded-lg ${InputClass} appearance-none cursor-pointer`}
        >
          {LANGUAGES.map(lang => (
            <option key={lang} value={lang}>{lang} {lang === 'Hindi' ? '(हिंदी)' : ''}</option>
          ))}
        </select>
        <p className="mt-2 text-sm text-gray-400">If a language other than English is selected, a translated summary tab will appear in the output (if backend provides it).</p>
      </div>

      <div className="text-center mt-10">
        <button
          onClick={handleGenerateSummary}
          disabled={!isReady || isLoading}
          className={`${PrimaryButtonClass} text-xl w-full max-w-md ${isReady ? PrimaryButtonColor : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader className="animate-spin mr-3 w-5 h-5" />
              AI Analyzing (This may take a minute)...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Zap className="w-6 h-6 mr-2" />
              Generate Summary
            </div>
          )}
        </button>
        <p className="mt-2 text-sm text-gray-500">Max content processed: ~10,000 words.</p>
      </div>
    </div>
  );
};
// App.jsx (Part 3/4)
const SummaryOutput = () => {
  const {
    summaryData, setSummaryData,
    navigate,
    isDarkMode,
    CardClass,
    updateSummaryInFirestore,
    handleGenerateTts // NOTE: may come from context in future; for now TTS handled inline if needed
  } = useContext(AppContext);

  const [activeSummaryTab, setActiveSummaryTab] = useState('Summary');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(summaryData?.summary || "");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);

  useEffect(() => {
    if (summaryData) {
      setActiveSummaryTab('Summary');
      setEditText(summaryData.summary || "");
      setIsEditing(false);
    }
  }, [summaryData]);

  if (!summaryData) {
    return (
      <div className={`p-8 rounded-3xl ${CardClass} text-center`}>
        <p className="text-lg text-gray-400">Please generate a summary first on the <a onClick={() => navigate('upload')} className="text-indigo-400 cursor-pointer underline">Upload Page</a> to see output.</p>
      </div>
    );
  }

  const handleSaveEdit = async () => {
    if (!summaryData?.id) {
      // If there's no ID (not saved), just update local
      setSummaryData(prev => ({ ...prev, summary: editText }));
      setIsEditing(false);
      return;
    }
    setIsSavingEdit(true);
    try {
      await updateSummaryInFirestore(summaryData.id, { summary: editText });
      setSummaryData(prev => ({ ...prev, summary: editText }));
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to save edit:", e);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handlePlayTts = async (text) => {
    if (!text) return;
    setIsTtsPlaying(true);

    // Remove existing audio element if any
    const existing = document.getElementById("narrato-tts-audio");
    if (existing) {
      existing.pause();
      existing.remove();
    }

    try {
      const resp = await fetch(TTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      if (!resp.ok) {
        console.warn("TTS endpoint returned non-ok status:", resp.status);
        throw new Error("TTS failed");
      }

      // parse robustly
      const ttsJson = await safeParseJsonResponse(resp);
      const audioBase64 = ttsJson?.audioData || ttsJson?.audio?.data || ttsJson?.data?.audio || null;
      const mimeType = ttsJson?.mimeType || ttsJson?.audio?.mime || "audio/wav";

      if (!audioBase64) {
        throw new Error("No audio data from TTS");
      }

      const bytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
      const blob = new Blob([bytes.buffer], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.id = "narrato-tts-audio";
      audio.onended = () => setIsTtsPlaying(false);
      audio.play();
    } catch (e) {
      console.error("TTS Error:", e);
      setIsTtsPlaying(false);
      // fallback: try browser speechSynthesis for basic TTS (best-effort)
      if ('speechSynthesis' in window) {
        try {
          const utter = new SpeechSynthesisUtterance(text);
          window.speechSynthesis.speak(utter);
        } catch (se) { console.error("speechSynthesis failed", se); }
      }
    }
  };

  const tabs = ['Summary', 'Character Map', 'Themes / Keywords', 'Sentiment Analysis Graph'];
  if (summaryData?.translatedSummary) tabs.unshift('Translation');

  const renderTabContent = () => {
    switch (activeSummaryTab) {
      case 'Summary':
        return (
          <div className="prose prose-invert max-w-none text-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-indigo-400 m-0">Core Summary</h3>
              {isEditing ? (
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} disabled={isSavingEdit} className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition">
                    {isSavingEdit ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save
                  </button>
                  <button onClick={() => { setIsEditing(false); setEditText(summaryData.summary); }} className="flex items-center px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition">
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(true)} className="flex items-center px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition">
                    <Edit3 className="w-4 h-4 mr-2" /> Edit
                  </button>
                  <button onClick={() => handlePlayTts(summaryData.summary)} disabled={isTtsPlaying} className="flex items-center px-3 py-1 bg-fuchsia-600 text-white text-sm rounded-lg hover:bg-fuchsia-700 transition">
                    <Volume2 className="w-4 h-4 mr-2" /> {isTtsPlaying ? 'Playing...' : 'Listen (TTS)'}
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className={`w-full h-96 p-2 rounded bg-gray-900 text-white whitespace-pre-wrap leading-relaxed font-mono`}
              />
            ) : (
              <div className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: summaryData.summary }}></div>
            )}
          </div>
        );
      case 'Translation':
        return (
          <div>
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">Translated Summary</h3>
            <div className="whitespace-pre-wrap leading-relaxed">{summaryData.translatedSummary || 'Translation not available.'}</div>
            <div className="mt-4">
              <button onClick={() => handlePlayTts(summaryData.translatedSummary)} className="px-4 py-2 rounded bg-fuchsia-600 text-white">Listen</button>
            </div>
          </div>
        );
      case 'Character Map':
        return (
          <div>
            <h3 className="text-2xl font-bold text-indigo-400 mb-4">Character & Entity Map</h3>
            {(!summaryData.characters || summaryData.characters.length === 0) ? (
              <p className="text-gray-400">No specific characters or entities were extracted.</p>
            ) : (
              <ul className="space-y-3">
                {summaryData.characters.map((c, i) => (
                  <li key={i} className="flex flex-col items-start p-3 rounded-lg bg-gray-700/50 border-l-4 border-fuchsia-400">
                    <span className="font-semibold text-white text-lg">{c.name}</span>
                    <span className="ml-0 text-gray-300 text-sm">{c.relation}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      case 'Themes / Keywords':
        return (
          <div>
            <h3 className="text-2xl font-bold text-indigo-400 mb-4">Extracted Themes & Keywords</h3>
            {(!summaryData.themes || summaryData.themes.length === 0) ? (
              <p className="text-gray-400">No specific themes were extracted.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {summaryData.themes.map((theme, i) => (
                  <span key={i} className="px-3 py-1 bg-yellow-600/50 text-yellow-200 rounded-full text-sm font-medium border border-yellow-500 shadow-md">
                    # {theme}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      case 'Sentiment Analysis Graph':
        return (
          <div>
            <h3 className="text-2xl font-bold text-indigo-400 mb-4">Document Sentiment Overview</h3>
            <SentimentGraph summaryData={summaryData} />
            <p className="mt-4 text-sm text-gray-500">This graph shows the overall emotional tone detected in each section of the text. Higher scores indicate more positive sentiment.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`p-8 rounded-3xl ${CardClass} shadow-2xl`}>
      <h2 className={`text-4xl font-extrabold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'} border-b border-gray-700 pb-4`}>
        <FileText className={`inline w-8 h-8 mr-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
        Summary Results: {summaryData.title || 'Untitled Book'}
      </h2>

      <div className="flex justify-start gap-4 mb-8">
        <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-md">
          <Download className="w-4 h-4 mr-2" /> Download Summary (PDF)
        </button>
        <button className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition shadow-md">
          <Share2 className="w-4 h-4 mr-2" /> Share Summary
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 h-[650px] flex flex-col">
          <h3 className="text-xl font-bold mb-3 text-gray-300">Original Text Preview</h3>
          <div className={`flex-1 p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-100 border-gray-300'} overflow-y-auto text-sm font-mono text-gray-400 border shadow-inner`}>
            <pre className="whitespace-pre-wrap">{(summaryData.originalText || "").substring(0, 500) + '...'}</pre>
            <p className="mt-2 italic text-xs text-gray-500">Showing first 500 characters of {(summaryData.wordCount?.original || 0)} words.</p>
          </div>
        </div>

        <div className="lg:col-span-2 h-[650px] flex flex-col">
          <div className="flex border-b border-gray-700 mb-4 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSummaryTab(tab)}
                className={`py-3 px-4 text-sm font-semibold transition-colors border-b-2 ${activeSummaryTab === tab ? 'text-indigo-400 border-indigo-400 shadow-md' : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className={`flex-1 p-5 rounded-xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border overflow-y-auto shadow-inner`}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
// App.jsx (Part 4/4)
const InsightsPage = () => {
  const { summaryData, isDarkMode, CardClass } = useContext(AppContext);

  if (!summaryData) {
    return (
      <div className={`p-8 rounded-3xl ${CardClass} text-center`}>
        <p className="text-lg text-gray-400">No data available. Generate a summary first.</p>
      </div>
    );
  }

  const { wordCount, confidence, readingTimeSaved, themes } = summaryData;

  return (
    <div className={`p-8 rounded-3xl ${CardClass} shadow-2xl`}>
      <h2 className={`text-4xl font-extrabold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-800'} border-b border-gray-700 pb-4`}>
        <BarChart3 className={`inline w-8 h-8 mr-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
        In-Depth Text Analytics
      </h2>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className={`p-6 rounded-xl ${CardClass} border border-indigo-500/50 shadow-md`}>
          <p className="text-sm text-gray-400">AI Evaluation Score</p>
          <p className="text-4xl font-black mt-1 text-indigo-400">{Math.round((confidence || 0.95) * 100)}%</p>
          <p className="text-sm text-gray-500 mt-2">The model's confidence in the generated summary's accuracy.</p>
        </div>
        <div className={`p-6 rounded-xl ${CardClass} border border-fuchsia-500/50 shadow-md`}>
          <p className="text-sm text-gray-400">Reading Time Saved</p>
          <p className="text-4xl font-black mt-1 text-fuchsia-400">{readingTimeSaved || 'N/A'}</p>
          <p className="text-sm text-gray-500 mt-2">Estimated time saved by reading the summary vs. the original text.</p>
        </div>
        <div className={`p-6 rounded-xl ${CardClass} border border-yellow-500/50 shadow-md`}>
          <p className="text-sm text-gray-400">Text Length Comparison</p>
          <p className="text-xl font-bold mt-1 text-yellow-400">
            {(wordCount?.original || 0).toLocaleString()} words (Original)
          </p>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {(wordCount?.summary || 0).toLocaleString()} words (Summary)
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className={`p-6 rounded-xl ${CardClass} border border-gray-700 shadow-md`}>
          <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Sentiment Analysis Overview</h3>
          <SentimentGraph summaryData={summaryData} />
        </div>

        <div className={`p-6 rounded-xl ${CardClass} border border-gray-700 shadow-md`}>
          <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Theme Extraction (LDA)</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-400 ml-4">
            {themes?.map((theme, i) => (
              <li key={i} className="text-gray-300">
                <span className="font-semibold text-fuchsia-300">Theme {i + 1}:</span> {theme}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const {
    isDarkMode, CardClass, InputClass, userId, db, navigate, setSummaryData
  } = useContext(AppContext);

  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userSummaries, setUserSummaries] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userId || !db) return;

    if (!window.firebase || !window.firebase.firestore) {
      console.warn("Firestore module not ready for notes");
      return;
    }

    const { getDoc, doc } = window.firebase.firestore;
    const userDocRef = doc(db, 'users', userId);

    getDoc(userDocRef).then(docSnap => {
      if (docSnap.exists() && docSnap.data().notes) {
        setNotes(docSnap.data().notes);
      }
    }).catch(e => console.error("Failed to load notes", e));
  }, [userId, db]);

  useEffect(() => {
    if (!userId || !db) return;

    if (!window.firebase || !window.firebase.firestore) {
      console.warn("Firestore module not ready for summaries");
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);
    const { collection, query, where, onSnapshot, orderBy } = window.firebase.firestore;

    const summariesColRef = collection(db, 'summaries');
    const q = query(
      summariesColRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const summaries = [];
      querySnapshot.forEach((doc) => {
        summaries.push({ id: doc.id, ...doc.data() });
      });
      setUserSummaries(summaries);
      setIsDataLoading(false);
    }, (error) => {
      console.error("Error fetching summaries:", error);
      setIsDataLoading(false);
    });

    return () => unsubscribe();
  }, [userId, db]);

  const filteredSummaries = useMemo(() =>
    userSummaries.filter(s =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [userSummaries, searchQuery]);

  const handleSaveNotes = async () => {
    if (!userId || !db || !window.firebase.firestore) {
      console.error("User or Firestore not authenticated to save notes.");
      return;
    }
    setIsSaving(true);
    const { setDoc, doc } = window.firebase.firestore;
    const userDocRef = doc(db, 'users', userId);
    try {
      await setDoc(userDocRef, { notes: notes }, { merge: true });
      console.log("Notes saved successfully.");
    } catch (e) {
      console.error("Error saving notes:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenSummary = (summary) => {
    setSummaryData(summary);
    navigate('summary');
  };

  const handleDeleteSummary = async (e, summaryId) => {
    e.stopPropagation();
    if (!db || !summaryId || !window.firebase.firestore) return;
    if (!window.confirm("Are you sure you want to delete this summary?")) return;

    const { deleteDoc, doc } = window.firebase.firestore;
    try {
      const summaryDocRef = doc(db, 'summaries', summaryId);
      await deleteDoc(summaryDocRef);
      console.log("Summary deleted.");
    } catch (error) {
      console.error("Error deleting summary:", error);
    }
  };

  return (
    <div className={`p-8 rounded-3xl ${CardClass} shadow-2xl`}>
      <h2 className={`text-4xl font-extrabold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-800'} border-b border-gray-700 pb-4`}>
        <Search className={`inline w-8 h-8 mr-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
        User Dashboard
      </h2>

      <div className={`p-6 rounded-xl ${CardClass} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} mb-8 shadow-inner`}>
        <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Your Saved Summaries</h3>
        <div className="mb-4 flex items-center">
          <Search className="w-5 h-5 text-gray-500 mr-3" />
          <input
            type="text"
            placeholder="Search by book title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full p-3 rounded-lg ${InputClass}`}
          />
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {isDataLoading ? (
            <p className="text-gray-400 italic text-center p-4">Loading summaries...</p>
          ) : filteredSummaries.length > 0 ? filteredSummaries.map(summary => (
            <div
              key={summary.id}
              onClick={() => handleOpenSummary(summary)}
              className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition shadow-sm cursor-pointer`}
            >
              <div>
                <p className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{summary.title}</p>
                <p className="text-sm text-gray-400">
                  <span className="text-fuchsia-300 font-medium">{summary.type || 'N/A'}</span> | {' '}{summary.createdAt ? new Date(summary.createdAt.seconds * 1000).toLocaleDateString() : 'No date'}
                </p>
              </div>
              <div className="flex space-x-2 mt-3 md:mt-0">
                <button
                  onClick={(e) => handleDeleteSummary(e, summary.id)}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                  aria-label="Delete summary"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )) : (
            <p className="text-gray-500 italic p-4 text-center">
              {searchQuery ? `No summaries found for "${searchQuery}".` : "You haven't saved any summaries yet."}
            </p>
          )}
        </div>
      </div>

      <div className={`p-6 rounded-xl ${CardClass} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} shadow-inner`}> 
        <h3 className={`text-2xl font-bold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          <Edit3 className="w-5 h-5 mr-2 text-yellow-400" />
          Add Personal Notes
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Jot down your insights, reading goals, or project thoughts here..."
          rows="6"
          className={`w-full p-4 rounded-lg ${InputClass} resize-none`}
        ></textarea>
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSaveNotes}
            disabled={isSaving || !userId}
            className={`px-4 py-2 rounded-lg font-medium transition ${isSaving || !userId ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {isSaving ? (
              <div className="flex items-center">
                <Loader className="animate-spin mr-2 w-4 h-4" /> Saving...
              </div>
            ) : (
              'Save Notes'
            )}
          </button>
        </div>
        {!userId && <p className="text-sm text-red-400 mt-2">Cannot save notes: User authentication failed or is loading.</p>}
      </div>
    </div>
  );
};

const ResearchPage = () => {
  const { isDarkMode, CardClass } = useContext(AppContext);
  return (
    <div className={`p-8 rounded-3xl ${CardClass} shadow-2xl`}>
      <h2 className={`text-4xl font-extrabold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-800'} border-b border-gray-700 pb-4`}>
        <MessageSquare className={`inline w-8 h-8 mr-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
        Research & Transparency
      </h2>
      <div className="space-y-10">
        <div className={`p-6 rounded-xl ${CardClass} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} shadow-md`}>
          <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>How Narrato Summarizes Your Text</h3>
          <p className="text-gray-400 mb-4">
            Our summarization process is built on a **two-step AI chain** to ensure high fidelity and reliability.
          </p>
          <ol className="list-decimal list-inside space-y-3 text-gray-400 ml-4">
            <li>**Generation (`/api/generate`):** The full text is sent to the backend AI which returns a structured summary and metadata in JSON.</li>
            <li>**(Optional) Persistence:** The combined data is saved to your user's secure Firestore database, making it available on your dashboard in real-time.</li>
            <li>**TTS:** TTS is attempted via backend; when unavailable the app falls back gracefully to browser speechSynthesis where possible.</li>
          </ol>
        </div>
        <div className={`p-6 rounded-xl ${CardClass} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} shadow-md`}>
          <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>About the Developer</h3>
          <p className="text-gray-400">
            This Narrato prototype was conceptualized and implemented using **React.js, Node.js, and Firebase** to demonstrate a modern, responsive, and functional AI-powered application.
          </p>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
const App = () => {
  const [currentPage, setCurrentPage] = useState('upload'); // default to upload as in your flow
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [uploadState, setUploadState] = useState({
    file: null,
    title: '',
    type: 'Non-fiction',
    style: 'Comprehensive (Max Length)',
    textToSummarize: '',
  });
  const [targetLanguage, setTargetLanguage] = useState('English');

  // --- FIREBASE STATE ---
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  if (!window.firebase) window.firebase = { auth: null, firestore: null };

  // Firebase init
  useEffect(() => {
    const initFirebase = async () => {
      try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js');
        const authModule = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js');
        const firestoreModule = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');

        if (Object.keys(firebaseConfig).length === 0) {
          console.error("Firebase config is missing. Cannot initialize Firestore.");
          setIsAuthReady(true);
          return;
        }

        const app = initializeApp(firebaseConfig);
        const authInstance = authModule.getAuth(app);
        const dbInstance = firestoreModule.getFirestore(app);

        setAuth(authInstance);
        setDb(dbInstance);

        window.firebase.auth = authModule;
        window.firebase.firestore = firestoreModule;

        const signInUser = async () => {
          try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
              await authModule.signInWithCustomToken(authInstance, __initial_auth_token);
            } else {
              await authModule.signInAnonymously(authInstance);
            }
          } catch (e) {
            console.error("Firebase Auth Error:", e);
            await authModule.signInAnonymously(authInstance);
          }
        };

        authModule.onAuthStateChanged(authInstance, (user) => {
          if (user) setUserId(user.uid);
          setIsAuthReady(true);
        });

        signInUser();
      } catch (e) {
        console.error("Failed to load or initialize Firebase:", e);
        setIsAuthReady(true);
      }
    };

    initFirebase();
  }, []);

  // Helpers & callbacks
  const navigate = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const toggleDarkMode = useCallback(() => setIsDarkMode(prev => !prev), []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const fileName = file.name.split('.').slice(0, -1).join('.') || 'Untitled Document';
      setUploadState(prev => ({ ...prev, file: file, title: fileName, textToSummarize: '' }));

      if (file.name.toLowerCase().endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadState(prev => ({ ...prev, textToSummarize: e.target.result }));
        };
        reader.readAsText(file);
      } else {
        const mockText = `(Warning: The file "${file.name}" is a PDF or EPUB. Accurate summarization requires the full text content. Please use a plain .TXT file or select a book from the Library for a correct analysis. The AI will summarize this warning text.)`;
        setUploadState(prev => ({ ...prev, textToSummarize: mockText }));
        setError(`Cannot process ${file.name}. Only .TXT files can be read client-side for accurate summarization. Please convert your file or use the library.`);
      }
    }
  }, []);

  const handleSelectBook = useCallback((book) => {
    setUploadState({
      file: { name: `${book.title}.txt`, size: book.content.length * 2 },
      title: book.title,
      type: book.type,
      style: 'Comprehensive (Max Length)',
      textToSummarize: book.content,
    });
    setError(null);
    setTargetLanguage('English');
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-indigo-400', 'bg-gray-700/50');
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-indigo-400', 'bg-gray-700/50');
  }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-indigo-400', 'bg-gray-700/50');
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange({ target: { files: [file] } });
  }, [handleFileChange]);

  const saveSummaryToFirestore = useCallback(async (summaryObject) => {
    if (!db || !userId || !window.firebase.firestore) {
      console.warn("Firestore not ready, cannot save summary.");
      return summaryObject;
    }
    const { collection, addDoc, serverTimestamp } = window.firebase.firestore;
    try {
      const docRef = await addDoc(collection(db, "summaries"), {
        ...summaryObject,
        userId: userId,
        createdAt: serverTimestamp()
      });
      console.log("Summary saved with ID: ", docRef.id);
      return { ...summaryObject, id: docRef.id };
    } catch (e) {
      console.error("Error adding document: ", e);
      return summaryObject;
    }
  }, [db, userId]);

  const updateSummaryInFirestore = useCallback(async (summaryId, updatedData) => {
    if (!db || !summaryId || !window.firebase.firestore) {
      console.warn("Firestore not ready, cannot update summary.");
      return;
    }
    const { doc, setDoc } = window.firebase.firestore;
    try {
      const summaryDocRef = doc(db, "summaries", summaryId);
      await setDoc(summaryDocRef, updatedData, { merge: true });
      console.log("Summary updated in Firestore:", summaryId);
    } catch (e) {
      console.error("Error updating document:", e);
    }
  }, [db]);

  // ---- THE FIX: single-call generation & robust parsing ----
  const handleGenerateSummary = useCallback(async () => {
  try {
    const { title, textToSummarize } = uploadState;

    setError(null);
    setSummaryData(null);

    if (!textToSummarize || textToSummarize.length < 10) {
      setError("Please provide enough text to summarize.");
      return;
    }

    setIsLoading(true);
    console.log("Calling /api/generate...");

    const response = await fetch(`${API_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: textToSummarize,
        title: title || "Untitled",
        style: "Comprehensive (Max Length)"
      })
    });

    const data = await response.json();
    console.log("Generate API Response:", data);

    if (!response.ok) {
      throw new Error(data.error || "Summary generation failed");
    }

    // Save the summary result
    setSummaryData(data);

  } catch (err) {
    console.error("Frontend Summary Error:", err);
    setError("Error: " + err.message);
  } finally {
    setIsLoading(false);
  }
}, [uploadState, API_URL]);

      // parse structured output robustly
    const handleGenerateSummary = useCallback(async () => {
  try {
    const { title, textToSummarize } = uploadState;

    setError(null);
    setSummaryData(null);

    if (!textToSummarize || textToSummarize.length < 10) {
      setError("Please provide enough text to summarize.");
      return;
    }

    setIsLoading(true);
    console.log("Calling /api/generate...");

    const response = await fetch(`${API_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: textToSummarize,
        title: title || "Untitled",
        style: "Comprehensive (Max Length)"
      })
    });

    const data = await response.json();
    console.log("Generate API Response:", data);

    if (!response.ok) {
      throw new Error(data.error || "Summary generation failed");
    }

    setSummaryData(data);

  } catch (err) {
    console.error("Frontend Summary Error:", err);
    setError("Error: " + err.message);
  } finally {
    setIsLoading(false);
  }
}, [uploadState, API_URL]);


  // UI theme variables
  const primaryColor = '#4f46e5';
  const secondaryColor = '#d946ef';
  const tertiaryColor = '#facc15';

  const lightBg = 'bg-white';
  const darkBg = 'bg-gray-900';
  const baseClasses = isDarkMode ? `min-h-screen ${darkBg} text-gray-50` : `min-h-screen ${lightBg} text-gray-900`;
  const CardClass = isDarkMode ? 'bg-gray-800 shadow-2xl' : 'bg-white shadow-xl border border-gray-100';
  const InputClass = isDarkMode ? 'bg-gray-700 text-white border-gray-600 focus:border-indigo-500' : 'bg-gray-50 text-gray-900 border-gray-300 focus:border-indigo-600';

  const renderPage = () => {
    switch (currentPage) {
      case 'upload': return <UploadPage />;
      case 'summary': return <SummaryOutput />;
      case 'insights': return <InsightsPage />;
      case 'dashboard': return <Dashboard />;
      case 'research': return <ResearchPage />;
      default: return <UploadPage />;
    }
  };

  const contextValue = {
    currentPage, isDarkMode, isLoading, error, summaryData, setSummaryData,
    uploadState, setUploadState, targetLanguage, setTargetLanguage,
    auth, db, userId, isAuthReady,
    CardClass, InputClass,
    navigate, toggleDarkMode, handleFileChange, handleSelectBook,
    handleDragOver, handleDragLeave, handleDrop,
    handleGenerateSummary, updateSummaryInFirestore
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className={`${baseClasses} ${isDarkMode ? 'dark' : ''}`} style={{ '--color-primary': primaryColor, '--color-secondary': secondaryColor }}>
        <style>{`
          :root {
            --color-primary: ${primaryColor};
            --color-secondary: ${secondaryColor};
            --color-tertiary: ${tertiaryColor};
            --color-primary-light: ${isDarkMode ? '#818cf8' : '#6366f1'};
            --color-secondary-dark: ${isDarkMode ? '#a21caf' : '#d946ef'};
          }
          .dark ::-webkit-scrollbar { width: 8px; }
          .dark ::-webkit-scrollbar-track { background: #1f2937; }
          .dark ::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
          .dark ::-webkit-scrollbar-thumb:hover { background: #6b7280; }
          .prose strong { color: ${isDarkMode ? '#818cf8' : '#4f46e5'}; font-weight: 700; }
        `}</style>

        {currentPage === 'home' ? (
          <Home />
        ) : (
          <div className="flex flex-col lg:flex-row">
            <Sidebar />
            <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 w-full">
              {renderPage()}
            </main>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
};

export default App;
