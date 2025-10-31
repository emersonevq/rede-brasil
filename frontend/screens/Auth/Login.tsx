import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AuthButton from '../../components/AuthButton';
import { Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      const emailTrim = email.trim();
      if (!emailTrim || !password) return;
      const { login } = await import('../../utils/api');
      await login(emailTrim, password);
      router.push('/feed');
    } catch (e: any) {
      alert(e?.message || 'Falha ao entrar');
    }
  };

  const handleSignup = () => {
    router.push('/signup');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingVertical: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Text style={styles.logo}>Vibe</Text>
            <Text style={styles.subtitle}>Entre na sua conta</Text>

            <View style={styles.form}>
              <TextInput
                placeholder="Email"
                placeholderTextColor="#9aa0a6"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                returnKeyType="next"
              />

              <View style={styles.inputWithIcon}>
                <TextInput
                  placeholder="Senha"
                  placeholderTextColor="#9aa0a6"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={[styles.input, { paddingRight: 40 }]}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.eye}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#6b7280" />
                  ) : (
                    <Eye size={18} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>

              <AuthButton title="Entrar" onPress={handleLogin} />

              <TouchableOpacity style={styles.forgot}>
                <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
              </TouchableOpacity>

              <View style={styles.orRow}>
                <View style={styles.line} />
                <Text style={styles.orText}>ou</Text>
                <View style={styles.line} />
              </View>

              <View style={styles.signupRow}>
                <Text style={styles.noAccount}>Não tem uma conta?</Text>
                <TouchableOpacity onPress={handleSignup}>
                  <Text style={styles.signupLink}> Criar conta</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.footer}>Powered by Expo & NativeWind</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logo: {
    fontSize: 56,
    fontWeight: '800',
    color: '#0856d6',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
  },
  form: {
    width: '100%',
    paddingHorizontal: 8,
    alignItems: 'stretch',
  },
  input: {
    height: 56,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e6e6e9',
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  inputWithIcon: {
    position: 'relative',
  },
  eye: {
    position: 'absolute',
    right: 14,
    top: 18,
  },
  forgot: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  forgotText: {
    color: '#0856d6',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  orText: {
    marginHorizontal: 8,
    color: '#9ca3af',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAccount: {
    color: '#374151',
  },
  signupLink: {
    color: '#0856d6',
    fontWeight: '700',
  },
  footer: {
    marginTop: 18,
    color: '#9ca3af',
    fontSize: 12,
  },
});
