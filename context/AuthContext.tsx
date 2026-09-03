import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import {
  checkAndResetStreak,
  updateUserPushToken,
  type ForfeitResult,
} from '../services/firestore';
import { registerForPushNotificationsAsync } from '../services/notifications';
import type { UserData } from '../types';
import type { User } from 'firebase/auth';

interface AuthContextValue {
  /** The Firebase Auth user, or null if not signed in. */
  user: User | null;
  /** Firestore data for the signed-in user. */
  userData: UserData | null;
  /** Firestore data for the buddy. */
  buddyData: UserData | null;
  /** True while the initial auth state is being resolved. */
  loading: boolean;
  /** Active forfeit event if streak broke on load, otherwise null. */
  forfeitEvent: ForfeitResult | null;
  /** Clears the active forfeit event once acknowledged by user. */
  clearForfeitEvent: () => void;
  /** Sign in with email + password. Throws on failure. */
  login: (email: string, password: string) => Promise<void>;
  /** Sign out. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [buddyData, setBuddyData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forfeitEvent, setForfeitEvent] = useState<ForfeitResult | null>(null);

  // Hold refs to active Firestore unsubscribe functions so we can clean them up.
  const unsubUserRef = useRef<(() => void) | null>(null);
  const unsubBuddyRef = useRef<(() => void) | null>(null);
  const pushTokenRegisteredRef = useRef<boolean>(false);
  const streakCheckHandledRef = useRef<boolean>(false);
  const prevUserDataRef = useRef<UserData | null>(null);

  function clearListeners() {
    unsubUserRef.current?.();
    unsubBuddyRef.current?.();
    unsubUserRef.current = null;
    unsubBuddyRef.current = null;
    pushTokenRegisteredRef.current = false;
    streakCheckHandledRef.current = false;
    setForfeitEvent(null);
  }

  function clearForfeitEvent() {
    setForfeitEvent(null);
  }

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clear any existing Firestore listeners whenever auth state changes.
      clearListeners();

      if (!firebaseUser) {
        setUser(null);
        setUserData(null);
        setBuddyData(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      // Subscribe to the user's own document.
      let firstUserSnap = true;
      unsubUserRef.current = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        async (snap) => {
          if (!snap.exists()) {
            setLoading(false);
            return;
          }
          const data = snap.data() as UserData;

          // On the very first snapshot after sign-in: run the streak reset check and push token sync
          if (firstUserSnap) {
            firstUserSnap = false;

            if (!streakCheckHandledRef.current) {
              streakCheckHandledRef.current = true;
              try {
                const result = await checkAndResetStreak(firebaseUser.uid, data);
                if (result.isForfeit) {
                  setForfeitEvent(result);
                }
              } catch (e) {
                console.warn('Streak reset check failed:', e);
              }
            }

            // Capture and sync push token on login / mount
            if (!pushTokenRegisteredRef.current) {
              pushTokenRegisteredRef.current = true;
              registerForPushNotificationsAsync()
                .then(async (token) => {
                  if (token && token !== data.pushToken) {
                    await updateUserPushToken(firebaseUser.uid, token);
                  }
                })
                .catch((err) => {
                  console.warn('Push token registration skipped:', err);
                });
            }

            // After potential reset, subscribe to the buddy doc.
            if (data.buddyId) {
              unsubBuddyRef.current = onSnapshot(
                doc(db, 'users', data.buddyId),
                (buddySnap) => {
                  setBuddyData(
                    buddySnap.exists() ? (buddySnap.data() as UserData) : null,
                  );
                },
                (err) => console.warn('Buddy snapshot error:', err),
              );
            }

            setLoading(false);
          } else {
            // On subsequent snapshots, check if streak broke remotely (e.g. buddy ended streak)
            if (
              prevUserDataRef.current &&
              prevUserDataRef.current.currentStreak > 0 &&
              data.currentStreak === 0
            ) {
              setForfeitEvent({
                isForfeit: true,
                brokenStake: prevUserDataRef.current.currentStake ?? null,
              });
            }
          }

          prevUserDataRef.current = data;
          setUserData(data);
        },
        (err) => {
          console.warn('User snapshot error:', err);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubAuth();
      clearListeners();
    };
  }, []);

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    clearListeners();
    await signOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        buddyData,
        loading,
        forfeitEvent,
        clearForfeitEvent,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
