import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import TagSearch from '../../components/story/TagSearch';
import TopBar from '../../components/TopBar';
import BottomNav from '../../components/BottomNav';
import { getMyProfile, updateMyProfile, getCurrentUser } from '../../utils/api';
import { useRouter } from 'expo-router';

export default function EditProfilePage() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // personal fields
  const [bio, setBio] = useState('');
  const [hometown, setHometown] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [workplaceCompany, setWorkplaceCompany] = useState('');
  const [workplaceTitle, setWorkplaceTitle] = useState('');
  const [positions, setPositions] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);

  // privacy toggles
  const [showHometown, setShowHometown] = useState(true);
  const [showCurrentCity, setShowCurrentCity] = useState(true);
  const [showRelationshipStatus, setShowRelationshipStatus] = useState(true);
  const [showContactEmail, setShowContactEmail] = useState(false);
  const [showContactPhone, setShowContactPhone] = useState(false);
  const [showWorkplace, setShowWorkplace] = useState(true);

  // tabs
  const [activeTab, setActiveTab] = useState<'info' | 'privacy'>('info');

  // tagging for relationship
  const [selectedRelationUser, setSelectedRelationUser] = useState<any>(null);
  const [showTagModal, setShowTagModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const prof = await getMyProfile();
        if (!mounted) return;
        setBio(prof.bio || '');
        setHometown(prof.hometown || '');
        setCurrentCity(prof.current_city || '');
        setRelationshipStatus(prof.relationship_status || '');
        setContactEmail(prof.contact_email || '');
        setContactPhone(prof.contact_phone || '');
        setWorkplaceCompany(prof.workplace_company || '');
        setWorkplaceTitle(prof.workplace_title || '');
        setPositions(Array.isArray(prof.positions) ? prof.positions : []);
        setEducation(Array.isArray(prof.education) ? prof.education : []);
        setShowHometown(prof.show_hometown !== false);
        setShowCurrentCity(prof.show_current_city !== false);
        setShowRelationshipStatus(prof.show_relationship_status !== false);
        setShowContactEmail(prof.show_contact_email === true);
        setShowContactPhone(prof.show_contact_phone === true);
        setShowWorkplace(prof.show_workplace !== false);
        if (prof.relationship_user)
          setSelectedRelationUser(prof.relationship_user);
      } catch (err: any) {
        console.error('Erro ao carregar perfil:', err);
        Alert.alert('Erro', err?.message || 'Falha ao carregar perfil');
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddPosition = () =>
    setPositions([
      ...positions,
      { company: '', title: '', start: '', end: '' },
    ]);
  const handleRemovePosition = (idx: number) =>
    setPositions(positions.filter((_, i) => i !== idx));
  const handlePositionChange = (idx: number, key: string, value: string) => {
    const copy = [...positions];
    copy[idx] = { ...copy[idx], [key]: value };
    setPositions(copy);
  };

  const handleAddEducation = () =>
    setEducation([
      ...education,
      { institution: '', degree: '', start: '', end: '' },
    ]);
  const handleRemoveEducation = (idx: number) =>
    setEducation(education.filter((_, i) => i !== idx));
  const handleEducationChange = (idx: number, key: string, value: string) => {
    const copy = [...education];
    copy[idx] = { ...copy[idx], [key]: value };
    setEducation(copy);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        bio,
        hometown,
        current_city: currentCity,
        relationship_status: relationshipStatus,
        contact_email: contactEmail || undefined,
        contact_phone: contactPhone || undefined,
        workplace_company: workplaceCompany || undefined,
        workplace_title: workplaceTitle || undefined,
        connections_count: 0,
        show_hometown: showHometown,
        show_current_city: showCurrentCity,
        show_relationship_status: showRelationshipStatus,
        show_contact_email: showContactEmail,
        show_contact_phone: showContactPhone,
        show_workplace: showWorkplace,
        positions: positions.map((p) => ({
          company: p.company,
          title: p.title,
          start: p.start,
          end: p.end,
        })),
        education: education.map((e) => ({
          institution: e.institution,
          degree: e.degree,
          start: e.start,
          end: e.end,
        })),
      };

      if (selectedRelationUser) {
        payload.relationship_user_id = selectedRelationUser.id;
      }

      await updateMyProfile(payload);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso');
      try {
        const me = await getCurrentUser();
        const username =
          me?.username ||
          `${me?.first_name || ''}${me?.last_name || ''}`
            .toLowerCase()
            .replace(/\s+/g, '');
        if (username)
          router.replace(`/profile/${encodeURIComponent(username)}`);
        else router.back();
      } catch {
        router.back();
      }
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', err);
      Alert.alert('Erro', err?.message || 'Falha ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  // render helpers
  const PersonalSections = () => (
    <View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações Pessoais</Text>

        <Text style={styles.label}>Biografia</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          multiline
          style={styles.inputMultiline}
          placeholder="Fale sobre você"
        />

        <Text style={styles.label}>Cidade natal</Text>
        <TextInput
          value={hometown}
          onChangeText={setHometown}
          style={styles.input}
          placeholder="Cidade natal"
        />

        <Text style={styles.label}>Cidade atual</Text>
        <TextInput
          value={currentCity}
          onChangeText={setCurrentCity}
          style={styles.input}
          placeholder="Cidade atual"
        />

        <Text style={styles.label}>Estado civil</Text>
        <View
          style={{
            borderWidth: 1,
            borderColor: '#e6eef8',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <Picker
            selectedValue={relationshipStatus}
            onValueChange={(val) => {
              setRelationshipStatus(String(val));
              if (String(val) !== 'casado') setSelectedRelationUser(null);
              if (String(val) === 'casado') setShowTagModal(true);
            }}
          >
            <Picker.Item label="Selecione..." value="" />
            <Picker.Item label="Sério" value="sério" />
            <Picker.Item
              label="Morando com alguém"
              value="morando com alguém"
            />
            <Picker.Item label="Relação estável" value="relação estável" />
            <Picker.Item
              label="Ficando com alguém"
              value="ficando com alguém"
            />
            <Picker.Item label="Solteiro" value="solteiro" />
            <Picker.Item label="Divorciado" value="divorciado" />
            <Picker.Item label="Separado" value="separado" />
            <Picker.Item label="Casado" value="casado" />
          </Picker>
        </View>

        {selectedRelationUser ? (
          <View
            style={{
              marginTop: 8,
              padding: 10,
              backgroundColor: '#f1f5f9',
              borderRadius: 8,
            }}
          >
            <Text style={{ fontWeight: '700' }}>
              Marcado: @
              {selectedRelationUser.username || selectedRelationUser.first_name}
            </Text>
            <TouchableOpacity onPress={() => setSelectedRelationUser(null)}>
              <Text style={{ color: '#ef4444', marginTop: 6 }}>
                Remover marcação
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Modal
          visible={showTagModal}
          animationType="slide"
          onRequestClose={() => setShowTagModal(false)}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ padding: 16, flex: 1 }}>
              <Text
                style={{ fontWeight: '800', fontSize: 18, marginBottom: 12 }}
              >
                Marcar pessoa
              </Text>
              <TagSearch
                onSelect={(u: any) => {
                  setSelectedRelationUser(u);
                  setShowTagModal(false);
                }}
              />
              <TouchableOpacity
                onPress={() => setShowTagModal(false)}
                style={{ marginTop: 12 }}
              >
                <Text style={{ color: '#64748b' }}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações de Contato</Text>
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={contactEmail}
          onChangeText={setContactEmail}
          style={styles.input}
          placeholder="email@exemplo.com"
          keyboardType="email-address"
        />
        <Text style={styles.label}>Telefone</Text>
        <TextInput
          value={contactPhone}
          onChangeText={setContactPhone}
          style={styles.input}
          placeholder="(99) 9 9999-9999"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações Profissionais</Text>
        <Text style={styles.label}>Empresa atual</Text>
        <TextInput
          value={workplaceCompany}
          onChangeText={setWorkplaceCompany}
          style={styles.input}
          placeholder="Empresa"
        />
        <Text style={styles.label}>Cargo atual</Text>
        <TextInput
          value={workplaceTitle}
          onChangeText={setWorkplaceTitle}
          style={styles.input}
          placeholder="Cargo"
        />

        <View style={{ marginTop: 12 }}>
          <Text style={[styles.label, { fontWeight: '800' }]}>
            Histórico de cargos e empregos
          </Text>
          {positions.map((pos, i) => (
            <View key={`pos_${i}`} style={styles.rowItem}>
              <TextInput
                placeholder="Empresa"
                style={styles.rowInput}
                value={pos.company}
                onChangeText={(v) => handlePositionChange(i, 'company', v)}
              />
              <TextInput
                placeholder="Cargo"
                style={styles.rowInput}
                value={pos.title}
                onChangeText={(v) => handlePositionChange(i, 'title', v)}
              />
              <View style={styles.dateRow}>
                <TextInput
                  placeholder="Início"
                  style={styles.rowInputSmall}
                  value={pos.start}
                  onChangeText={(v) => handlePositionChange(i, 'start', v)}
                />
                <TextInput
                  placeholder="Fim"
                  style={styles.rowInputSmall}
                  value={pos.end}
                  onChangeText={(v) => handlePositionChange(i, 'end', v)}
                />
              </View>
              <TouchableOpacity
                onPress={() => handleRemovePosition(i)}
                style={styles.removeBtn}
              >
                <Text style={styles.removeBtnText}>Remover</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={handleAddPosition} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Adicionar cargo anterior</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Formação Acadêmica</Text>
        {education.map((edu, i) => (
          <View key={`edu_${i}`} style={styles.rowItem}>
            <TextInput
              placeholder="Instituição"
              style={styles.rowInput}
              value={edu.institution}
              onChangeText={(v) => handleEducationChange(i, 'institution', v)}
            />
            <TextInput
              placeholder="Grau de instrução"
              style={styles.rowInput}
              value={edu.degree}
              onChangeText={(v) => handleEducationChange(i, 'degree', v)}
            />
            <View style={styles.dateRow}>
              <TextInput
                placeholder="Início"
                style={styles.rowInputSmall}
                value={edu.start}
                onChangeText={(v) => handleEducationChange(i, 'start', v)}
              />
              <TextInput
                placeholder="Fim"
                style={styles.rowInputSmall}
                value={edu.end}
                onChangeText={(v) => handleEducationChange(i, 'end', v)}
              />
            </View>
            <TouchableOpacity
              onPress={() => handleRemoveEducation(i)}
              style={styles.removeBtn}
            >
              <Text style={styles.removeBtnText}>Remover</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity onPress={handleAddEducation} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Adicionar formação</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const PrivacySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Controle de Privacidade</Text>
      <Text style={styles.privacyDescription}>
        Escolha quais informações deseja mostrar no seu perfil
      </Text>

      <View style={styles.visibilityItem}>
        <View style={styles.visibilityContent}>
          <Text style={styles.visibilityLabel}>Cidade natal</Text>
          <Text style={styles.visibilityDescription}>
            {showHometown ? 'Visível para todos' : 'Oculta'}
          </Text>
        </View>
        <Switch
          value={showHometown}
          onValueChange={setShowHometown}
          trackColor={{ false: '#cbd5e1', true: '#86efac' }}
          thumbColor={showHometown ? '#22c55e' : '#e2e8f0'}
        />
      </View>

      <View style={styles.visibilityItem}>
        <View style={styles.visibilityContent}>
          <Text style={styles.visibilityLabel}>Cidade atual</Text>
          <Text style={styles.visibilityDescription}>
            {showCurrentCity ? 'Visível para todos' : 'Oculta'}
          </Text>
        </View>
        <Switch
          value={showCurrentCity}
          onValueChange={setShowCurrentCity}
          trackColor={{ false: '#cbd5e1', true: '#86efac' }}
          thumbColor={showCurrentCity ? '#22c55e' : '#e2e8f0'}
        />
      </View>

      <View style={styles.visibilityItem}>
        <View style={styles.visibilityContent}>
          <Text style={styles.visibilityLabel}>Estado civil</Text>
          <Text style={styles.visibilityDescription}>
            {showRelationshipStatus ? 'Visível para todos' : 'Oculto'}
          </Text>
        </View>
        <Switch
          value={showRelationshipStatus}
          onValueChange={setShowRelationshipStatus}
          trackColor={{ false: '#cbd5e1', true: '#86efac' }}
          thumbColor={showRelationshipStatus ? '#22c55e' : '#e2e8f0'}
        />
      </View>

      <View style={styles.visibilityItem}>
        <View style={styles.visibilityContent}>
          <Text style={styles.visibilityLabel}>Email para contato</Text>
          <Text style={styles.visibilityDescription}>
            {showContactEmail ? 'Visível para todos' : 'Oculto'}
          </Text>
        </View>
        <Switch
          value={showContactEmail}
          onValueChange={setShowContactEmail}
          trackColor={{ false: '#cbd5e1', true: '#86efac' }}
          thumbColor={showContactEmail ? '#22c55e' : '#e2e8f0'}
        />
      </View>

      <View style={styles.visibilityItem}>
        <View style={styles.visibilityContent}>
          <Text style={styles.visibilityLabel}>Telefone para contato</Text>
          <Text style={styles.visibilityDescription}>
            {showContactPhone ? 'Visível para todos' : 'Oculto'}
          </Text>
        </View>
        <Switch
          value={showContactPhone}
          onValueChange={setShowContactPhone}
          trackColor={{ false: '#cbd5e1', true: '#86efac' }}
          thumbColor={showContactPhone ? '#22c55e' : '#e2e8f0'}
        />
      </View>

      <View style={styles.visibilityItem}>
        <View style={styles.visibilityContent}>
          <Text style={styles.visibilityLabel}>Informações profissionais</Text>
          <Text style={styles.visibilityDescription}>
            {showWorkplace ? 'Visível para todos' : 'Ocultas'}
          </Text>
        </View>
        <Switch
          value={showWorkplace}
          onValueChange={setShowWorkplace}
          trackColor={{ false: '#cbd5e1', true: '#86efac' }}
          thumbColor={showWorkplace ? '#22c55e' : '#e2e8f0'}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <TopBar />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 16 }}>
        <Text style={styles.title}>Editar perfil</Text>

        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => setActiveTab('info')}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: activeTab === 'info' ? '#fff' : '#f1f5f9',
              borderTopLeftRadius: 8,
              borderBottomLeftRadius: 8,
              borderWidth: 1,
              borderColor: '#e2e8f0',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontWeight: '700',
                color: activeTab === 'info' ? '#0f172a' : '#64748b',
              }}
            >
              Informações Pessoais
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('privacy')}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: activeTab === 'privacy' ? '#fff' : '#f1f5f9',
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
              borderWidth: 1,
              borderColor: '#e2e8f0',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontWeight: '700',
                color: activeTab === 'privacy' ? '#0f172a' : '#64748b',
              }}
            >
              Controle de Privacidade
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'info' ? (
          <View>
            <PersonalSections />
          </View>
        ) : (
          <View style={{ minWidth: 240 }}>
            <PrivacySection />
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={styles.bottomActionBar}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Text>
        </TouchableOpacity>
      </View>

      <BottomNav active="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    color: '#0f172a',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  label: {
    color: '#475569',
    marginTop: 10,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    borderRadius: 8,
    color: '#0f172a',
    fontSize: 14,
  },
  inputMultiline: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    borderRadius: 8,
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#0f172a',
    fontSize: 14,
  },
  dateRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  rowItem: {
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rowInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    color: '#0f172a',
    fontSize: 13,
  },
  rowInputSmall: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
    borderRadius: 6,
    flex: 1,
    color: '#0f172a',
    fontSize: 13,
  },
  removeBtn: {
    marginTop: 6,
    alignSelf: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeBtnText: { color: '#e11d48', fontSize: 12, fontWeight: '600' },
  addBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  addBtnText: { color: '#4f46e5', fontWeight: '600', fontSize: 13 },
  privacyDescription: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  visibilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  visibilityContent: { flex: 1, marginRight: 10 },
  visibilityLabel: {
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
  },
  visibilityDescription: { color: '#64748b', fontSize: 12 },
  saveBtn: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  bottomActionBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    zIndex: 50,
  },
});
