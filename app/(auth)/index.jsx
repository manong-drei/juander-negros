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
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../../firebase/auth';
import { useToast } from '../../components/ui/Toast';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

export default function SignInScreen() {
  const toast = useToast();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
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
        if (!displayName) { toast.show({ title: 'Missing Name', message: 'Please enter your display name.', type: 'warning' }); setLoading(false); return; }
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
          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.appName}>Juander</Text>
            <Text style={styles.appNameAccent}>Negros</Text>
            <Text style={styles.tagline}>Discover the island, your way.</Text>
          </View>

          {/* Google button */}
          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} disabled={googleLoading}>
            {googleLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email form */}
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
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.primaryBtnText}>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },

  hero: { alignItems: 'center', marginBottom: 48 },
  appName: { ...typography.preset.display, color: colors.textPrimary, lineHeight: 40 },
  appNameAccent: { ...typography.preset.display, color: colors.primary, lineHeight: 40 },
  tagline: { ...typography.preset.subtitle, color: colors.textSecondary, marginTop: 8 },

  googleBtn: {
    backgroundColor: colors.textPrimary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  googleBtnText: { ...typography.preset.button, color: colors.background },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
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
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  primaryBtnText: { ...typography.preset.button, color: colors.background },

  toggleRow: { alignItems: 'center' },
  toggleText: { ...typography.preset.label, color: colors.textSecondary },
  toggleLink: { color: colors.primary, fontWeight: '600' },
});
