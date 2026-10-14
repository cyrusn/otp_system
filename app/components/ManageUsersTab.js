'use client'

import { useState } from 'react'
import Image from 'next/image'
import { marked } from 'marked'
import { isStrongExportPassword } from '@/lib/export-password'
import { apiPath } from '@/lib/client-path'

export default function ManageUsersTab({ fetchUsers }) {
  const [inputUsernames, setInputUsernames] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadedUsers, setLoadedUsers] = useState([])
  const [notFoundUsers, setNotFoundUsers] = useState([])
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'print'
  const [confirmText, setConfirmText] = useState('')
  const [actionResult, setActionResult] = useState(null)
  const [exportPassword, setExportPassword] = useState('')
  const [exportError, setExportError] = useState('')
  const [noticeMarkdown, setNoticeMarkdown] = useState(
    `### SKHLPSS Login System - 2FA Setup Instructions\n\nPlease scan the QR code below with your **Authenticator App** (Google Authenticator, Authy, or 1Password).\n\n**Important Security Notes:**\n- Do not share this QR code with anyone.\n- Keep your 6-digit backup codes in a safe place.\n- If you lose access to your phone, please contact the SKHLPSS IT Helpdesk immediately.`
  )

  const handleLoadUsers = async () => {
    let list = inputUsernames
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter(Boolean)
    list = [...new Set(list)]

    if (list.length === 0) {
      return
    }

    setLoading(true)
    setActionResult(null)
    const valid = []
    const notFound = []

    for (const u of list) {
      try {
        const res = await fetch(
          apiPath(`/api/admin/users/qrcode?username=${encodeURIComponent(u)}`)
        )
        const data = await res.json()
        if (res.ok) {
          valid.push(data)
        } else {
          notFound.push({ username: u, reason: data.error || 'Not found' })
        }
      } catch (e) {
        notFound.push({ username: u, reason: 'Network error' })
      }
    }

    setLoadedUsers(valid)
    setNotFoundUsers(notFound)
    setLoading(false)
  }

  const handleResetUsers = async () => {
    if (loadedUsers.length === 0) return

    const names = loadedUsers.map((u) => u.username)
    if (
      !confirm(
        `Are you sure you want to reset 2FA secret for ${names.length} user(s)?`
      )
    ) {
      return
    }

    setLoading(true)
    setActionResult(null)
    const success = []
    const failed = []

    for (const username of names) {
      try {
        const res = await fetch(apiPath('/api/admin/users/reset'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        })
        const data = await res.json()
        if (res.ok) {
          success.push(username)
        } else {
          failed.push({ username, reason: data.error || 'Failed to reset' })
        }
      } catch (err) {
        failed.push({ username, reason: 'Network error' })
      }
    }

    setActionResult({
      action: 'reset',
      success,
      failed
    })
    setLoading(false)
    setConfirmText('')
    if (fetchUsers) fetchUsers()
    // Reload users to refresh QR codes if needed
    handleLoadUsers()
  }

  const handleDeleteUsers = async () => {
    if (loadedUsers.length === 0) return

    const names = loadedUsers.map((u) => u.username)
    if (
      !confirm(
        `Are you sure you want to delete ${names.length} user(s)? This action cannot be undone.`
      )
    ) {
      return
    }

    setLoading(true)
    setActionResult(null)
    const success = []
    const failed = []

    for (const username of names) {
      try {
        const res = await fetch(apiPath('/api/admin/users'), {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        })
        const data = await res.json()
        if (res.ok) {
          success.push(username)
        } else {
          failed.push({ username, reason: data.error || 'Failed to delete' })
        }
      } catch (err) {
        failed.push({ username, reason: 'Network error' })
      }
    }

    setActionResult({
      action: 'delete',
      success,
      failed
    })
    setLoading(false)
    setConfirmText('')
    if (fetchUsers) fetchUsers()
    // Remove deleted users from loaded list
    setLoadedUsers((prev) => prev.filter((u) => !success.includes(u.username)))
  }

  const triggerBrowserPrint = () => {
    window.print()
  }

  const handleDownloadExport = async () => {
    setExportError('')
    if (!isStrongExportPassword(exportPassword)) {
      setExportError('Use at least 8 characters with uppercase and lowercase letters, a digit, and one of ! @ # $ % ^ & *.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(apiPath('/api/admin/users/export'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: inputUsernames, password: exportPassword }),
      })
      if (!res.ok) {
        const data = await res.json()
        setExportError(data.error || 'Failed to prepare export')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'users-export.zip'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setExportPassword('')
    } catch (error) {
      setExportError('Network error while preparing export')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className='card no-print mb-5'>
        <header className='card-header'>
          <p className='card-header-title'>Manage Users</p>
        </header>
        <div className='card-content'>
          <div className='field'>
            <label className='label'>
              List of Usernames (one per line or comma-separated)
            </label>
            <div className='control'>
              <textarea
                className='textarea'
                rows={4}
                placeholder='john&#10;mary'
                value={inputUsernames}
                onChange={(e) => setInputUsernames(e.target.value)}
                disabled={loading}
              ></textarea>
            </div>
          </div>

          <div className='buttons mt-4'>
            <button
              type='button'
              className={`button is-link ${loading ? 'is-loading' : ''}`}
              onClick={handleLoadUsers}
              disabled={loading || !inputUsernames.trim()}
            >
              Load Users
            </button>
          </div>

          <div className='field mt-4'>
            <label className='label' htmlFor='export-password'>Encrypted download password</label>
            <div className='field has-addons'>
              <div className='control is-expanded'>
                <input
                  id='export-password'
                  className='input'
                  type='password'
                  autoComplete='new-password'
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  disabled={loading}
                  aria-describedby='export-password-help'
                />
              </div>
              <div className='control'>
                <button
                  type='button'
                  className={`button is-success ${loading ? 'is-loading' : ''}`}
                  onClick={handleDownloadExport}
                  disabled={loading}
                >
                  Download CSV + QR ZIP
                </button>
              </div>
            </div>
            <p id='export-password-help' className='help'>
              Leave the username list blank to export all users. The ZIP contains users.csv and a username.png QR image for each user. Use at least 8 characters with uppercase and lowercase letters, a digit, and one of ! @ # $ % ^ & *. The ZIP uses AES-256 encryption; extract it with a compatible utility such as 7-Zip or WinZip, and save the password because it cannot be recovered.
            </p>
          </div>
          {exportError && (
            <div className='notification is-danger my-3' role='alert'>{exportError}</div>
          )}

          {notFoundUsers.length > 0 && (
            <div className='notification is-warning my-3'>
              <strong>
                User(s) not found or failed to load ({notFoundUsers.length}):
              </strong>
              <ul className='mt-1'>
                {notFoundUsers.map((item, idx) => (
                  <li key={idx}>
                    {item.username} - {item.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {actionResult && (
            <div className='notification is-info my-3'>
              {actionResult.success.length > 0 && (
                <div>
                  <strong>
                    Successfully{' '}
                    {actionResult.action === 'reset' ? 'reset' : 'deleted'} (
                    {actionResult.success.length}):
                  </strong>{' '}
                  {actionResult.success.join(', ')}
                </div>
              )}
              {actionResult.failed.length > 0 && (
                <div className='mt-2'>
                  <strong>Failed ({actionResult.failed.length}):</strong>
                  <ul>
                    {actionResult.failed.map((f, i) => (
                      <li key={i}>
                        {f.username}: {f.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {loadedUsers.length > 0 && (
            <div className='box mt-4'>
              <div className='field is-grouped is-grouped-multiline align-items-center'>
                <div className='control'>
                  <div className='buttons has-addons'>
                    <button
                      type='button'
                      className={`button ${viewMode === 'grid' ? 'is-link is-selected' : ''}`}
                      onClick={() => setViewMode('grid')}
                    >
                      Grid View
                    </button>
                    <button
                      type='button'
                      className={`button ${viewMode === 'print' ? 'is-link is-selected' : ''}`}
                      onClick={() => setViewMode('print')}
                    >
                      Print View
                    </button>
                  </div>
                </div>

                <div className='control mx-3'>
                  <input
                    className='input'
                    type='text'
                    placeholder="Type 'reset' or 'delete'"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                  />
                </div>

                <div className='control'>
                  <div className='buttons'>
                    <button
                      type='button'
                      className='button is-warning'
                      disabled={
                        confirmText.trim().toLowerCase() !== 'reset' || loading
                      }
                      onClick={handleResetUsers}
                    >
                      Reset
                    </button>
                    <button
                      type='button'
                      className='button is-danger'
                      disabled={
                        confirmText.trim().toLowerCase() !== 'delete' || loading
                      }
                      onClick={handleDeleteUsers}
                    >
                      Delete
                    </button>
                    {viewMode === 'print' && (
                      <button
                        type='button'
                        className='button is-success'
                        onClick={triggerBrowserPrint}
                      >
                        Print / Save to PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {viewMode === 'print' && (
                <div className='field mt-4'>
                  <label className='label'>
                    Custom Markdown Notice (Printed above each QR code)
                  </label>
                  <div className='control'>
                    <textarea
                      className='textarea'
                      rows={10}
                      value={noticeMarkdown}
                      onChange={(e) => setNoticeMarkdown(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DISPLAY LOADED USERS */}
      {loadedUsers.length > 0 && (
        <div id='print-section'>
          {viewMode === 'print' ? (
            loadedUsers.map((pu) => (
              <div key={pu.username} className='print-page'>
                <div>
                  <div
                    className='content is-size-5'
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(noticeMarkdown)
                    }}
                  />
                </div>
                <div className='has-text-centered my-6'>
                  <Image
                    src={pu.qrCodeUrl}
                    alt={pu.username}
                    width={200}
                    height={200}
                  />
                  <p className='is-size-6 mt-2'>
                    <strong>Account:</strong> {pu.username}
                  </p>
                </div>
                <hr className='no-print' />
              </div>
            ))
          ) : (
            <div className='fixed-grid has-4-cols'>
              <div className='grid is-gap-5'>
                {loadedUsers.map((pu) => (
                  <div className='cell' key={pu.username}>
                    <div className='card has-text-centered'>
                      <div className='card-image'>
                        <figure className='image'>
                          <Image
                            src={pu.qrCodeUrl}
                            alt={pu.username}
                            width={200}
                            height={200}
                          />
                        </figure>
                      </div>
                      <div className='card-content py-1'>
                        <div className='content'>
                          <p className='my-0'>{pu.appName}</p>
                          <p className='my-0'> {pu.username} </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
