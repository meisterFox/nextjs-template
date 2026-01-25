'use client'

import { useState, useEffect } from 'react'

export const Settings = () => {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [musicEnabled, setMusicEnabled] = useState(false)
  const [volume, setVolume] = useState(50)
  const [selectedSound, setSelectedSound] = useState('click1')

  // Load settings from localStorage
  useEffect(() => {
    const settings = localStorage.getItem('siteSettings')
    if (settings) {
      const parsed = JSON.parse(settings)
      setSoundEnabled(parsed.soundEnabled ?? true)
      setMusicEnabled(parsed.musicEnabled ?? false)
      setVolume(parsed.volume ?? 50)
      setSelectedSound(parsed.selectedSound ?? 'click1')
    }
  }, [])

  // Save settings to localStorage
  const saveSettings = (newSettings: any) => {
    const settings = {
      soundEnabled,
      musicEnabled,
      volume,
      selectedSound,
      ...newSettings,
    }
    localStorage.setItem('siteSettings', JSON.stringify(settings))
  }

  const handleSoundToggle = () => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    saveSettings({ soundEnabled: newValue })
  }

  const handleMusicToggle = () => {
    const newValue = !musicEnabled
    setMusicEnabled(newValue)
    saveSettings({ musicEnabled: newValue })
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    saveSettings({ volume: newVolume })
  }

  const handleSoundChange = (sound: string) => {
    setSelectedSound(sound)
    saveSettings({ selectedSound: sound })
    // Play preview
    playSound(sound)
  }

  const playSound = (soundType: string) => {
    if (!soundEnabled) return
    
    // Create audio element and play
    const audio = new Audio(`/sounds/${soundType}.mp3`)
    audio.volume = volume / 100
    audio.play().catch(e => console.log('Audio play failed:', e))
  }

  return (
    <div className="flex flex-col gap-8 w-full items-start justify-start max-w-7xl mx-auto p-4 sm:p-8">
      {/* Hero Header */}
      <div className="w-full text-center space-y-4 py-8">
        <div className="inline-block">
          <h1 className="text-6xl sm:text-7xl font-black bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-gradient">
            Settings
          </h1>
          <div className="h-2 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>

      {/* Audio Settings */}
      <div className="w-full bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-transparent bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text flex items-center gap-3">
          <span className="text-3xl">🔊</span> Audio Settings
        </h2>

        <div className="space-y-6">
          {/* Sound Effects Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">Sound Effects</h3>
              <p className="text-sm text-slate-400">Play sounds on button clicks</p>
            </div>
            <button
              onClick={handleSoundToggle}
              className={`relative w-16 h-8 rounded-full transition-colors ${
                soundEnabled ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-slate-600'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  soundEnabled ? 'transform translate-x-8' : ''
                }`}
              />
            </button>
          </div>

          {/* Background Music Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">Background Music</h3>
              <p className="text-sm text-slate-400">Play ambient music while browsing</p>
            </div>
            <button
              onClick={handleMusicToggle}
              className={`relative w-16 h-8 rounded-full transition-colors ${
                musicEnabled ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-600'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  musicEnabled ? 'transform translate-x-8' : ''
                }`}
              />
            </button>
          </div>

          {/* Volume Control */}
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <h3 className="text-xl font-semibold text-white mb-4">Volume</h3>
            <div className="flex items-center gap-4">
              <span className="text-2xl">🔉</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-purple-500"
              />
              <span className="text-white font-bold w-12 text-right">{volume}%</span>
            </div>
          </div>

          {/* Sound Selection */}
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <h3 className="text-xl font-semibold text-white mb-4">Click Sound</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {['click1', 'click2', 'pop', 'beep', 'soft', 'mechanical'].map((sound) => (
                <button
                  key={sound}
                  onClick={() => handleSoundChange(sound)}
                  className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedSound === sound
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : 'border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="text-2xl mb-1">🔊</div>
                  <div className="text-sm font-semibold capitalize">{sound}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="w-full bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-transparent bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text flex items-center gap-3">
          <span className="text-3xl">🎨</span> Appearance
        </h2>

        <div className="space-y-4">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <p className="text-slate-400">More appearance options coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
