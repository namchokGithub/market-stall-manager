import {
  createContext,
  useContext,
  useEffect,
  useRef,
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
  const currentUidRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (cancelled) return

      // A new auth event always re-opens the loading window: isAdmin for
      // the previous user (if any) must never leak to the next one.
      setIsLoading(true)
      setUser(nextUser)
      currentUidRef.current = nextUser?.uid ?? null

      if (!nextUser) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      const requestUid = nextUser.uid
      getDoc(doc(db, 'admins', requestUid))
        .then((snapshot) => {
          if (cancelled || currentUidRef.current !== requestUid) return
          setIsAdmin(snapshot.data()?.role === 'admin')
        })
        .catch(() => {
          if (cancelled || currentUidRef.current !== requestUid) return
          setIsAdmin(false)
        })
        .finally(() => {
          if (cancelled || currentUidRef.current !== requestUid) return
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
