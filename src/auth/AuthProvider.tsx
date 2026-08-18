import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

interface AuthContextValue {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (cancelled) return

      // A new auth event always re-opens the loading window: isAdmin for
      // the previous user (if any) must never leak to the next one.
      setIsLoading(true)
      setUser(nextUser)

      if (!nextUser) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      getDoc(doc(db, 'admins', nextUser.uid))
        .then((snapshot) => {
          if (cancelled) return
          setIsAdmin(snapshot.data()?.role === 'admin')
        })
        .catch(() => {
          if (cancelled) return
          setIsAdmin(false)
        })
        .finally(() => {
          if (cancelled) return
          setIsLoading(false)
        })
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
