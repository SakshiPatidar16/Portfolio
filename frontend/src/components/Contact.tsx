import React, { useState, useEffect } from 'react'
import { isValidPhoneNumber, getCountryCallingCode } from 'react-phone-number-input'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

const PHONE_DIGIT_LIMITS = {
  IN: 10,
  US: 10,
  CA: 10,
  GB: 10,
  AU: 9,
  NZ: 9,
  SG: 8,
  AE: 9,
  SA: 9,
  DE: 11,
  FR: 9,
  IT: 10,
  ES: 9,
  NL: 9,
  JP: 10,
  CN: 11,
}

const PHONE_COUNTRY_OPTIONS = [
  { value: 'IN', label: 'India', code: '91' },
  { value: 'US', label: 'United States', code: '1' },
  { value: 'CA', label: 'Canada', code: '1' },
  { value: 'GB', label: 'United Kingdom', code: '44' },
  { value: 'AU', label: 'Australia', code: '61' },
  { value: 'DE', label: 'Germany', code: '49' },
  { value: 'FR', label: 'France', code: '33' },
  { value: 'JP', label: 'Japan', code: '81' },
  { value: 'CN', label: 'China', code: '86' },
]

const getPhoneLimit = (country) => {
  return PHONE_DIGIT_LIMITS[country] || 15
}

const limitPhoneByCountry = (value, country) => {
  const digits = (value || '').replace(/\D/g, '')
  if (!country) {
    return digits
  }

  const limit = getPhoneLimit(country)
  let normalized = digits

  try {
    const callingCode = getCountryCallingCode(country)
    if (normalized.startsWith(callingCode)) {
      normalized = normalized.slice(callingCode.length)
    }
  } catch {
    // ignore invalid country
  }

  return normalized.slice(0, limit)
}


export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [location, setLocation] = useState('')
  const [message, setMessage] = useState('')

  const [status, setStatus] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [phoneCountry, setPhoneCountry] = useState('IN')

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => {
        setStatus(null)
        setErrorMessage('')
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [status])

  /*
   * Phone value change.
   */
  const handlePhoneChange = (value) => {
    const nextValue = value || ''
    const limitedValue = limitPhoneByCountry(nextValue, phoneCountry)

    setPhone(limitedValue)

    if (!limitedValue) {
      setPhoneError('')
      return
    }

    const fullNumber = `+${getCountryCallingCode(phoneCountry)}${limitedValue}`
    if (isValidPhoneNumber(fullNumber)) {
      setPhoneError('')
      return
    }

    setPhoneError('Please enter a valid phone number.')
  }

  /*
   * Country changed.
   *
   * We reset the number so the old country's
   * number cannot be incorrectly used with
   * the new country.
   *
   * PhoneInput will immediately show the new
   * country calling code.
   */
  const handleCountryChange = (country) => {
    const newCountry = country || 'IN'

    setPhoneCountry(newCountry)
    setPhone('')
    setPhoneError('')
  }

  /*
   * Validate phone.
   */
  const validatePhone = (value) => {
    if (!value) {
      setPhoneError('Phone number is required.')
      return false
    }

    const fullNumber = `+${getCountryCallingCode(phoneCountry)}${value}`
    if (!isValidPhoneNumber(fullNumber)) {
      setPhoneError('Please enter a valid phone number.')
      return false
    }

    setPhoneError('')
    return true
  }

  /*
   * Submit contact form.
   */
  const sendMail = async (e) => {
    e.preventDefault()

    setStatus('sending')
    setErrorMessage('')
    setPhoneError('')

    /*
     * Validate phone.
     */
    if (!validatePhone(phone)) {
      setStatus('error')
      return
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/contact`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            phone: `+${getCountryCallingCode(phoneCountry)}${phone}`,
            company,
            role,
            location,
            message,
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.message || 'Failed to send.'
        )
      }

      /*
       * Success.
       */
      setStatus('success')

      /*
       * Reset form.
       */
      setName('')
      setEmail('')
      setPhone('')
      setCompany('')
      setRole('')
      setLocation('')
      setMessage('')
      setPhoneError('')
      setErrorMessage('')
      setPhoneCountry('IN')

    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      )

      setStatus('error')
    }
  }

  return (
    <section
      id="contact"
      className="section-block contact-section"
    >
      <div className="container">

        <div className="contact-shell">

          {/* =========================
              CONTACT INFORMATION
          ========================== */}

          <aside className="contact-info">

            <span className="contact-kicker">
              Contact
            </span>

            <h3 className="section-heading">
              Open to New Opportunities
            </h3>

            <p className="contact-copy">
              I'm actively looking for full-time roles.
              If you're hiring or have an opportunity
              in mind, feel free to reach out. You can
              also contact me directly at +91 9351155651.
            </p>

            <div className="contact-pills">

              <span className="contact-pill">
                Available for Hire
              </span>

              <span className="contact-pill">
                Full-time
              </span>

            </div>

          </aside>

          {/* =========================
              CONTACT FORM
          ========================== */}

          <form
            onSubmit={sendMail}
            className="contact-form"
          >

            {/* NAME */}

            <div className="contact-field">

              <label htmlFor="contact-name">
                Your name{' '}
                <span className="contact-required">
                  *
                </span>
              </label>

              <input
                id="contact-name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="John Doe"
                required
              />

            </div>

            {/* EMAIL */}

            <div className="contact-field">

              <label htmlFor="contact-email">
                Your email{' '}
                <span className="contact-required">
                  *
                </span>
              </label>

              <input
                id="contact-email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                type="email"
                placeholder="john@example.com"
                required
              />

            </div>

            {/* PHONE */}

            <div className="contact-field contact-field--phone">

              <label htmlFor="contact-phone">
                Phone number{' '}
                <span className="contact-required">
                  *
                </span>
              </label>

              <div className="contact-phone-row">
                <select
                  value={phoneCountry}
                  onChange={(e) => {
                    setPhoneCountry(e.target.value)
                    setPhone('')
                    setPhoneError('')
                  }}
                >
                  {PHONE_COUNTRY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} (+{option.code})
                    </option>
                  ))}
                </select>

                <div className="phone-input-wrapper">
                  <span className="phone-code">
                    +{
                      PHONE_COUNTRY_OPTIONS.find(
                        (option) => option.value === phoneCountry
                      )?.code || '91'
                    }
                  </span>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const limitedValue = limitPhoneByCountry(
                        e.target.value,
                        phoneCountry
                      )
                      setPhone(limitedValue)
                      if (!limitedValue) {
                        setPhoneError('')
                        return
                      }
                      if (isValidPhoneNumber(
                        `+${getCountryCallingCode(phoneCountry)}${limitedValue}`
                      )) {
                        setPhoneError('')
                      }
                    }}
                    placeholder="Enter phone number"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              {phoneError && (
                <p className="contact-error">
                  {phoneError}
                </p>
              )}

            </div>

            {/* COMPANY */}

            <div className="contact-field">

              <label htmlFor="contact-company">
                Company name{' '}
                <span className="contact-required">
                  *
                </span>
              </label>

              <input
                id="contact-company"
                value={company}
                onChange={(e) =>
                  setCompany(e.target.value)
                }
                placeholder="Acme Corp"
                required
              />

            </div>

            {/* ROLE */}

            <div className="contact-field">

              <label htmlFor="contact-role">
                Role / Position{' '}
                <span className="contact-required">
                  *
                </span>
              </label>

              <input
                id="contact-role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value)
                }
                placeholder="MERN Stack Developer"
                required
              />

            </div>

            {/* LOCATION */}

            <div className="contact-field">

              <label htmlFor="contact-location">
                Location / Work Mode{' '}
                <span className="contact-optional">
                  (optional)
                </span>
              </label>

              <select
                id="contact-location"
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
              >

                <option value="">
                  Select...
                </option>

                <option value="Remote / WFH">
                  Remote / WFH
                </option>

                <option value="On-site">
                  On-site
                </option>

                <option value="Hybrid">
                  Hybrid
                </option>

              </select>

            </div>

            {/* MESSAGE */}

            <div className="contact-field">

              <label htmlFor="contact-message">
                Message / Job Details{' '}
                <span className="contact-optional">
                  (optional)
                </span>
              </label>

              <textarea
                id="contact-message"
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                rows={5}
                placeholder="Hi, I'm reaching out regarding a job opportunity at..."
              />

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              className="btn contact-submit"
              disabled={status === 'sending'}
            >
              {status === 'sending'
                ? 'Sending…'
                : 'Send Message'}
            </button>

            {/* SUCCESS */}

            {status === 'success' && (
              <p className="contact-feedback contact-feedback--success">
                Message sent! I'll get back to you soon.
              </p>
            )}

            {/* ERROR */}

            {status === 'error' && (
              <p className="contact-feedback contact-feedback--error">
                {errorMessage || phoneError}
              </p>
            )}

          </form>

        </div>
      </div>
    </section>
  )
}