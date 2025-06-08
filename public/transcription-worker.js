// Web Worker for audio transcription using Transformers.js
console.log('🔧 Transcription Worker: Starting initialization...');

// Global variables
let transcriber = null;
let transformersLoaded = false;

// Track download progress for multiple files
let downloadedFiles = new Set();
let totalFilesToDownload = 0;
let currentFileProgress = {};

// Enhanced logging function
function log(message, data = null) {
  console.log(`🤖 [Worker] ${message}`, data || '');
  self.postMessage({
    type: 'log',
    data: { message, data }
  });
}

// Load Transformers.js dynamically with better error handling
async function loadTransformers() {
  if (transformersLoaded) {
    log('Transformers.js already loaded');
    return;
  }
  
  try {
    log('Loading Transformers.js from CDN...');
    self.postMessage({
      type: 'progress',
      data: {
        status: 'downloading',
        message: 'Loading Transformers.js library...',
        progress: 1
      }
    });
    
    // Import with error handling
    const transformersModule = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js');
    const { pipeline, env } = transformersModule;
    
    // Configure environment
    env.allowRemoteModels = true;
    env.allowLocalModels = false;
    env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/';
    
    // Store globally for use
    self.pipeline = pipeline;
    self.env = env;
    
    transformersLoaded = true;
    log('✅ Transformers.js loaded successfully');
    
    self.postMessage({
      type: 'progress',
      data: {
        status: 'downloading',
        message: 'Transformers.js library loaded successfully!',
        progress: 5
      }
    });
    
  } catch (error) {
    log('❌ Failed to load Transformers.js', error);
    throw new Error(`Failed to load Transformers.js: ${error.message}`);
  }
}

// Initialize the transcription pipeline
async function initializeTranscriber() {
  try {
    if (!transcriber) {
      log('🚀 Starting transcriber initialization...');
      
      // First load Transformers.js
      await loadTransformers();
      
      self.postMessage({
        type: 'progress',
        data: {
          status: 'downloading',
          message: 'Initializing OpenAI Whisper model...',
          progress: 10
        }
      });

      log('📦 Creating Whisper pipeline...');
      
      // Create automatic speech recognition pipeline
      transcriber = await self.pipeline('automatic-speech-recognition', 'Xenova/whisper-small', {
        dtype: 'fp32',
        device: 'wasm',
        revision: 'main',
        progress_callback: (progress) => {
          log(`📥 Download progress: ${progress.status} - ${progress.file}`, progress);
          handleDownloadProgress(progress);
        }
      });

      log('✅ Whisper model initialized successfully!');
      
      self.postMessage({
        type: 'progress',
        data: {
          status: 'downloading',
          message: 'Whisper model loaded successfully! Ready for transcription...',
          progress: 95
        }
      });
    } else {
      log('♻️ Transcriber already initialized, reusing cached model');
    }
  } catch (error) {
    log('❌ Error initializing transcriber', error);
    console.error('Error initializing transcriber:', error);
    self.postMessage({
      type: 'error',
      data: { message: 'Failed to initialize transcription model: ' + error.message }
    });
  }
}

// Enhanced download progress handler with detailed logging
function handleDownloadProgress(progress) {
  log(`📊 Progress update: ${progress.status}`, progress);
  
  if (progress.status === 'downloading') {
    const fileName = progress.file;
    const loaded = progress.loaded;
    const total = progress.total;
    const fileProgress = Math.round((loaded / total) * 100);
    
    // Update current file progress
    currentFileProgress[fileName] = fileProgress;
    
    // Determine file type for better messaging
    let fileDescription = fileName;
    if (fileName.includes('config.json')) {
      fileDescription = 'Model configuration';
    } else if (fileName.includes('tokenizer.json')) {
      fileDescription = 'Text tokenizer';
    } else if (fileName.includes('preprocessor_config.json')) {
      fileDescription = 'Audio preprocessor';
    } else if (fileName.includes('.bin') || fileName.includes('.safetensors')) {
      fileDescription = 'Neural network weights';
    } else if (fileName.includes('generation_config.json')) {
      fileDescription = 'Generation settings';
    } else if (fileName.includes('.onnx')) {
      fileDescription = 'ONNX model file';
    }
    
    // Format file size
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    let message;
    if (fileProgress < 100) {
      message = `Downloading ${fileDescription}: ${fileProgress}% (${formatBytes(loaded)} / ${formatBytes(total)})`;
      log(`📥 ${fileDescription}: ${fileProgress}% - ${formatBytes(loaded)}/${formatBytes(total)}`);
    } else {
      downloadedFiles.add(fileName);
      message = `✓ Downloaded ${fileDescription}`;
      log(`✅ Completed: ${fileDescription}`);
    }
    
    // Calculate overall progress (10-90% reserved for downloading)
    const baseProgress = 15;
    const downloadRange = 75;
    const overallProgress = baseProgress + Math.round((fileProgress * downloadRange) / 100);
    
    log(`📈 Overall progress: ${Math.min(overallProgress, 90)}%`);
    
    self.postMessage({
      type: 'progress',
      data: {
        status: 'downloading',
        message: message,
        progress: Math.min(overallProgress, 90)
      }
    });
  } else if (progress.status === 'ready') {
    log('🎉 All model components ready!');
    self.postMessage({
      type: 'progress',
      data: {
        status: 'downloading',
        message: 'All model components loaded and ready!',
        progress: 90
      }
    });
  } else if (progress.status === 'initiate') {
    log('🔄 Starting download process...');
    self.postMessage({
      type: 'progress',
      data: {
        status: 'downloading',
        message: 'Starting model download...',
        progress: 12
      }
    });
  } else if (progress.status === 'progress') {
    // Handle generic progress updates without specific file info
    log(`📊 General progress update: ${progress.progress || 'N/A'}%`);
  } else if (progress.status === 'done') {
    // Handle completion status
    log('✅ Download component completed');
  } else {
    log(`🔍 Unknown progress status: ${progress.status}`, progress);
  }
}

// Audio is now preprocessed in the main thread, so this function just validates the input
function validateAudioInput(audioData, filename) {
  log(`🎵 Received preprocessed audio data for: ${filename}`);
  log(`📊 Audio data length: ${audioData.length} samples`);
  
  if (!audioData || audioData.length === 0) {
    throw new Error('Invalid audio data received');
  }
  
  if (!(audioData instanceof Float32Array)) {
    log('⚠️ Converting audio data to Float32Array...');
    audioData = new Float32Array(audioData);
  }
  
  log('✅ Audio data validation complete');
  return audioData;
}

// Handle transcription
async function transcribeAudio(audioData, filename) {
  try {
    // Initialize transcriber if not already done
    self.postMessage({
      type: 'progress',
      data: {
        status: 'downloading',
        message: 'Preparing Whisper AI model...',
        progress: 0
      }
    });
    
    await initializeTranscriber();

    // Step 1: Validate audio input
    self.postMessage({
      type: 'progress',
      data: {
        status: 'transcribing',
        message: `Validating preprocessed audio: ${filename}`,
        progress: 96
      }
    });

    const audio = validateAudioInput(audioData, filename);

    // Step 2: Running transcription
    // Calculate audio duration for progress estimation
    const sampleRate = 16000; // We resampled to 16kHz
    const durationSeconds = audio.length / sampleRate;
    const estimatedMinutes = Math.ceil(durationSeconds / 60);
    
    self.postMessage({
      type: 'progress',
      data: {
        status: 'transcribing',
        message: `Analyzing ${Math.round(durationSeconds)}s of audio with Whisper AI...`,
        progress: 97
      }
    });

    log(`🤖 Starting Whisper transcription for ${durationSeconds.toFixed(1)}s of audio...`);
    
    // Create a progress tracking wrapper
    let lastProgressUpdate = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - lastProgressUpdate;
      // Estimate progress based on typical processing speed (usually 4-10x faster than real-time)
      const estimatedProgress = Math.min(99, 97 + (elapsed / (durationSeconds * 100))); // Very conservative estimate
      
      self.postMessage({
        type: 'progress',
        data: {
          status: 'transcribing',
          message: `Processing ${estimatedMinutes}min audio - Whisper AI analyzing speech patterns...`,
          progress: estimatedProgress
        }
      });
    }, 2000); // Update every 2 seconds
    
    let result;
    try {
      // Run transcription with progress tracking
      result = await transcriber(audio, {
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5,
        language: 'english',
        task: 'transcribe'
      });
      
      clearInterval(progressInterval);
      
      self.postMessage({
        type: 'progress',
        data: {
          status: 'transcribing',
          message: 'Whisper AI transcription completed! Processing results...',
          progress: 98.5
        }
      });
      
      log('✅ Whisper transcription completed');
      
    } catch (error) {
      clearInterval(progressInterval);
      log('❌ Whisper transcription failed', error);
      throw error;
    }

    // Step 3: Processing results
    self.postMessage({
      type: 'progress',
      data: {
        status: 'transcribing',
        message: 'Finalizing transcript with timestamps...',
        progress: 99
      }
    });

    // Format the result
    const transcriptionResult = {
      text: result.text,
      chunks: result.chunks ? result.chunks.map(chunk => ({
        text: chunk.text,
        timestamp: chunk.timestamp
      })) : undefined
    };

    log(`📝 Transcription result: ${result.text.length} characters`);

    // Completion
    self.postMessage({
      type: 'progress',
      data: {
        status: 'complete',
        message: 'Transcription completed successfully!',
        progress: 100
      }
    });

    self.postMessage({
      type: 'complete',
      data: transcriptionResult
    });

  } catch (error) {
    log('❌ Transcription failed', error);
    console.error('Transcription error:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Transcription failed';
    if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error.toString) {
      errorMessage = error.toString();
    }
    
    log(`💥 Error details: ${errorMessage}`);
    
    self.postMessage({
      type: 'error',
      data: { 
        message: errorMessage,
        details: {
          name: error.name || 'Unknown',
          stack: error.stack || 'No stack trace available'
        }
      }
    });
  }
}

// Handle messages from main thread
self.onmessage = async (event) => {
  const { type, data } = event.data;
  
  log(`📨 Received message: ${type}`, data);
  
  switch (type) {
    case 'transcribe':
      log(`🎵 Starting transcription for: ${data.filename}`);
      await transcribeAudio(data.audio, data.filename);
      break;
    default:
      log(`⚠️ Unknown message type: ${type}`);
      console.warn('Unknown message type:', type);
  }
};

// Handle errors
self.onerror = (error) => {
  log('💥 Worker error occurred', error);
  console.error('Worker error:', error);
  self.postMessage({
    type: 'error',
    data: { message: 'Worker error: ' + error.message }
  });
};

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  log('💥 Unhandled promise rejection', event.reason);
  console.error('Unhandled promise rejection:', event.reason);
  self.postMessage({
    type: 'error',
    data: { message: 'Unhandled error: ' + event.reason }
  });
});

// Signal that worker is ready
log('✅ Transcription worker started and ready');
self.postMessage({
  type: 'progress',
  data: {
    status: 'loading',
    message: 'Transcription worker initialized and ready',
    progress: 0
  }
}); 