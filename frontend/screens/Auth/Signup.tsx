import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AuthButton from '../../components/AuthButton';

export default function SignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const totalSteps = 4;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep0 = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'Nome obrigatório';
    if (!lastName.trim()) e.lastName = 'Sobrenome obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateEmail = (value: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value);
  };

  const validateDob = (value: string) => {
    // accept DD/MM/YYYY or ISO dates
    const re = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/;
    if (re.test(value)) return true;
    // try ISO
    const d = Date.parse(value);
    return !isNaN(d);
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!email.trim() || !validateEmail(email)) e.email = 'E-mail inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!dobDate && !validateDob(dob)) e.dob = 'Data inválida (DD/MM/AAAA)';
    if (!gender || gender.length === 0) e.gender = 'Gênero obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (!password || password.length < 6)
      e.password = 'Senha deve ter ao menos 6 caracteres';
    if (confirmPassword !== password)
      e.confirmPassword = 'Senhas não coincidem';
    if (!accepted) e.accepted = 'Você precisa aceitar os termos';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isStep0ValidPure = () =>
    firstName.trim().length > 0 && lastName.trim().length > 0;

  const isStep1ValidPure = () => validateEmail(email);

  const isStep2ValidPure = () => validateDob(dob) && gender.trim().length > 0;

  const isStep3ValidPure = () =>
    password.length >= 6 && confirmPassword === password && accepted === true;

  const validateCurrent = (current: number) => {
    if (current === 0) return validateStep0();
    if (current === 1) return validateStep1();
    if (current === 2) return validateStep2();
    return validateStep3();
  };

  const next = () => {
    if (!validateCurrent(step)) return;
    setStep((s) => Math.min(totalSteps - 1, s + 1));
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const generateUsernameAuto = (): string => {
    const base = `${firstName.toLowerCase().replace(/\s+/g, '')}${lastName.toLowerCase().replace(/\s+/g, '')}`;
    if (base.length === 0) {
      return `user${Math.floor(Math.random() * 100000)}`;
    }
    return base;
  };

  const handleCreate = async () => {
    if (!validateStep3()) return;
    try {
      setLoading(true);
      const generatedUsername = generateUsernameAuto();
      const { signup } = await import('../../utils/api');
      await signup({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        username: generatedUsername,
        password,
      });
      router.push('/feed');
    } catch (e: any) {
      setLoading(false);
      alert(e?.message || 'Falha ao criar conta');
      return;
    }
  };

  const progressPct = Math.round(((step + 1) / totalSteps) * 100);

  const isCurrentValidPure =
    step === 0
      ? isStep0ValidPure()
      : step === 1
        ? isStep1ValidPure()
        : step === 2
          ? isStep2ValidPure()
          : isStep3ValidPure();

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
            {/* Header and progress */}
            <View style={styles.progressWrap}>
              <View style={styles.progressHeader}>
                <Text style={styles.stepLabel}>Etapa {step + 1}</Text>
                <Text style={styles.stepCounter}>
                  {step + 1} de {totalSteps}
                </Text>
              </View>

              <View style={styles.progressBarBg}>
                <View
                  style={[styles.progressBarFill, { width: `${progressPct}%` }]}
                />
              </View>
            </View>

            {/* Logo */}
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.logo}>Vibe</Text>
              <Text style={styles.subtitle}>Crie sua conta</Text>
            </View>

            <View style={styles.form}>
              {step === 0 && (
                <>
                  <TextInput
                    placeholder="Nome"
                    placeholderTextColor="#9aa0a6"
                    value={firstName}
                    onChangeText={setFirstName}
                    style={styles.input}
                  />
                  {errors.firstName ? (
                    <Text style={styles.error}>{errors.firstName}</Text>
                  ) : null}
                  <TextInput
                    placeholder="Sobrenome"
                    placeholderTextColor="#9aa0a6"
                    value={lastName}
                    onChangeText={setLastName}
                    style={styles.input}
                  />
                  {errors.lastName ? (
                    <Text style={styles.error}>{errors.lastName}</Text>
                  ) : null}
                </>
              )}

              {step === 1 && (
                <>
                  <TextInput
                    placeholder="E-mail"
                    placeholderTextColor="#9aa0a6"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    style={styles.input}
                  />
                  {errors.email ? (
                    <Text style={styles.error}>{errors.email}</Text>
                  ) : null}
                </>
              )}

              {step === 2 && (
                <>
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    style={[styles.input, { justifyContent: 'center' }]}
                  >
                    <Text style={{ color: dob ? '#0f172a' : '#9aa0a6' }}>
                      {dob || 'Data de nascimento (DD/MM/AAAA)'}
                    </Text>
                  </Pressable>
                  {showDatePicker && (
                    <DateTimePicker
                      value={dobDate || new Date(1990, 0, 1)}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      maximumDate={new Date()}
                      onChange={(e: any, selectedDate?: Date) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          setDobDate(selectedDate);
                          const dd = String(selectedDate.getDate()).padStart(
                            2,
                            '0',
                          );
                          const mm = String(
                            selectedDate.getMonth() + 1,
                          ).padStart(2, '0');
                          const yyyy = selectedDate.getFullYear();
                          setDob(`${dd}/${mm}/${yyyy}`);
                        }
                      }}
                    />
                  )}
                  {errors.dob ? (
                    <Text style={styles.error}>{errors.dob}</Text>
                  ) : null}

                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: '#e6eef8',
                      borderRadius: 8,
                      overflow: 'hidden',
                      marginTop: 10,
                    }}
                  >
                    <Picker
                      selectedValue={gender}
                      onValueChange={(val) => setGender(String(val))}
                    >
                      <Picker.Item label="Selecione o gênero" value="" />
                      <Picker.Item label="Masculino" value="male" />
                      <Picker.Item label="Feminino" value="female" />
                      <Picker.Item label="Não-binário" value="nonbinary" />
                      <Picker.Item label="Prefiro não dizer" value="private" />
                      <Picker.Item label="Outro" value="other" />
                    </Picker>
                  </View>

                  {errors.gender ? (
                    <Text style={styles.error}>{errors.gender}</Text>
                  ) : null}
                </>
              )}

              {step === 3 && (
                <>
                  <TextInput
                    placeholder="Senha"
                    placeholderTextColor="#9aa0a6"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.input}
                  />
                  {errors.password ? (
                    <Text style={styles.error}>{errors.password}</Text>
                  ) : null}
                  <TextInput
                    placeholder="Confirmar senha"
                    placeholderTextColor="#9aa0a6"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    style={styles.input}
                  />
                  {errors.confirmPassword ? (
                    <Text style={styles.error}>{errors.confirmPassword}</Text>
                  ) : null}

                  <View style={styles.termsRow}>
                    <TouchableOpacity
                      onPress={() => setAccepted((a) => !a)}
                      style={styles.checkbox}
                    >
                      {accepted ? <View style={styles.checkboxInner} /> : null}
                    </TouchableOpacity>
                    <Text style={{ flex: 1, color: '#374151' }}>
                      Aceito os termos de privacidade e segurança
                    </Text>
                    <TouchableOpacity onPress={() => setShowTerms(true)}>
                      <Text style={{ color: '#0856d6', marginLeft: 8 }}>
                        Termos
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {errors.accepted ? (
                    <Text style={styles.error}>{errors.accepted}</Text>
                  ) : null}
                </>
              )}

              {/* Error box (top) */}
              {Object.keys(errors).length > 0 && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorBoxText}>
                    {Object.values(errors)[0]}
                  </Text>
                </View>
              )}

              {/* Navigation buttons */}
              <View style={styles.navRow}>
                <TouchableOpacity
                  onPress={back}
                  disabled={step === 0}
                  style={[
                    styles.navButton,
                    step === 0 && styles.navButtonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.navButtonText,
                      step === 0 && styles.navButtonTextDisabled,
                    ]}
                  >
                    Voltar
                  </Text>
                </TouchableOpacity>

                {step < totalSteps - 1 ? (
                  <TouchableOpacity
                    onPress={next}
                    disabled={!isCurrentValidPure}
                    style={[
                      styles.nextButton,
                      !isCurrentValidPure && styles.nextButtonDisabled,
                    ]}
                  >
                    <Text style={styles.nextButtonText}>Próximo</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleCreate}
                    disabled={loading || !isCurrentValidPure}
                    style={[
                      styles.createButton,
                      (loading || !isCurrentValidPure) &&
                        styles.createButtonDisabled,
                    ]}
                  >
                    <Text style={styles.createButtonText}>
                      {loading ? 'Criando conta...' : 'Criar conta'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={styles.footer}>Powered by Expo & NativeWind</Text>

            {/* Terms modal */}
            <Modal visible={showTerms} transparent animationType="fade">
              <View style={styles.modalBg}>
                <View style={styles.modalCard}>
                  <ScrollView style={{ maxHeight: 420 }}>
                    <Text style={styles.modalTitle}>
                      Termos de Uso e Política de Privacidade
                    </Text>
                    <Text style={styles.modalText}>
                      Ao usar o Vibe Social, você concorda em seguir nossas
                      diretrizes da comunidade e usar a plataforma de forma
                      respeitosa e legal.
                    </Text>
                    <Text style={styles.modalText}>
                      Seus dados pessoais são protegidos e utilizados apenas
                      para melhorar sua experiência na plataforma. Não
                      compartilhamos suas informações pessoais com terceiros sem
                      seu consentimento.
                    </Text>
                    <Text style={styles.modalText}>
                      Você é responsável pelo conteúdo que publica. Não
                      permitimos spam, discurso de ódio, ou conteúdo ilegal.
                    </Text>
                    <Text style={styles.modalText}>
                      Implementamos medidas de segurança para proteger sua
                      conta. Use uma senha forte e não compartilhe suas
                      credenciais.
                    </Text>
                  </ScrollView>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      marginTop: 12,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => setShowTerms(false)}
                      style={{ padding: 10, marginRight: 8 }}
                    >
                      <Text style={{ color: '#6b7280' }}>Fechar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setAccepted(true);
                        setShowTerms(false);
                      }}
                      style={{
                        padding: 10,
                        backgroundColor: '#0856d6',
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: '#fff' }}>Aceitar Termos</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
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
  progressWrap: {
    width: '100%',
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stepLabel: { color: '#6b7280' },
  stepCounter: { color: '#6b7280' },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#0856d6',
  },
  logo: {
    fontSize: 56,
    fontWeight: '800',
    color: '#0856d6',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 6,
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
    marginBottom: 6,
  },
  error: {
    color: '#dc2626',
    marginBottom: 8,
    marginLeft: 6,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    backgroundColor: '#0856d6',
    borderRadius: 2,
  },
  errorBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
  },
  errorBoxText: {
    color: '#991b1b',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navButtonDisabled: { opacity: 0.5 },
  navButtonText: { color: '#374151' },
  navButtonTextDisabled: { color: '#9ca3af' },
  nextButton: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  nextButtonDisabled: { opacity: 0.6 },
  nextButtonText: { color: '#0856d6', fontWeight: '700' },
  createButton: {
    backgroundColor: '#0856d6',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonDisabled: { opacity: 0.6 },
  createButtonText: { color: '#fff', fontWeight: '700' },
  footer: { marginTop: 18, color: '#9ca3af', fontSize: 12 },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 720,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  modalText: { color: '#374151', marginBottom: 8, lineHeight: 20 },
});
