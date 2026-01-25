'use client';

import React, { useState, useRef } from 'react';
import { useAuthAccount } from '@/lib/useAuthAccount';

interface EditProfileProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile?: {
    displayName?: string;
    location?: string;
    portfolioUrl?: string;
    about?: string;
    profileImage?: string;
  };
  onSave?: (profileData: ProfileFormData) => Promise<void>;
}

export interface ProfileFormData {
  displayName: string;
  location: string;
  portfolioUrl: string;
  about: string;
  profileImage?: File | null;
}

export default function EditProfile({ isOpen, onClose, currentProfile, onSave }: EditProfileProps) {
  const [displayName, setDisplayName] = useState(currentProfile?.displayName || '');
  const [location, setLocation] = useState(currentProfile?.location || '');
  const [portfolioUrl, setPortfolioUrl] = useState(currentProfile?.portfolioUrl || '');
  const [about, setAbout] = useState(currentProfile?.about || '');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>(currentProfile?.profileImage || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuthAccount();

  if (!isOpen || !isAuthenticated) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (1MB max for images)
      const maxSize = 1024 * 1024; // 1MB
      if (file.size > maxSize) {
        setError(`Image size must be less than 1MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        return;
      }

      // Check file type - support common image formats
      const supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml'];
      if (!supportedFormats.includes(file.type)) {
        setError(`Image format not supported. Supported: JPEG, PNG, GIF, WebP, AVIF`);
        return;
      }

      setError('');
      setProfileImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      setIsSaving(true);

      const formData: ProfileFormData = {
        displayName,
        location,
        portfolioUrl,
        about,
        profileImage,
      };

      if (onSave) {
        await onSave(formData);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setDisplayName(currentProfile?.displayName || '');
    setLocation(currentProfile?.location || '');
    setPortfolioUrl(currentProfile?.portfolioUrl || '');
    setAbout(currentProfile?.about || '');
    setProfileImage(null);
    setPreviewImage(currentProfile?.profileImage || '');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="glass rounded-3xl shadow-2xl max-w-2xl w-full border border-white/10 animate-scaleIn">
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-xl shadow-lg shadow-violet-500/30">
              ✏️
            </div>
            <h2 className="text-2xl font-bold text-gradient-purple">
              Edit Profile
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Image Section */}
            <div className="md:col-span-1">
              <div
                className="relative w-32 h-32 mx-auto mb-4 rounded-2xl overflow-hidden glass neon-purple flex items-center justify-center cursor-pointer hover:scale-105 transition-all group"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-3xl mb-1">📸</div>
                    <div className="text-xs text-slate-400">Click to upload</div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-slate-400 text-center">Profile Photo<br />(Max 1MB)</p>
            </div>

            {/* Form Fields Section */}
            <div className="md:col-span-2 space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 uppercase tracking-wider">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  className="w-full px-4 py-3 glass border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:neon-purple transition-all"
                  maxLength={50}
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 uppercase tracking-wider">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                  className="w-full px-4 py-3 glass border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                  maxLength={100}
                />
              </div>

              {/* NFT Portfolio */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 uppercase tracking-wider">
                  NFT Portfolio URL
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://yourportfolio.com"
                  className="w-full px-4 py-3 glass border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                />
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-300 mb-2 uppercase tracking-wider">
              About
            </label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              className="w-full px-4 py-3 glass border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all resize-none"
              maxLength={500}
            />
            <p className="text-xs text-slate-400 mt-1">{about.length}/500</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 glass rounded-xl border border-red-500/30 neon-pink text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-6 py-3 rounded-xl glass border border-white/10 text-slate-200 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-violet-500/25"
          >
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
