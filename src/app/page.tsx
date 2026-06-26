"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// History interface
interface AudioRecord {
  id: string;
  url: string;
  lastPosition: number;
  updatedAt: string;
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [seekTime, setSeekTime] = useState("");
  const [history, setHistory] = useState<AudioRecord[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSavedTimeRef = useRef(0);

  const loadHistory = () => {
    fetch("/api/audio")
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(console.error);
  };

  useEffect(() => {
    loadHistory();
    const paramUrl = searchParams.get('url');
    if (paramUrl) {
      setInputUrl(paramUrl);
      setUrl(paramUrl);
    }
    setIsLoading(false);
  }, [searchParams]);

  useEffect(() => {
    if (!url) return;
    
    fetch("/api/audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
    .then(() => loadHistory())
    .catch(console.error);

    fetch(`/api/audio/status?url=${encodeURIComponent(url)}`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.lastPosition === 'number') {
          lastSavedTimeRef.current = data.lastPosition;
          if (audioRef.current) {
            audioRef.current.currentTime = data.lastPosition;
          }
        }
      })
      .catch(console.error);
  }, [url]);

  // Keepalive unmount logic (E1, FE-003)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (url && audioRef.current) {
         const currentTime = audioRef.current.currentTime;
         const blob = new Blob([JSON.stringify({ url, lastPosition: currentTime })], { type: 'application/json' });
         navigator.sendBeacon('/api/audio/status', blob);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      handleBeforeUnload(); 
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [url]);

  const handlePlay = () => {
    if (!inputUrl.trim()) return;
    setUrl(inputUrl);
    if (inputUrl !== url) {
      lastSavedTimeRef.current = 0;
    }
  };

  const handleSaveTime = () => {
    if (!audioRef.current || !url) return;
    const currentTime = audioRef.current.currentTime;
    lastSavedTimeRef.current = currentTime;
    fetch("/api/audio/status", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, lastPosition: currentTime }),
    }).catch(console.error);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      if (lastSavedTimeRef.current > 0) {
        audioRef.current.currentTime = lastSavedTimeRef.current;
      }
      audioRef.current.playbackRate = playbackRate;
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleManualSeek = () => {
    if (!audioRef.current || !seekTime) return;
    const parts = seekTime.split(':').reverse();
    let timeInSeconds = 0;
    for (let i = 0; i < parts.length; i++) {
      timeInSeconds += parseInt(parts[i] || '0', 10) * Math.pow(60, i);
    }
    if (!isNaN(timeInSeconds)) {
      audioRef.current.currentTime = timeInSeconds;
    }
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    fetch(`/api/audio?id=${id}`, { method: 'DELETE' })
      .then(() => loadHistory())
      .catch(console.error);
  };

  // Keyboard Shortcuts (E2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!audioRef.current) return;
      
      switch(e.code) {
        case 'Space':
          e.preventDefault();
          if (audioRef.current.paused) audioRef.current.play();
          else audioRef.current.pause();
          break;
        case 'ArrowLeft':
          audioRef.current.currentTime -= 10;
          break;
        case 'ArrowRight':
          audioRef.current.currentTime += 10;
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full max-w-2xl bg-[#1c1f26]/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl z-10 relative my-8">
      <div className="flex justify-between items-start mb-6">
        <div className="text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2 drop-shadow-sm">
            Listen<span className="text-blue-400">Audio</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-md">
            Đồng bộ trạng thái nghe tự động.
          </p>
        </div>
        <Link href="/storage" className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-600 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          Lịch sử cũ
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="url-input" className="block text-sm font-semibold text-gray-300 ml-1">
              Đường dẫn Audio (URL)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="url-input"
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://.../tap-2.mp3"
                className="flex-1 bg-[#15171c] border border-gray-600 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
              />
              <button
                onClick={handlePlay}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 whitespace-nowrap"
              >
                Phát Audio
              </button>
            </div>
          </div>

          {url && (
            <div className="pt-6 border-t border-gray-700/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-[#15171c] rounded-2xl p-6 border border-gray-700/50 shadow-inner">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-100 truncate" title={url}>
                      {url.split('/').pop() || "Đang phát..."}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <p className="text-xs text-emerald-400 font-medium">Synced on Pause/Stop</p>
                    </div>
                  </div>
                </div>
                
                <audio
                  ref={audioRef}
                  src={url}
                  controls
                  autoPlay
                  className="w-full h-12 rounded-lg outline-none custom-audio-player mb-6"
                  onPause={handleSaveTime}
                  onEnded={handleSaveTime}
                  onLoadedMetadata={handleLoadedMetadata}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Playback rate controls */}
                  <div className="bg-[#1c1f26] rounded-xl p-4 border border-gray-700/50">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-300">Tốc độ phát</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="1" 
                          max="5" 
                          step="0.1" 
                          value={playbackRate}
                          onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
                          className="bg-[#0f1115] border border-gray-600 rounded px-2 py-1 text-sm text-white w-16 text-center focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      step="0.1"
                      value={playbackRate}
                      onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
                      className="w-full accent-blue-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Manual Seek Input */}
                  <div className="bg-[#1c1f26] rounded-xl p-4 border border-gray-700/50">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Chuyển đến thời gian</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={seekTime}
                        onChange={(e) => setSeekTime(e.target.value)}
                        placeholder="VD: 1:30:00"
                        className="bg-[#0f1115] border border-gray-600 rounded-lg px-3 py-2 text-sm text-white flex-1 focus:outline-none focus:border-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleManualSeek()}
                      />
                      <button 
                        onClick={handleManualSeek}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Đến
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History UI */}
          <div className="pt-6 mt-4">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-200">Lịch sử nghe</h2>
                {history.length > 0 && (
                   <button 
                     onClick={() => {
                        Promise.all(history.map(item => fetch(`/api/audio?id=${item.id}`, { method: 'DELETE' })))
                        .then(() => loadHistory());
                     }}
                     className="text-sm text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded border border-red-500/30 hover:bg-red-500/10"
                   >
                     Xoá tất cả
                   </button>
                )}
             </div>
             
             {history.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4 bg-[#15171c] rounded-xl border border-gray-800">Chưa có lịch sử nào.</p>
             ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                   {history.map((item) => (
                      <div key={item.id} 
                           onClick={() => {
                              setInputUrl(item.url);
                              setUrl(item.url);
                           }}
                           className="flex items-center justify-between bg-[#15171c] border border-gray-700/50 hover:border-blue-500/50 rounded-xl p-4 cursor-pointer transition-colors group shadow-sm">
                         <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-medium text-gray-200 truncate pr-4" title={item.url}>{item.url.split('/').pop()}</span>
                            <span className="text-xs text-blue-400 mt-1">Dừng tại: {formatTime(item.lastPosition)}</span>
                         </div>
                         <button 
                           onClick={(e) => handleDeleteHistory(item.id, e)}
                           className="text-gray-500 hover:text-red-400 opacity-50 group-hover:opacity-100 transition-opacity p-2 ml-2 bg-gray-800 rounded hover:bg-gray-700"
                           title="Xóa lịch sử này"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                      </div>
                   ))}
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f1115] text-gray-100 flex flex-col items-center justify-start py-10 px-4 selection:bg-blue-500/30 font-sans relative overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0f1115] to-[#0f1115] -z-10" />
      <Suspense fallback={
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }>
        <HomeContent />
      </Suspense>
    </main>
  );
}
