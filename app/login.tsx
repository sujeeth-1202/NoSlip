import React, { useState } from 'react';
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
import { QuietTheme, Typography } from '@/constants/theme';
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
        <Text style={styles.title}>NoSlip</Text>
        <Text style={styles.subtitle}>Quiet accountability, together.</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={QuietTheme.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setError('');
          }}
          editable={!submitting}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={QuietTheme.muted}
          secureTextEntry
          textContentType="password"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setError('');
          }}
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
            <ActivityIndicator color={QuietTheme.surface} />
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
    backgroundColor: QuietTheme.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: QuietTheme.surface,
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: QuietTheme.border,
    shadowColor: QuietTheme.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.display,
    fontSize: 32,
    color: QuietTheme.ink,
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Typography.sansRegular,
    fontSize: 14,
    color: QuietTheme.inkLight,
    marginBottom: 28,
  },
  input: {
    width: '100%',
    height: 52,
    borderWidth: 1.5,
    borderColor: QuietTheme.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontFamily: Typography.sansMedium,
    fontSize: 15,
    color: QuietTheme.ink,
    backgroundColor: QuietTheme.background,
    marginBottom: 14,
  },
  error: {
    fontFamily: Typography.sansRegular,
    color: QuietTheme.danger,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: QuietTheme.accentGrowth,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowColor: QuietTheme.accentGrowth,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonPressed: {
    backgroundColor: QuietTheme.accentGrowthHover,
    opacity: 0.88,
  },
  buttonText: {
    fontFamily: Typography.sansBold,
    color: QuietTheme.surface,
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
