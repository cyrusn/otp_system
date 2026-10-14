'use client'

import { useState } from 'react'
import { apiPath } from '@/lib/client-path';

export default function ValidateTab() {
  const [valUsername, setValUsername] = useState('')
  const [valPin, setValPin] = useState('')
  const [valResult, setValResult] = useState(null)

  const handleTestValidate = async (e) => {
    e.preventDefault()
    setValResult(null)
    try {
      const res = await fetch(
        apiPath(`/api/validate?u=${encodeURIComponent(valUsername)}&p=${encodeURIComponent(valPin)}`)
      )
      const data = await res.json()
      setValResult(data)
    } catch (err) {
      setValResult({ valid: false, error: 'Network error' })
    }
  }

  return (
    <div className='card'>
      <header className='card-header'>
        <p className='card-header-title'>
          Test Public Verification API ({apiPath('/api/validate')}?u=...&p=...)
        </p>
      </header>
      <div className='card-content'>
        <form onSubmit={handleTestValidate}>
          <div className='field'>
            <label className='label'>Username (u)</label>
            <div className='control'>
              <input
                className='input'
                type='text'
                placeholder='e.g. alice'
                value={valUsername}
                onChange={(e) => setValUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className='field'>
            <label className='label'>6-Digit PIN (p)</label>
            <div className='control'>
              <input
                className='input'
                type='text'
                placeholder='e.g. 123456'
                maxLength={7}
                value={valPin}
                onChange={(e) => setValPin(e.target.value)}
                required
              />
            </div>
          </div>

          <button type='submit' className='button is-success mt-3'>
            Call {apiPath('/api/validate')}
          </button>
        </form>

        {valResult && (
          <div className='mt-5'>
            <p className='subtitle is-6 mb-2'>API Response:</p>
            <pre className='box'>{JSON.stringify(valResult, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
