import React, { useEffect, useState } from 'react'
import { getAdminCredentials } from '../utils/auth'
import defaultResumePdf from '../assets/Sakshi Patidar.pdf'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function isPdfFile(file) {
  if (!file) return false
  const typeOk = file.type === 'application/pdf'
  const extOk = (file.name || '').toLowerCase().endsWith('.pdf')
  return typeOk && extOk
}

function getAdminHeaders() {
  const creds = getAdminCredentials()
  return {
    'x-admin-username': creds.username,
    'x-admin-password': creds.password,
  }
}

export default function Resume({ isLoggedIn }) {
  const [resume, setResume] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchResume = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/resume`)
      if (!response.ok) {
        throw new Error('Could not load resume.')
      }

      const data = await response.json()
      setResume(data.resume || null)
    } catch (fetchError) {
      setError(fetchError.message || 'Could not load resume.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchResume()
  }, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!selectedFile) return

    if (!isPdfFile(selectedFile)) {
      setError('Only PDF files are allowed.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('resume', selectedFile)

      const response = await fetch(`${API_BASE_URL}/api/resume`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Could not upload resume.')
      }

      setSelectedFile(null)
      await fetchResume()
    } catch (uploadError) {
      setError(uploadError.message || 'Could not upload resume.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = async () => {
    setIsSaving(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/resume`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Could not remove resume.')
      }

      setResume(null)
      setSelectedFile(null)
    } catch (removeError) {
      setError(removeError.message || 'Could not remove resume.')
    } finally {
      setIsSaving(false)
    }
  }

  const downloadUrl = resume?.urlPath ? `${API_BASE_URL}${resume.urlPath}` : defaultResumePdf

  return (
    <section id="resume" className="section-block resume-section transition-colors">
      <div className="container">
        <div className="resume-shell">
          <div>
            <h3 className="section-heading">Resume</h3>
            <p className="resume-subtitle">
              Download the latest PDF resume or use the contact section to reach me for full profile details.
            </p>
            {error ? <p className="resume-note" role="alert">{error}</p> : null}
            {isLoading ? <p className="resume-note">Loading resume...</p> : null}
            {!isLoading && !resume ? <p className="resume-note">Resume file is not uploaded yet.</p> : null}

          </div>

          <div className="resume-actions">
            <a href={downloadUrl} download={resume?.originalName || 'Sakshi Patidar.pdf'} className="btn">
              Download Resume
            </a>

            {isLoggedIn ? (
              <form className="resume-admin-form" onSubmit={handleUpload}>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    if (!file) {
                      setSelectedFile(null)
                      return
                    }

                    if (!isPdfFile(file)) {
                      setSelectedFile(null)
                      setError('Only PDF files are allowed.')
                      e.target.value = ''
                      return
                    }

                    setError('')
                    setSelectedFile(file)
                  }}
                  disabled={isSaving}
                />

                <div className="resume-admin-actions">
                  <button
                    type="submit"
                    className="btn"
                    disabled={isSaving || !selectedFile}
                  >
                    {isSaving ? 'Saving...' : 'Upload / Replace Resume'}
                  </button>

                  {resume ? (
                    <button
                      type="button"
                      className="btn-outline"
                      disabled={isSaving}
                      onClick={handleRemove}
                    >
                      Remove Current Resume
                    </button>
                  ) : null}
                </div>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
