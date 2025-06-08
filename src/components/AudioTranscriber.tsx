'use client';

import React, { useState, useRef, useCallback } from 'react';

interface TranscriptionResult {
  text: string;
  chunks?: Array<{
    text: string;
    timestamp: [number, number];
  }>;
}

interface TranscriptionProgress {
  status: 'loading' | 'downloading' | 'transcribing' | 'complete' | 'error';
  progress?: number;
  message?: string;
}

export default function AudioTranscriber() {
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [progress, setProgress] = useState<TranscriptionProgress>({ status: 'loading' });
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugLogs, setShowDebugLogs] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize worker
  const initializeWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker('/transcription-worker.js');
      workerRef.current.onmessage = (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'progress':
            setProgress(data);
            break;
          case 'complete':
            setTranscription(data);
            setProgress({ status: 'complete' });
            setIsTranscribing(false);
            break;
          case 'error':
            console.error('Transcription error:', data);
            setProgress({ status: 'error', message: data.message || 'Transcription failed' });
            setIsTranscribing(false);
            break;
          case 'log':
            const logEntry = `[${new Date().toLocaleTimeString()}] ${data.message}`;
            console.log('🤖 Worker Log:', data.message, data.data);
            setDebugLogs(prev => [...prev.slice(-20), logEntry]); // Keep last 20 logs
            break;
        }
      };
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.startsWith('audio/') || droppedFile.type.startsWith('video/'))) {
      setFile(droppedFile);
      setTranscription(null);
      setProgress({ status: 'loading' });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setTranscription(null);
      setProgress({ status: 'loading' });
    }
  };

  // Audio preprocessing function (runs in main thread)
  const preprocessAudio = async (audioBuffer: ArrayBuffer, filename: string): Promise<Float32Array> => {
    setProgress({ 
      status: 'transcribing', 
      message: 'Decoding audio format...', 
      progress: 92 
    });

    // Create an AudioContext for processing
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Decode the audio data
    const audioData = await audioContext.decodeAudioData(audioBuffer);
    
    // Get audio info
    const duration = audioData.duration;
    const channels = audioData.numberOfChannels;
    const sampleRate = audioData.sampleRate;
    
    console.log(`🎵 Audio info: ${Math.round(duration)}s, ${channels} channels, ${sampleRate}Hz`);
    
    setProgress({
      status: 'transcribing',
      message: `Processing ${channels === 1 ? 'mono' : 'stereo'} audio (${Math.round(duration)}s, ${sampleRate}Hz)...`,
      progress: 93
    });
    
    // Convert to mono if stereo
    let audio: Float32Array;
    if (audioData.numberOfChannels === 2) {
      setProgress({
        status: 'transcribing',
        message: 'Converting stereo to mono audio...',
        progress: 94
      });
      
      const left = audioData.getChannelData(0);
      const right = audioData.getChannelData(1);
      audio = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++) {
        audio[i] = (left[i] + right[i]) / 2;
      }
    } else {
      audio = audioData.getChannelData(0);
    }

    // Resample to 16kHz if necessary
    const targetSampleRate = 16000;
    if (audioData.sampleRate !== targetSampleRate) {
      setProgress({
        status: 'transcribing',
        message: `Resampling audio from ${sampleRate}Hz to ${targetSampleRate}Hz...`,
        progress: 94.5
      });
      
      const resampleRatio = targetSampleRate / audioData.sampleRate;
      const resampledLength = Math.round(audio.length * resampleRatio);
      const resampled = new Float32Array(resampledLength);
      
      for (let i = 0; i < resampledLength; i++) {
        const srcIndex = i / resampleRatio;
        const srcIndexFloor = Math.floor(srcIndex);
        const srcIndexCeil = Math.min(srcIndexFloor + 1, audio.length - 1);
        const weight = srcIndex - srcIndexFloor;
        
        resampled[i] = audio[srcIndexFloor] * (1 - weight) + audio[srcIndexCeil] * weight;
      }
      
      audio = resampled;
    }

    setProgress({
      status: 'transcribing',
      message: 'Audio preprocessing complete, sending to AI model...',
      progress: 95
    });

    return audio;
  };

  const handleTranscribe = async () => {
    if (!file) return;
    
    try {
      setIsTranscribing(true);
      setDebugLogs([]); // Clear previous logs
      setProgress({ status: 'downloading', message: 'Preparing transcription model...' });
      
      initializeWorker();
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Preprocess audio in main thread (where AudioContext is available)
      const processedAudio = await preprocessAudio(arrayBuffer, file.name);
      
      // Set up a timeout to detect if worker gets stuck
      const timeout = setTimeout(() => {
        console.warn('⏰ Transcription seems to be taking longer than expected...');
        setProgress({ 
          status: 'downloading', 
          message: 'Download taking longer than expected... Check detailed progress below.',
          progress: 50 
        });
        setShowDebugLogs(true);
      }, 45000); // 45 seconds for model download
      
      if (workerRef.current) {
        console.log('🚀 Sending processed audio to worker...');
        workerRef.current.postMessage({
          type: 'transcribe',
          data: {
            audio: processedAudio,
            filename: file.name
          }
        });
        
        // Clear timeout if transcription completes
        const originalOnMessage = workerRef.current.onmessage;
        workerRef.current.onmessage = function(this: Worker, event: MessageEvent) {
          if (event.data.type === 'complete' || event.data.type === 'error') {
            clearTimeout(timeout);
          }
          if (originalOnMessage) {
            originalOnMessage.call(this, event);
          }
        };
      }
    } catch (error) {
      console.error('❌ Transcription error:', error);
      setProgress({ 
        status: 'error', 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClearFile = () => {
    setFile(null);
    setTranscription(null);
    setProgress({ status: 'loading' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyText = () => {
    if (transcription?.text) {
      navigator.clipboard.writeText(transcription.text);
    }
  };

  const handleDownloadTranscript = () => {
    if (transcription?.text) {
      const blob = new Blob([transcription.text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file?.name || 'audio'}-transcript.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatTimeToSRT = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  };

  const handleDownloadSRT = () => {
    if (transcription?.chunks && transcription.chunks.length > 0) {
      let srtContent = '';
      
      transcription.chunks.forEach((chunk, index) => {
        const startTime = formatTimeToSRT(chunk.timestamp[0]);
        const endTime = formatTimeToSRT(chunk.timestamp[1] || chunk.timestamp[0] + 5); // Default 5s if no end time
        
        srtContent += `${index + 1}\n`;
        srtContent += `${startTime} --> ${endTime}\n`;
        srtContent += `${chunk.text.trim()}\n\n`;
      });
      
      const blob = new Blob([srtContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file?.name || 'audio'}-transcript.srt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full space-y-8">
      {/* Main Upload Card */}
      <div 
        className={`glass-card rounded-2xl p-8 transition-all duration-300 ${
          isDragOver ? 'border-indigo-400 bg-white/20' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className="float mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-4xl">🎙️</span>
            </div>
          </div>
          
          {!file ? (
            <>
              <h3 className="text-2xl font-bold text-glass-primary mb-4">
                Drop your audio file here
              </h3>
              <p className="text-glass-secondary mb-6">
                Support for MP3, WAV, M4A, MP4, and more. AI-powered transcription running in your browser.
              </p>
              <div className="space-y-4">
                <button
                  onClick={handleChooseFile}
                  className="pulse-glow bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                >
                  Choose File
                </button>
                <p className="text-glass-muted text-sm">
                  or drag and drop your file here
                </p>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-glass-primary mb-4">
                File Ready for Transcription
              </h3>
              <div className="bg-white/10 rounded-xl p-4 mb-6">
                <p className="font-semibold text-glass-primary">{file.name}</p>
                <p className="text-glass-secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleTranscribe}
                  disabled={isTranscribing}
                  className="pulse-glow bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTranscribing ? 'Transcribing...' : 'Start Transcription'}
                </button>
                <button
                  onClick={handleClearFile}
                  className="glass-card text-glass-primary px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-200"
                >
                  Choose Different File
                </button>
              </div>
            </>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="audio/*,video/*"
          onChange={handleFileSelect}
        />
      </div>

      {/* Progress Section */}
      {isTranscribing && (
        <div className="glass-card rounded-2xl p-6">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-glass-primary mb-2">
              {progress.status === 'downloading' ? '🔽 Downloading AI Model' : 
               progress.status === 'transcribing' ? '🤖 Transcribing Audio' : 
               '⚡ Processing'}
            </h3>
            <p className="text-glass-secondary mb-2">
              {progress.message || 'Processing...'}
            </p>
            {progress.status === 'downloading' && progress.progress < 90 && (
              <p className="text-glass-muted text-sm">
                This may take a minute on first use. The model will be cached for future transcriptions.
              </p>
            )}
          </div>
          <div className="bg-white/20 rounded-full h-4 mb-3">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                progress.status === 'downloading' 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-500'
              }`}
              style={{ width: `${progress.progress || 0}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-glass-muted">
              {progress.status === 'downloading' ? 'Model Download' : 'Transcription'}
            </span>
            <span className="text-glass-primary font-mono">
              {progress.progress?.toFixed(1) ?? '0.0'}%
            </span>
          </div>
          {progress.status === 'downloading' && (
            <div className="mt-3 text-center">
              <div className="inline-flex items-center text-glass-muted text-xs">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-500 mr-2"></div>
                Downloading OpenAI Whisper components...
              </div>
              <div className="mt-2">
                <button
                  onClick={() => setShowDebugLogs(!showDebugLogs)}
                  className="text-glass-muted text-xs underline hover:text-glass-primary"
                >
                  {showDebugLogs ? 'Hide' : 'Show'} Detailed Progress
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Debug Logs Section */}
      {showDebugLogs && debugLogs.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <h4 className="text-sm font-semibold text-glass-primary mb-2">📊 Detailed Progress</h4>
          <div className="bg-black/50 rounded-lg p-3 max-h-48 overflow-y-auto">
            <div className="font-mono text-xs space-y-1">
              {debugLogs.map((log, index) => (
                <div key={index} className="text-green-400">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {progress.status === 'error' && (
        <div className="glass-card rounded-2xl p-6 border-red-400/50">
          <div className="text-center">
            <span className="text-4xl mb-4 block">⚠️</span>
            <h3 className="text-xl font-bold text-red-400 mb-2">Transcription Error</h3>
            <p className="text-glass-secondary">
              {progress.message || 'An error occurred during transcription. Please try again.'}
            </p>
          </div>
        </div>
      )}

      {/* Transcription Results */}
      {transcription && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-2xl font-bold text-glass-primary">
                  Transcription Complete
                </h3>
                <p className="text-glass-secondary">
                  Your audio has been successfully transcribed
                  {transcription?.chunks && transcription.chunks.length > 0 && (
                    <span className="block text-glass-muted text-xs mt-1">
                      Timestamps available - SRT export enabled
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleCopyText}
                  className="glass-card text-glass-primary px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-200 text-sm"
                >
                  📋 Copy
                </button>
                <button
                  onClick={handleDownloadTranscript}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 text-sm"
                >
                  💾 TXT
                </button>
                {transcription?.chunks && transcription.chunks.length > 0 && (
                  <button
                    onClick={handleDownloadSRT}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 text-sm"
                  >
                    🎬 SRT
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Full Transcription */}
          <div className="glass-card rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-glass-primary mb-4">Full Transcript</h4>
            <div className="bg-white/10 rounded-xl p-4 max-h-96 overflow-y-auto">
              <p className="text-glass-primary whitespace-pre-wrap leading-relaxed">
                {transcription.text}
              </p>
            </div>
          </div>

          {/* Timestamped Chunks */}
          {transcription.chunks && transcription.chunks.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-glass-primary mb-4">
                Timestamped Segments
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transcription.chunks.map((chunk, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-3 bg-white/10 rounded-lg hover:bg-white/15 transition-colors duration-200"
                  >
                    <span className="text-indigo-400 font-mono text-sm min-w-16 flex-shrink-0 mt-1">
                      {formatTime(chunk.timestamp[0])}
                    </span>
                    <span className="text-glass-primary leading-relaxed">
                      {chunk.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 