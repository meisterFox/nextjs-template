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

    try {
      const sound = soundType || settings.selectedSound
      const audio = new Audio(`/sounds/${sound}.mp3`)
      audio.volume = settings.volume / 100
      audio.play().catch(e => console.log('Audio play failed:', e))
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
