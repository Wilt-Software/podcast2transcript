'use client'

import { useState } from 'react'
import { PodcastEpisode, TimestampEntry } from '@/types/blog'
import { formatDuration } from '@/lib/seo'

interface TranscriptViewerProps {
  episode: PodcastEpisode
}

export default function TranscriptViewer({ episode }: TranscriptViewerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTimestamp, setSelectedTimestamp] = useState<string | null>(null)

  const filteredTimestamps = episode.timestamps.filter(timestamp =>
    timestamp.text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleTimestampClick = (timestamp: string) => {
    setSelectedTimestamp(timestamp)
    // Scroll to the timestamp
    const element = document.getElementById(`timestamp-${timestamp}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const highlightSearchTerm = (text: string) => {
    if (!searchTerm) return text
    
    const regex = new RegExp(`(${searchTerm})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <label htmlFor="transcript-search" className="sr-only">
              Search transcript
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="transcript-search"
                type="text"
                placeholder="Search transcript..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white/10 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-glass-muted">
            <span>{episode.timestamps.length} timestamps</span>
            {searchTerm && (
              <span>{filteredTimestamps.length} matches</span>
            )}
          </div>
        </div>
      </div>

      {/* Transcript Content */}
      <div className="glass-card rounded-xl p-6">
        <div className="space-y-4">
          {filteredTimestamps.length === 0 ? (
            <div className="text-center py-8 text-glass-muted">
              {searchTerm ? 'No matches found for your search.' : 'No transcript available.'}
            </div>
          ) : (
            filteredTimestamps.map((timestamp, index) => (
              <div
                key={`${timestamp.timestamp}-${index}`}
                id={`timestamp-${timestamp.timestamp}`}
                className={`flex gap-4 p-4 rounded-lg transition-all duration-200 ${
                  selectedTimestamp === timestamp.timestamp
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500'
                    : 'hover:bg-white/5'
                }`}
              >
                <button
                  onClick={() => handleTimestampClick(timestamp.timestamp)}
                  className="flex-shrink-0 text-indigo-600 hover:text-indigo-800 font-mono text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-md transition-colors"
                  title={`Jump to ${formatDuration(timestamp.timeInSeconds)}`}
                >
                  {timestamp.timestamp}
                </button>
                <div className="flex-1 text-glass-primary leading-relaxed">
                  {highlightSearchTerm(timestamp.text)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Navigation */}
      {filteredTimestamps.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex justify-between items-center text-sm text-glass-muted">
            <span>
              Showing {filteredTimestamps.length} of {episode.timestamps.length} timestamps
            </span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 