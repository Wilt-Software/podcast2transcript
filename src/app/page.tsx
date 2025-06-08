'use client';


import Link from 'next/link';
import AudioTranscriber from '@/components/AudioTranscriber';

export default function Home() {

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navHeight = 64; // Height of the fixed navigation
      const elementPosition = element.offsetTop - navHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold gradient-text">Podcast2Transcript</h1>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link 
                  href="/blog"
                  className="text-glass-nav hover:text-gray-600 transition-colors duration-200"
                >
                  Blog
                </Link>
                <button 
                  onClick={() => scrollToSection('features')} 
                  className="text-glass-nav hover:text-gray-600 transition-colors duration-200 cursor-pointer"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('pricing')} 
                  className="text-glass-nav hover:text-gray-600 transition-colors duration-200 cursor-pointer"
                >
                  Pricing
                </button>
                <button 
                  onClick={() => scrollToSection('faq')} 
                  className="text-glass-nav hover:text-gray-600 transition-colors duration-200 cursor-pointer"
                >
                  FAQ
                </button>
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
              <span className="text-glass-primary">Made Simple</span>
            </h1>
            <p className="text-xl md:text-2xl text-glass-secondary mb-12 max-w-3xl mx-auto">
              Lightning-fast, AI-powered transcription running entirely in your browser. 
              Transform your audio content with complete privacy and security.
            </p>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="glass-card px-6 py-3 rounded-full">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🔒</span>
                  <span className="text-glass-primary font-medium">100% Private & Secure</span>
                </div>
              </div>
              <div className="glass-card px-6 py-3 rounded-full">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🚀</span>
                  <span className="text-glass-primary font-medium">AI-Powered Whisper</span>
                </div>
              </div>
              <div className="glass-card px-6 py-3 rounded-full">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">💯</span>
                  <span className="text-glass-primary font-medium">Completely Free</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transcription Section */}
          <div className="max-w-4xl mx-auto">
            <AudioTranscriber />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-glass-primary mb-4">How it works</h2>
            <p className="text-xl text-glass-secondary">
              Simple, fast, and accurate transcription in three easy steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-card rounded-xl p-8 text-center hover:bg-white/15 transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-bold text-glass-primary mb-4">
                Complete Privacy
              </h3>
              <p className="text-glass-secondary">
                Your audio files never leave your device. All processing happens 
                locally in your browser using cutting-edge WebAssembly technology.
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
                <span className="text-2xl">⏱️</span>
              </div>
              <h3 className="text-xl font-bold text-glass-primary mb-4">
                Timestamped Transcripts
              </h3>
              <p className="text-glass-secondary">
                Get precise timestamps for each segment, making it easy to navigate 
                and reference specific parts of your audio content.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-glass-primary mb-8">Completely Free</h2>
          <div className="glass-card rounded-2xl p-8 mb-8">
            <div className="text-6xl font-bold gradient-text mb-4">$0</div>
            <div className="text-xl text-glass-primary mb-2">Forever</div>
            <div className="text-glass-secondary mb-6">No subscriptions, no hidden fees</div>
            <div className="text-glass-primary">
              <p className="mb-2">✓ Unlimited transcriptions</p>
              <p className="mb-2">✓ Complete privacy protection</p>
              <p className="mb-2">✓ OpenAI Whisper accuracy</p>
              <p>✓ Timestamped transcripts</p>
            </div>
          </div>
          <p className="text-glass-secondary">
            Powered by cutting-edge in-browser AI technology
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-glass-primary text-center mb-16">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            {[
              {
                question: "Is my audio data really private?",
                answer: "Absolutely! Your audio files never leave your device. All processing happens locally in your browser using WebAssembly technology."
              },
              {
                question: "What file formats do you support?",
                answer: "We support all common audio formats including MP3, WAV, M4A, FLAC, OGG, and WEBM."
              },
              {
                question: "How accurate are the transcriptions?",
                answer: "We use OpenAI's Whisper model, which achieves state-of-the-art accuracy for speech recognition across multiple languages."
              },
              {
                question: "Do I need to install anything?",
                answer: "No installation required! Everything runs directly in your web browser. Just upload your audio file and start transcribing."
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
              <h3 className="text-2xl font-bold gradient-text mb-4">Podcast2Transcript</h3>
              <p className="text-glass-secondary mb-4">
                Lightning-fast, cost-effective podcast transcription and summarization.
              </p>
            </div>
            <div>
              <h4 className="text-glass-primary font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-glass-secondary">
                <li><a href="#" className="hover:text-glass-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-glass-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-glass-primary transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-glass-primary font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-glass-secondary">
                <li><a href="#" className="hover:text-glass-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-glass-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-glass-primary transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-glass-secondary">
            <p>&copy; 2025 Podcast2Transcript. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
