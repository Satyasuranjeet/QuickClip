import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createClip, deleteClip } from '../api/clipboardApi';

const ShareText = () => {
  const [text, setText] = useState('');
  const [timer, setTimer] = useState(60); // Default 60 seconds
  const [generatedCode, setGeneratedCode] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialTimer, setInitialTimer] = useState(60);

  const timerOptions = [
    { value: 30, label: '30 seconds' },
    { value: 60, label: '1 minute' },
    { value: 120, label: '2 minutes' },
    { value: 300, label: '5 minutes' },
    { value: 600, label: '10 minutes' },
  ];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (generatedCode && isSharing && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            setGeneratedCode('');
            setIsSharing(false);
            setText('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [generatedCode, isSharing, remainingTime]);

  const handleShare = async () => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await createClip({ text, timer });
      setGeneratedCode(result.code);
      setRemainingTime(timer);
      setInitialTimer(timer);
      setIsSharing(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create clip');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = async () => {
    if (generatedCode) {
      try {
        await deleteClip(generatedCode);
      } catch {
        // Ignore delete errors
      }
    }
    setGeneratedCode('');
    setIsSharing(false);
    setText('');
    setRemainingTime(0);
    setError('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (remainingTime <= 10) return 'text-red-500';
    if (remainingTime <= 30) return 'text-yellow-500';
    return 'text-cyan-400';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      
      {/* Gradient orb */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>

      <div className="max-w-lg w-full relative z-10">
        <Link
          to="/"
          className="inline-flex items-center text-gray-500 hover:text-gray-300 mb-6 transition-colors text-sm"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <div className="bg-[#12121a] border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white">Share Text</h1>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {!isSharing ? (
            <>
              <div className="mb-5">
                <label className="block text-gray-400 mb-2 text-sm font-medium">
                  Your Text
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste or type your text here..."
                  className="w-full h-36 bg-[#1a1a24] border border-gray-800 rounded-xl p-4 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-none text-sm font-mono transition-colors"
                />
                <p className="text-gray-600 text-xs mt-2">
                  {text.length.toLocaleString()} characters
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-gray-400 mb-2 text-sm font-medium">
                  Expires In
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {timerOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTimer(option.value)}
                      className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                        timer === option.value
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-[#1a1a24] text-gray-500 border border-gray-800 hover:border-gray-700 hover:text-gray-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleShare}
                disabled={!text.trim() || isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center text-sm"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Generate Secure Code
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className="mb-6">
                <p className="text-gray-500 text-sm mb-3">Your secure code</p>
                <div className="bg-[#1a1a24] border border-gray-800 rounded-xl p-6 mb-4">
                  <div className="text-3xl font-mono font-bold text-emerald-400 tracking-[0.3em]">
                    {generatedCode}
                  </div>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="bg-[#1a1a24] hover:bg-[#22222e] border border-gray-800 text-gray-300 font-medium py-2 px-5 rounded-lg transition-all inline-flex items-center text-sm"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Code
                    </>
                  )}
                </button>
              </div>

              <div className="mb-6">
                <div className={`text-4xl font-mono font-bold ${getTimerColor()} mb-1`}>
                  {formatTime(remainingTime)}
                </div>
                <p className="text-gray-600 text-xs">Time remaining</p>
                <div className="w-full bg-gray-800 rounded-full h-1 mt-4">
                  <div
                    className="bg-emerald-500 h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${(remainingTime / initialTimer) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#1a1a24] border border-gray-800 rounded-xl p-4 mb-6 text-left">
                <p className="text-gray-600 text-xs mb-2">Preview</p>
                <p className="text-gray-400 text-sm font-mono line-clamp-2">
                  {text.length > 100 ? text.substring(0, 100) + '...' : text}
                </p>
              </div>

              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-red-400 text-sm font-medium transition-colors"
              >
                Cancel & Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareText;
