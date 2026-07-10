import React, { useEffect, useState } from 'react'
import { FaUser } from 'react-icons/fa'
import { getAdminCredentials } from '../utils/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function getAdminHeaders() {
  const creds = getAdminCredentials()
  return {
    'x-admin-username': creds.username,
    'x-admin-password': creds.password,
  }
}

function isValidProfileImage(file) {
  if (!file) return false
  const allowedMime = ['image/png', 'image/jpeg', 'image/webp']
  const allowedExt = ['.png', '.jpg', '.jpeg', '.webp']
  const lowerName = (file.name || '').toLowerCase()
  const hasAllowedExt = allowedExt.some((ext) => lowerName.endsWith(ext))
  return allowedMime.includes(file.type) && hasAllowedExt
}

export default function Intro({ isLoggedIn }) {
  const [profileImage, setProfileImage] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState('')

  const fetchProfileImage = async () => {
    setApiError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile-image`)
      if (!response.ok) {
        throw new Error('Could not load profile image.')
      }

      const data = await response.json()
      setProfileImage(data.profileImage || null)
    } catch (error) {
      setApiError(error.message || 'Could not load profile image.')
    }
  }

  useEffect(() => {
    fetchProfileImage()
  }, [])

  const handleUploadProfileImage = async () => {
    if (!selectedImage) return

    if (!isValidProfileImage(selectedImage)) {
      setApiError('Only image files (PNG, JPG, JPEG, WEBP) are allowed.')
      return
    }

    setIsSaving(true)
    setApiError('')

    try {
      const formData = new FormData()
      formData.append('profileImage', selectedImage)

      const response = await fetch(`${API_BASE_URL}/api/profile-image`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Could not upload profile image.')
      }

      setSelectedImage(null)
      await fetchProfileImage()
    } catch (error) {
      setApiError(error.message || 'Could not upload profile image.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveProfileImage = async () => {
    setIsSaving(true)
    setApiError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile-image`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Could not remove profile image.')
      }

      setProfileImage(null)
      setSelectedImage(null)
    } catch (error) {
      setApiError(error.message || 'Could not remove profile image.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section id="intro" className="section-block">
      <div className="container intro-layout">
        <div className="max-w-xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            Hi, I am <span className="heading-gradient">Sakshi Patidar</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            MERN Stack Developer with hands-on experience in React.js, Node.js, Express.js, MongoDB, and MySQL. I build secure, responsive web applications and REST APIs.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Currently working at Emizen Tech.
          </p>
          {apiError ? <p className="skills-subtitle" role="alert">{apiError}</p> : null}

          <div className="intro-cta flex flex-wrap gap-3">
            <a href="#projects" className="btn intro-cta-btn">View Projects</a>
            <a href="https://github.com/SakshiPatidar16" target="_blank" rel="noreferrer" className="btn-outline intro-cta-btn">GitHub</a>
            <a href="https://www.linkedin.com/in/sakshi-patidar-13b930283" target="_blank" rel="noreferrer" className="btn-outline intro-cta-btn">LinkedIn</a>
          </div>
        </div>

        <div className="intro-image-wrap">
          <div className="intro-avatar-shell">
            <div className="intro-avatar-glow" aria-hidden></div>
            <div className="intro-avatar-placeholder">
              {profileImage?.urlPath ? (
                <img
                  src={`${API_BASE_URL}${profileImage.urlPath}`}
                  alt="Profile"
                  className="intro-avatar-image"
                />
              ) : (
                <FaUser className="intro-avatar-icon" aria-hidden />
              )}
            </div>
          </div>

          {isLoggedIn ? (
            <div className="intro-admin-controls">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                disabled={isSaving}
              />

              <button
                type="button"
                className="btn"
                disabled={isSaving || !selectedImage}
                onClick={handleUploadProfileImage}
              >
                {isSaving ? 'Saving...' : 'Upload / Replace Image'}
              </button>

              {profileImage ? (
                <button
                  type="button"
                  className="btn-outline"
                  disabled={isSaving}
                  onClick={handleRemoveProfileImage}
                >
                  Remove Image
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
