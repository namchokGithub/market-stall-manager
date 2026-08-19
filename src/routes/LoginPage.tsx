import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate, type Location } from 'react-router'
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'

interface LoginLocationState {
  from?: Location
}

const INPUT_CLASSNAME =
  'rounded-md border border-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary'

const GENERIC_LOGIN_ERROR = 'Invalid email or password.'
const RESET_CONFIRMATION =
  'If an account exists for that email, a reset link has been sent.'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetMessage, setResetMessage] = useState<string | null>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LoginLocationState | null
  const redirectTo = state?.from?.pathname ?? '/'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setResetMessage(null)
    setIsSubmitting(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate(redirectTo, { replace: true })
    } catch {
      // Never distinguish "no such user" from "wrong password" — both
      // surface the same generic message.
      setError(GENERIC_LOGIN_ERROR)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleForgotPassword() {
    setError(null)
    setResetMessage(null)

    if (!email) {
      setError('Enter your email above, then click "Forgot password?".')
      return
    }

    setIsSubmitting(true)
    try {
      await sendPasswordResetEmail(auth, email)
    } catch {
      // Ignored on purpose: the confirmation message is identical whether
      // or not the address is registered, so we never leak account existence.
    } finally {
      setIsSubmitting(false)
      setResetMessage(RESET_CONFIRMATION)
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-muted">
      <form
        onSubmit={handleSubmit}
        className="flex w-80 flex-col gap-3 rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <h1 className="text-lg font-semibold text-foreground">Sign in</h1>

        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={INPUT_CLASSNAME}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={INPUT_CLASSNAME}
          />
        </label>

        {error && <p className="text-xs text-destructive">{error}</p>}
        {resetMessage && (
          <p className="text-xs text-emerald-600">{resetMessage}</p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>

        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={isSubmitting}
          className="text-xs text-primary hover:underline disabled:opacity-50"
        >
          Forgot password?
        </button>
      </form>
    </div>
  )
}
