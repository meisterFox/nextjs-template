'use client'

import { useEffect, useState } from 'react'

interface SiteSettings {
  soundEnabled: boolean
  musicEnabled: boolean
  volume: number
  selectedSound: string
}

export const useSound = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    soundEnabled: true,
    musicEnabled: false,
    volume: 50,
    selectedSound: 'click1',
  })

  useEffect(() => {
    // Load settings from localStorage
    const stored = localStorage.getItem('siteSettings')
    if (stored) {
      try {
        setSettings(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse settings:', e)
      }
    }
  }, [])

  const playSound = (soundType?: string) => {
    if (!settings.soundEnabled) return

    const sound = soundType || settings.selectedSound

    const tryPlay = (ext: 'mp3' | 'wav') => {
      const audio = new Audio(`/sounds/${sound}.${ext}`)
      audio.volume = settings.volume / 100
      audio.onerror = () => {
        if (ext === 'mp3') {
          // Fallback to wav if mp3 is missing
          tryPlay('wav')
        }
      }
      audio.play().catch(e => console.log('Audio play failed:', e))
    }

    try {
      tryPlay('mp3')
    } catch (e) {
      console.error('Sound playback error:', e)
    }
  }

  const playClickSound = () => playSound()

  return {
    playSound,
    playClickSound,
    settings,
  }
}
