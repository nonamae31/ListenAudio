"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function Home() {
  const [url, setUrl] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSavedTimeRef = useRef(0);

  useEffect(() => {
    // Không tự động load nữa, chỉ chờ người dùng nhập hoặc load từ URL parameters
    const query = new URLSearchParams(window.location.search);
    const paramUrl = query.get('url');
    if (paramUrl) {
      setInputUrl(paramUrl);
      setUrl(paramUrl);
    }
    setIsLoading(false);
  }, []);

  // Fetch status khi có URL
  useEffect(() => {
    if (!url) return;
    
    // Ghi nhận URL mới vào hệ thống (POST /api/audio)
    fetch("/api/audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }).catch(console.error);

    // Lấy trạng thái gần nhất
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

  const handlePlay = () => {
    if (!inputUrl.trim()) return;
    setUrl(inputUrl);
    if (inputUrl !== url) {
      lastSavedTimeRef.current = 0;
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current || !url) return;
    
    const currentTime = audioRef.current.currentTime;
    
    if (Math.abs(currentTime - lastSavedTimeRef.current) > 5) {
      lastSavedTimeRef.current = currentTime;
      fetch("/api/audio/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, lastPosition: currentTime }),
      }).catch((err) => console.error("Failed to save state", err));
    }
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

  return (
    <main className="min-h-screen bg-[#0f1115] text-gray-100 flex flex-col items-center justify-center p-4 selection:bg-blue-500/30 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0f1115] to-[#0f1115] -z-10" />
      
      <div className="w-full max-w-2xl bg-[#1c1f26]/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl z-10 relative">
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
            Lịch sử
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
                        <p className="text-xs text-emerald-400 font-medium">Auto-syncing</p>
                      </div>
                    </div>
                  </div>
                  
                  <audio
                    ref={audioRef}
                    src={url}
                    controls
                    autoPlay
                    className="w-full h-12 rounded-lg outline-none custom-audio-player mb-6"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                  />

                  {/* Playback rate controls */}
                  <div className="bg-[#1c1f26] rounded-xl p-4 border border-gray-700/50">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-300">Tốc độ phát (Playback Rate)</label>
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
                        <span className="text-sm font-medium text-gray-400">x</span>
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
                    <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                      <span>1x</span>
                      <span>2x</span>
                      <span>3x</span>
                      <span>4x</span>
                      <span>5x</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
