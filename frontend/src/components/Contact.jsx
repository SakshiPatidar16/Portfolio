import React, {useState} from 'react'

const TARGET_EMAIL = 'sakshi.ptr7@gmail.com'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  const sendMail = (e) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Portfolio message from ${name || email || 'Anonymous'}`)
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${message}`)
    const mailto = `mailto:${TARGET_EMAIL}?subject=${subject}&body=${body}`
    window.location.href = mailto
  }

  return (
    <section id="contact" className="section-block contact-section">
      <div className="container">
        <div className="contact-shell">
          <aside className="contact-info">
            <span className="contact-kicker">Contact</span>
            <h3 className="section-heading">Let's Build Something Great</h3>
            <p className="contact-copy">
              Send me a message and your email client will open with details prefilled to {TARGET_EMAIL}. You can also reach me directly at +91 9351155651.
            </p>

            <div className="contact-pills">
              <span className="contact-pill">MERN Stack Developer</span>
              <span className="contact-pill">Available for Opportunities</span>
            </div>
          </aside>

          <form onSubmit={sendMail} className="contact-form">
            <div className="contact-field">
              <label htmlFor="contact-name">Your name</label>
              <input
                id="contact-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="contact-field">
              <label htmlFor="contact-email">Your email</label>
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
              <label htmlFor="contact-phone">Phone number</label>
              <input
                id="contact-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="contact-field">
              <label htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Tell me about your project..."
                required
              />
            </div>

            <button type="submit" className="btn contact-submit">Send Message</button>
          </form>
        </div>
      </div>
    </section>
  )
}
