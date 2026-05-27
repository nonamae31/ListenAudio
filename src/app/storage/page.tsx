"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StoragePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/audio")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRecords(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load records", err);
        setIsLoading(false);
      });
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelect = (url: string) => {
    router.push(`/?url=${encodeURIComponent(url)}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Prevent triggering the row click
    if (window.confirm('Bạn có chắc muốn xóa lịch sử audio này?')) {
      try {
        const res = await fetch(`/api/audio?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          setRecords(records.filter(r => r.id !== id));
        } else {
          console.error("Failed to delete");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#0f1115] text-gray-100 flex flex-col items-center p-4 selection:bg-blue-500/30 font-sans relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0f1115] to-[#0f1115] -z-10 fixed" />
      
      <div className="w-full max-w-4xl bg-[#1c1f26]/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 md:p-10 shadow-2xl z-10 relative mt-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-2">Lịch sử nghe Audio</h1>
            <p className="text-gray-400 text-sm">Quản lý và tiếp tục nghe các file audio của bạn</p>
          </div>
          <Link href="/" className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl font-medium border border-gray-600 transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Quay lại Trình phát
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-20 bg-[#15171c] rounded-2xl border border-gray-700/50 border-dashed">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-400 mb-4">Chưa có lịch sử nghe audio nào.</p>
            <Link href="/" className="text-blue-400 hover:text-blue-300 font-medium">Bắt đầu nghe ngay &rarr;</Link>
          </div>
        ) : (
          <div className="grid gap-4 max-w-full">
            {records.map((record) => (
              <div 
                key={record.id} 
                onClick={() => handleSelect(record.url)}
                className="bg-[#15171c] border border-gray-700/50 hover:border-blue-500/50 rounded-xl p-5 cursor-pointer transition-all hover:bg-[#1a1d24] group relative overflow-hidden flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="w-10 h-10 shrink-0 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-blue-600 transition-colors hidden md:flex">
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                
                <div className="flex-1 min-w-0 overflow-hidden pr-2">
                  <p className="font-semibold text-gray-200 truncate group-hover:text-blue-400 transition-colors" title={record.url}>
                    {record.url.split('/').pop()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 truncate break-all">{record.url}</p>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-4 mt-2 md:mt-0 shrink-0">
                  <div className="text-right shrink-0">
                    <div className="bg-gray-800/80 px-3 py-1 rounded-md border border-gray-700 inline-block">
                      <span className="text-sm font-mono text-blue-300">{formatTime(record.lastPosition)}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 block">
                      {new Date(record.updatedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, record.id)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                    title="Xóa audio này"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
