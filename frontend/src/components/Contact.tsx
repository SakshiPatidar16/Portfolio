import React, {useState} from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [location, setLocation] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState(null) // 'sending' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('')

  const sendMail = async (e) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMessage('')
    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, company, role, location, message })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to send.')
      setStatus('success')
      setName('')
      setEmail('')
      setPhone('')
      setCompany('')
      setRole('')
      setLocation('')
      setMessage('')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="section-block contact-section">
      <div className="container">
        <div className="contact-shell">
          <aside className="contact-info">
            <span className="contact-kicker">Contact</span>
            <h3 className="section-heading">Open to New Opportunities</h3>
            <p className="contact-copy">
              I'm actively looking for full-time roles. If you're hiring or have an opportunity in mind, feel free to reach out. You can also contact me directly at +91 9351155651.
            </p>

            <div className="contact-pills">
              <span className="contact-pill">Available for Hire</span>
              <span className="contact-pill">Full-time</span>
            </div>
          </aside>

          <form onSubmit={sendMail} className="contact-form">
            <div className="contact-field">
              <label htmlFor="contact-name">Your name <span className="contact-required">*</span></label>
              <input
                id="contact-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="contact-field">
              <label htmlFor="contact-email">Your email <span className="contact-required">*</span></label>
              <input
                id="contact-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="contact-field">
              <label htmlFor="contact-phone">Phone number <span className="contact-required">*</span></label>
              <input
                id="contact-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                placeholder="+91 98765 43210"
                required
              />
            </div>

            <div className="contact-field">
              <label htmlFor="contact-company">Company name <span className="contact-required">*</span></label>
              <input
                id="contact-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                required
              />
            </div>

            <div className="contact-field">
              <label htmlFor="contact-role">Role / Position <span className="contact-required">*</span></label>
              <input
                id="contact-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="MERN Stack Developer"
                required
              />
            </div>

            <div className="contact-field">
              <label htmlFor="contact-location">Location / Work Mode <span className="contact-optional">(optional)</span></label>
              <select
                id="contact-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">Select...</option>
                <option value="Remote / WFH">Remote / WFH</option>
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div className="contact-field">
              <label htmlFor="contact-message">Message / Job Details <span className="contact-optional">(optional)</span></label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Hi, I'm reaching out regarding a job opportunity at..."
              />
            </div>

            <button type="submit" className="btn contact-submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send Message'}
            </button>

            {status === 'success' && (
              <p className="contact-feedback contact-feedback--success">Message sent! I'll get back to you soon.</p>
            )}
            {status === 'error' && (
              <p className="contact-feedback contact-feedback--error">{errorMessage}</p>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}
