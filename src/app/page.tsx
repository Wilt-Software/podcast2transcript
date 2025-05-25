'use client';

import { useState } from 'react';
import Image from "next/image";

export default function Home() {
  const [isDragOver, setIsDragOver] = useState(false);

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
    // Handle file drop logic here
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold gradient-text">PodScript</h1>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="text-glass-nav hover:text-white transition-colors duration-200">
                  Features
                </a>
                <a href="#pricing" className="text-glass-nav hover:text-white transition-colors duration-200">
                  Pricing
                </a>
                <a href="#faq" className="text-glass-nav hover:text-white transition-colors duration-200">
                  FAQ
                </a>
              </div>
            </div>
            <div>
              <button className="glass px-4 py-2 rounded-lg text-glass-nav hover:bg-white/20 transition-all duration-200">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">Podcast Transcription</span>
              <br />
              <span className="text-glass-white">Made Simple</span>
            </h1>
            <p className="text-xl md:text-2xl text-glass-nav mb-12 max-w-3xl mx-auto">
              Lightning-fast, AI-powered transcription and summarization. 
              Transform your audio content in minutes, not hours.
            </p>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="glass-card px-6 py-3 rounded-full">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">⚡</span>
                  <span className="text-glass-primary font-medium">1-hour audio in 1 minute</span>
                </div>
              </div>
              <div className="glass-card px-6 py-3 rounded-full">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">💰</span>
                  <span className="text-glass-primary font-medium">$0.06/min + $1/file</span>
                </div>
              </div>
              <div className="glass-card px-6 py-3 rounded-full">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🌍</span>
                  <span className="text-glass-primary font-medium">7 Languages</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="max-w-4xl mx-auto">
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
                <h3 className="text-2xl font-bold text-glass-primary mb-4">
                  Drop your audio file here
                </h3>
                <p className="text-glass-secondary mb-6">
                  Support for MP3, WAV, M4A, and more. Up to 2GB file size.
                </p>
                <div className="space-y-4">
                  <button className="pulse-glow bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
                    Choose File
                  </button>
                  <p className="text-glass-muted text-sm">
                    or drag and drop your file here
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-glass-white mb-4">How it works</h2>
            <p className="text-xl text-glass-nav">
              Simple, fast, and accurate transcription in three easy steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-card rounded-xl p-8 text-center hover:bg-white/15 transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-bold text-glass-primary mb-4">
                Automatic Language Detection
              </h3>
              <p className="text-glass-secondary">
                English, Spanish, French, German, Italian, Portuguese, and Dutch. 
                We automatically detect the language in your audio.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card rounded-xl p-8 text-center hover:bg-white/15 transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">📁</span>
              </div>
              <h3 className="text-xl font-bold text-glass-primary mb-4">
                Multiple Formats
              </h3>
              <p className="text-glass-secondary">
                Support for aac, flac, mp3, wav, m4a, mp4, mov, and many more 
                audio and video formats.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card rounded-xl p-8 text-center hover:bg-white/15 transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
              <h3 className="text-xl font-bold text-glass-primary mb-4">
                Export Options
              </h3>
              <p className="text-glass-secondary">
                Get your transcripts in plain text, SRT, VTT, or JSON format. 
                Plus AI-generated summaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-glass-white mb-8">Simple Pricing</h2>
          <div className="glass-card rounded-2xl p-8 mb-8">
            <div className="text-6xl font-bold gradient-text mb-4">$0.06</div>
            <div className="text-xl text-glass-primary mb-2">per minute</div>
            <div className="text-glass-secondary mb-6">+ $1 per file</div>
            <div className="text-glass-primary">
              <p className="mb-2">✓ No subscription required</p>
              <p className="mb-2">✓ Pay only for what you use</p>
              <p className="mb-2">✓ Lightning-fast processing</p>
              <p>✓ Multiple export formats</p>
            </div>
          </div>
          <p className="text-glass-nav">
            Example: A 30-minute podcast costs $2.80 ($0.06 × 30 + $1)
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-glass-white text-center mb-16">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            {[
              {
                question: "How long does transcription take?",
                answer: "We can transcribe a 60-minute audio file in less than 1 minute. Processing time scales with file length."
              },
              {
                question: "What file formats do you support?",
                answer: "We support all common audio and video formats including MP3, WAV, M4A, MP4, MOV, and many more."
              },
              {
                question: "How accurate are the transcriptions?",
                answer: "Our AI-powered transcription achieves 95%+ accuracy for clear audio with minimal background noise."
              },
              {
                question: "Do you offer refunds?",
                answer: "All sales are final. We recommend testing with a short file first to ensure our service meets your needs."
              }
            ].map((faq, index) => (
              <div key={index} className="glass-card rounded-xl p-6">
                <h3 className="text-xl font-bold text-glass-primary mb-3">{faq.question}</h3>
                <p className="text-glass-secondary">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-nav mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold gradient-text mb-4">PodScript</h3>
              <p className="text-glass-nav mb-4">
                Lightning-fast, cost-effective podcast transcription and summarization.
              </p>
            </div>
            <div>
              <h4 className="text-glass-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-glass-nav">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-glass-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-glass-nav">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-glass-nav">
            <p>&copy; 2025 PodScript. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
