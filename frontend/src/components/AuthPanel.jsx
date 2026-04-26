import { useState } from 'react'

/*
  AuthPanel is the login/signup gate for the app.
  It collects only username and password, then delegates all password hashing,
  JWT creation, and validation to the backend.
*/
export default function AuthPanel({ onLogin, onSignup, statusText }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function submitAuth(event) {
    event.preventDefault()

    if (mode === 'login') {
      onLogin(username, password)
      return
    }

    onSignup(username, password)
  }

  return (
    <main className="auth-page">
      <section className="panel auth-panel">
        <div>
          <p className="eyebrow">Simple Texas Hold&apos;em</p>
          <h1>{mode === 'login' ? 'Log In' : 'Sign Up'}</h1>
        </div>

        <form className="auth-form" onSubmit={submitAuth}>
          <label>
            Username
            <input
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="username"
            />
          </label>
          <label>
            Password
            <input
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="password"
            />
          </label>
          <button className="primary-action" type="submit">
            {mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <button className="link-button" type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}
        </button>

        {statusText && <p className="muted">{statusText}</p>}
      </section>
    </main>
  )
}
