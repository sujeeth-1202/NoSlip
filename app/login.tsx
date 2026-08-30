import { useState } from 'react';
import { Redirect } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Redirect href="/" />;
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // Navigation is handled automatically by the auth guard in (tabs)/_layout.tsx
    } catch (e: any) {
      console.error('Login error:', e);
      const msg =
        e?.code === 'auth/invalid-credential' ||
        e?.code === 'auth/wrong-password' ||
        e?.code === 'auth/user-not-found'
          ? 'Incorrect email or password.'
          : e?.message || 'Sign-in failed. Check your connection and try again.';
      setError(msg);
      Alert.alert('Sign In Failed', msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>🚫🍩</Text>
        <Text style={styles.title}>NoSlip</Text>
        <Text style={styles.subtitle}>Stay accountable together.</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9BA1A6"
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          value={email}
          onChangeText={(t) => { setEmail(t); setError(''); }}
          editable={!submitting}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9BA1A6"
          secureTextEntry
          textContentType="password"
          value={password}
          onChangeText={(t) => { setPassword(t); setError(''); }}
          editable={!submitting}
          onSubmitEditing={handleLogin}
          returnKeyType="go"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            (submitting || pressed) && styles.buttonPressed,
          ]}
          onPress={handleLogin}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F2F5F8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#687076',
    marginBottom: 28,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1.5,
    borderColor: '#E0E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#11181C',
    backgroundColor: '#FAFBFC',
    marginBottom: 12,
  },
  error: {
    color: '#D93025',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
