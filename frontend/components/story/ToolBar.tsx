import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Pencil, Type, Music, AtSign, Image as ImageIcon, Trash2, Save } from 'lucide-react-native';

export default function ToolBar({
  mode,
  onSelectMode,
  onUndo,
  onPickImage,
  onSave,
}: {
  mode: string;
  onSelectMode: (m: string) => void;
  onUndo: () => void;
  onPickImage: () => void;
  onSave: () => void;
}) {
  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onPickImage} style={styles.btn}>
        <ImageIcon size={18} color="#111827" strokeWidth={2} />
        <Text style={styles.label}>Imagem</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onSelectMode(mode === 'draw' ? 'none' : 'draw')} style={[styles.btn, mode === 'draw' && styles.active]}>
        <Pencil size={18} color={mode === 'draw' ? '#fff' : '#111827'} strokeWidth={2} />
        <Text style={[styles.label, mode === 'draw' && styles.labelActive]}>Rabiscar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onSelectMode(mode === 'text' ? 'none' : 'text')} style={[styles.btn, mode === 'text' && styles.active]}>
        <Type size={18} color={mode === 'text' ? '#fff' : '#111827'} strokeWidth={2} />
        <Text style={[styles.label, mode === 'text' && styles.labelActive]}>Texto</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onSelectMode(mode === 'tag' ? 'none' : 'tag')} style={[styles.btn, mode === 'tag' && styles.active]}>
        <AtSign size={18} color={mode === 'tag' ? '#fff' : '#111827'} strokeWidth={2} />
        <Text style={[styles.label, mode === 'tag' && styles.labelActive]}>Marcar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onSelectMode(mode === 'music' ? 'none' : 'music')} style={[styles.btn, mode === 'music' && styles.active]}>
        <Music size={18} color={mode === 'music' ? '#fff' : '#111827'} strokeWidth={2} />
        <Text style={[styles.label, mode === 'music' && styles.labelActive]}>Música</Text>
      </TouchableOpacity>

      <View style={{ flex: 1 }} />

      <TouchableOpacity onPress={onUndo} style={styles.btnAction}>
        <Trash2 size={18} color="#ef4444" strokeWidth={2} />
      </TouchableOpacity>

      <TouchableOpacity onPress={onSave} style={[styles.btnAction, styles.saveBtn]}>
        <Save size={16} color="#fff" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e6edf8' },
  active: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  label: { fontSize: 12, fontWeight: '700', color: '#111827' },
  labelActive: { color: '#ffffff' },
  btnAction: { padding: 8, marginLeft: 6 },
  saveBtn: { backgroundColor: '#0856d6', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
});
