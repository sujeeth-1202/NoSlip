import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  const pushFailureCountRef = useRef<number>(0);
  const hasAlertedPushFailureRef = useRef<boolean>(false);

  function clearListeners() {
    unsubUserRef.current?.();
    unsubBuddyRef.current?.();
    unsubUserRef.current = null;
    unsubBuddyRef.current = null;
    pushTokenRegisteredRef.current = false;
    streakCheckHandledRef.current = false;
    pushFailureCountRef.current = 0;
    hasAlertedPushFailureRef.current = false;
    setForfeitEvent(null);
  }

  function clearForfeitEvent() {
    setForfeitEvent(null);
  }

  async function syncPushToken(userId: string, currentStoredToken?: string | null) {
    try {
      const token = await registerForPushNotificationsAsync();

      if (!token) {
        throw new Error('Push token registration returned empty or null token.');
      }

      if (token !== currentStoredToken) {
        await updateUserPushToken(userId, token);
      }

      // Success: mark registered and reset failure counters
      pushTokenRegisteredRef.current = true;
      pushFailureCountRef.current = 0;
      hasAlertedPushFailureRef.current = false;
      try {
        await AsyncStorage.removeItem('@noslip_push_fail_count');
      } catch {}
    } catch (err: any) {
      console.warn('Push token registration skipped or failed:', err?.message || err);
      pushTokenRegisteredRef.current = false;

      // Track consecutive failures across app opens/resumes
      pushFailureCountRef.current += 1;
      let totalFailures = pushFailureCountRef.current;
      try {
        const stored = await AsyncStorage.getItem('@noslip_push_fail_count');
        const prev = stored ? parseInt(stored, 10) || 0 : 0;
        totalFailures = prev + 1;
        await AsyncStorage.setItem('@noslip_push_fail_count', String(totalFailures));
      } catch {}

      // Only escalate if registration has failed repeatedly across several app opens (3+),
      // showing a simple, calm, non-technical message once.
      if (totalFailures >= 3 && !hasAlertedPushFailureRef.current) {
        hasAlertedPushFailureRef.current = true;
        Alert.alert(
          'Notifications',
          "Notifications couldn't be set up — try reopening the app.",
        );
      }
    }
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
        (snap) => {
          if (!snap.exists()) {
            setLoading(false);
            return;
          }
          const data = snap.data() as UserData;

          // Detect if streak broke (was > 0, now is 0)
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

          prevUserDataRef.current = data;
          setUserData(data);
          setLoading(false);

          // On first snapshot: run passive check, push token sync, and buddy subscription
          if (firstUserSnap) {
            firstUserSnap = false;

            if (!streakCheckHandledRef.current) {
              streakCheckHandledRef.current = true;
              checkAndResetStreak(firebaseUser.uid, data).catch((e) => {
                console.warn('Missed check-in check failed:', e);
              });
            }

            // Capture and sync push token on login / mount
            if (!pushTokenRegisteredRef.current) {
              syncPushToken(firebaseUser.uid, data.pushToken);
            }

            // Subscribe to the buddy doc
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
          }
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

  // Retry push token registration automatically on foreground resume if not yet registered
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && user && !pushTokenRegisteredRef.current) {
        syncPushToken(user.uid, userData?.pushToken);
      }
    });
    return () => subscription.remove();
  }, [user, userData?.pushToken]);

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
