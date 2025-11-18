import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { BookOpen, Zap, Clock, TrendingUp, Upload, Type, BarChart3, Users, FileText, Moon, Sun, Download, Share2, Search, CornerDownRight, MessageSquare, Edit3, Loader, CheckCircle, BookOpenCheck, Volume2, Globe, Save, X } from 'lucide-react';

// --- API & FIREBASE CONFIGURATION ---
const apiKey = ""; // Leave as-is for Canvas environment
const API_URL = "http://localhost:4000/api/generate";
const TTS_URL = "http://localhost:4000/api/tts"; // Added TTS_URL from your code
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// --- GLOBAL REACT CONTEXT ---
// This context will hold all our global state and functions
const AppContext = createContext(null);

// --- MOCK DATA & UTILITIES ---
// (Moved outside components for performance)

const FREE_BOOKS_LIBRARY = [
  // Existing mock books
  { id: 101, title: "The Art of War (Sun Tzu)", type: "Non-fiction", content: "Sun Tzu said: The art of war is of vital importance to the State. It is a matter of life and death, a road either to safety or to ruin. Hence it is a subject of inquiry which can on no account be neglected. The moral law causes the people to be in complete accord with their ruler, so that they will follow him regardless of any danger to their lives. Therefore, the commander must be moral, intelligent, strict, and humane. All warfare is based on deception. Therefore, when able to attack, we must seem unable; when using our forces, we must seem inactive; when we are near, we must make the enemy believe we are far away; when far away, we must make him believe we are near. The primary objective is to take all under heaven intact; that is strategy. To avoid protracted conflict and win quickly is the highest goal of the general. Therefore, the victorious warrior first wins and then seeks battle; the defeated warrior first battles and then seeks victory. It is only when victory is assured that one should engage in warfare. Strategy and intelligence are far more valuable than brute force in achieving ultimate victory." },
  { id: 102, title: "A Study in Scarlet (Excerpt)", type: "Fiction", content: "In the year 1878 I took my degree of Doctor of Medicine of the University of London, and proceeded to Netley to go through the course prescribed for army surgeons. There I was duly qualified to act as an Assistant Surgeon with the 5th Northumberland Fusiliers. The campaign brought honours and promotion to many, but for me it had nothing but misfortune and disaster. I was removed from the brigade and invalided home. My whole existence was a failure. Then I met Stamford, who introduced me to Sherlock Holmes. Holmes, a tall, thin man with piercing eyes, was engaged in chemical experiments at St. Bartholomew's Hospital. He proposed we share lodgings, and soon we moved into 221B Baker Street. It was here that I first observed his extraordinary deductive powers, leading to our first joint adventure when a letter arrived from Scotland Yard concerning a strange murder in an empty house. This incident cemented our partnership, as I, Dr. John Watson, realized I had found a fascinating subject and a remarkable friend in the eccentric consulting detective." },
  {
    id: 103,
    title: "Animal Farm (Orwell Summary)",
    type: "Fiction",
    content: "Old Major, the old boar on the Manor Farm, calls the animals on the farm for a meeting, where he compares the humans to parasites and teaches the animals a revolutionary song, 'Beasts of England'. When Major dies, two young pigs, Snowball and Napoleon, assume command and turn his dream into a philosophy called Animalism. The animals revolt and drive the drunken and irresponsible farmer Mr Jones from the farm, renaming it \"Animal Farm\". They adopt Seven Commandments of Animal-ism, the most important of which is, \"All animals are equal\". Snowball attempts to teach the animals reading and writing; initially, food is plentiful, and the farm runs smoothly under the collective effort. The pigs gradually elevate themselves to positions of leadership, setting aside special food items like apples and milk, ostensibly for their personal health and intellectual labor. Napoleon takes the pups from the farm dogs and trains them privately, establishing a private army. Napoleon and Snowball struggle for leadership over the farm's future, symbolized by Snowball's plan to build a windmill to generate electricity. When Snowball announces his detailed plans, Napoleon uses his trained dogs to chase Snowball away and declares himself the supreme leader. Napoleon enacts changes to the governance structure of the farm, replacing democratic meetings with a committee of pigs, who will unilaterally run the farm. Using a young pig named Squealer as a \"mouthpiece\", Napoleon claims credit for the windmill idea and twists history to paint Snowball as a traitor. The animals are forced to work harder than ever before, placated only by the promise of easier lives once the windmill is completed, and the Seven Commandments are slowly and subtly changed to justify the pigs' growing tyranny. The pigs begin trading with humans and even start walking on two legs, showing the revolution has failed and power has corrupted them absolutely.",
  },
  {
    id: 104,
    title: "Poor Folk / The Overcoat (Dostoevsky)",
    type: "Fiction",
    content: "Makar Devushkin, a poor and aging government clerk, is living a life similar to the main character in Gogol's 'The Overcoat', a fact that he finds personally disturbing as it reflects his own desperate condition. His neighbor, Varvara Dobroselova, who is also destitute, considers moving to another part of the city where she can work as a governess. Their entire correspondence forms the narrative, showcasing Devushkin's deep, paternal, and often agonizing love for Varvara, and his shame over his own poverty. Just as he is out of money and risks being evicted, Devushkin has a stroke of luck: his boss takes pity on him and gives him 100 rubles to buy new clothes, which temporarily restores his dignity. Devushkin pays off his immediate debts and sends some money to Varvara. She sends him 25 rubles back because she does not need it. The future looks briefly bright for both of them because he can now start to save money and it may be possible for them move in together. Devushkin finds himself liked by even the writer Ratazyayev, who was using him as a character in one of his stories because of his sad condition. Soon after, Dobroselova announces that a wealthy and mysterious Mr. Bykov, who had dealings with her previous benefactors, has proposed marriage. She decides to leave with him, sacrificing their shared poverty for security. The last few letters attest to her slowly becoming used to her new money and material comforts, discussing linens and various luxuries, leaving Devushkin alone in the end despite the fact that his lot was improving. The story ends with a final, heartbreaking letter from Devushkin: a desperate plea for her to come back to him or at least write from her new life, realizing he is now truly abandoned. The tragedy lies in Devushkin's ultimate isolation.",
  }
];

const LANGUAGES = [
    'English', 'Hindi', 'Spanish', 'French', 'German', 'Japanese', 'Russian', 'Mandarin (Simplified)'
];

// --- DECOUPLED COMPONENTS ---
// These components are now defined *outside* App, so they don't re-render unnecessarily.
// They get all their state and functions from `useContext(AppContext)`.

const SentimentGraph = ({ summaryData }) => {
  const { isDarkMode } = useContext(AppContext);
  const scores = summaryData?.sentimentScores || [0.6, 0.2, 0.9, 0.4, 0.7]; 

  // Use injected CSS variables
  const primaryLight = isDarkMode ? '#818cf8' : '#6366f1'; // indigo-400 / indigo-500
  const secondaryDark = isDarkMode ? '#a21caf' : '#d946ef'; // fuchsia-700 / fuchsia-500

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

    // Nav colors
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

const Home = () => {
    const { navigate } = useContext(AppContext);
    return (
        <div className="w-full">
            {/* TOP NAV (Light Mode Only) */}
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

            {/* HERO SECTION */}
            <section
                className="w-full py-20 px-6 text-center text-white"
                style={{
                    background: "linear-gradient(to right, #2b6cb0, #805ad5, #d53f8c)"
                }}
            >
                <h1 className="text-7xl font-extrabold mb-6 drop-shadow-lg">Narrato</h1>
                <h2 className="text-3xl font-semibold mb-6">
                    Read Smarter. Understand Deeper.
                </h2>
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
                    <div>
                        <p className="text-4xl font-extrabold">500+</p>
                        <p className="text-sm text-blue-100">Pages in Minutes</p>
                    </div>
                    <div>
                        <p className="text-4xl font-extrabold">95%</p>
                        <p className="text-sm text-blue-100">Accuracy</p>
                    </div>
                    <div>
                        <p className="text-4xl font-extrabold">10+</p>
                        <p className="text-sm text-blue-100">Analysis Types</p>
                    </div>
                    <div>
                        <p className="text-4xl font-extrabold">3min</p>
                        <p className="text-sm text-blue-100">Average Time</p>
                    </div>
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
        // We manage upload state locally
        uploadState, setUploadState, 
        targetLanguage, setTargetLanguage,
        handleFileChange, handleSelectBook, handleDragOver, handleDragLeave, handleDrop
    } = useContext(AppContext);

    // CSS Classes from App
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
      
      {/* FILE UPLOAD */}
      <div className={`p-6 rounded-xl ${CardClass} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} mb-8 shadow-inner`}>
          <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>1. Upload Your Own Text (.TXT Recommended)</h3>
          <div
              className={`relative border-2 border-dashed rounded-xl p-6 transition-colors ${InputClass} ${file ? 'border-indigo-500' : 'border-gray-500 hover:border-indigo-500'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
   _<ctrl63>