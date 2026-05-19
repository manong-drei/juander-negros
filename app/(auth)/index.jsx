import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../../firebase/auth';
import { useToast } from '../../components/ui/Toast';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

export default function SignInScreen() {
  const toast = useToast();
  const [mode, setMode] = useState('signin');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      toast.show({ title: 'Google Sign-In Failed', message: e.message, type: 'error' });
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleEmail() {
    if (!email || !password) {
      toast.show({ title: 'Missing Fields', message: 'Please fill in your email and password.', type: 'warning' });
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!displayName) {
          toast.show({ title: 'Missing Name', message: 'Please enter your display name.', type: 'warning' });
          setLoading(false);
          return;
        }
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (e) {
      toast.show({ title: 'Sign-in Error', message: e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero / Brand */}
          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <MaterialIcons name="explore" size={40} color={colors.primary} />
            </View>
            <Text style={styles.appName}>JUANDER NEGROS</Text>
            <Text style={styles.tagline}>DISCOVER NEGROS.{'\n'}YOUR WAY.</Text>
          </View>

          {/* Subtext */}
          <Text style={styles.subtext}>
            Find destinations based on who you are, how you travel, and what you enjoy.
          </Text>

          {/* Google button */}
          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} disabled={googleLoading}>
            {googleLoading ? (
              <ActivityIndicator color="#1A1A1A" />
            ) : (
              <>
                <MaterialIcons name="account-circle" size={20} color="#4285F4" />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Email outlined button */}
          {!showEmailForm && (
            <TouchableOpacity style={styles.emailBtn} onPress={() => setShowEmailForm(true)}>
              <MaterialIcons name="email" size={18} color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={styles.emailBtnText}>Sign in with Email</Text>
            </TouchableOpacity>
          )}

          {/* Email form */}
          {showEmailForm && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {mode === 'signup' && (
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor={colors.textMuted}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                />
              )}
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={handleEmail} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Toggle sign in / sign up */}
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            <Text style={styles.toggleText}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.toggleLink}>
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            By continuing, you agree to our Terms &amp; Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40, justifyContent: 'center' },

  hero: { alignItems: 'center', marginBottom: 20 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryDim,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  tagline: {
    ...typography.preset.heading3,
    color: colors.primary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },

  subtext: {
    ...typography.preset.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 22,
  },

  googleBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },
  googleBtnText: { ...typography.preset.button, color: '#1A1A1A' },

  emailBtn: {
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.accent,
    marginBottom: 24,
  },
  emailBtnText: { ...typography.preset.button, color: colors.accent },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.preset.label, color: colors.textMuted, marginHorizontal: 12 },

  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    ...typography.preset.body,
    marginBottom: 12,
  },

  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  primaryBtnText: { ...typography.preset.button, color: '#FFFFFF' },

  toggleRow: { alignItems: 'center', marginBottom: 8 },
  toggleText: { ...typography.preset.label, color: colors.textSecondary },
  toggleLink: { color: colors.primary, fontWeight: '600' },

  footer: { ...typography.preset.caption, color: colors.textMuted, textAlign: 'center', marginTop: 16 },
});
