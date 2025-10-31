import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  useWindowDimensions,
  Platform,
  Pressable,
  ImageBackground,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { Audio } from 'expo-av';
import { X, Save, Undo2 } from 'lucide-react-native';
import { Canvas, ToolBar, MusicPicker, TagSearch, TextOverlay } from './story';
import type { Stroke, OverlayText } from './story/StoryEditorTypes';
import { addStory } from '../store/stories';

function usePanDrag(onMove: (dx: number, dy: number) => void) {
  const draggingRef = useRef<null | { x: number; y: number }>(null);
  const onStart = useCallback((e: any) => {
    draggingRef.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
  }, []);
  const onMoveEvt = useCallback((e: any) => {
    if (!draggingRef.current) return;
    const { x, y } = draggingRef.current;
    const dx = e.nativeEvent.pageX - x;
    const dy = e.nativeEvent.pageY - y;
    draggingRef.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
    onMove(dx, dy);
  }, [onMove]);
  const onEnd = useCallback(() => { draggingRef.current = null; }, []);
  return { onStart, onMoveEvt, onEnd };
}

export default function StoryEditor({ onClose }: { onClose?: () => void }) {
  const { width } = useWindowDimensions();
  const [bgUri, setBgUri] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [activeStroke, setActiveStroke] = useState<Stroke | null>(null);
  const [color, setColor] = useState('#ffffff');
  const [brush, setBrush] = useState(6);
  const [mode, setMode] = useState<'none' | 'draw' | 'text' | 'tag' | 'music'>('none');
  const [overlays, setOverlays] = useState<OverlayText[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [font, setFont] = useState<string>(Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) || 'System');
  const [textDraft, setTextDraft] = useState('');
  const [musicTrack, setMusicTrack] = useState<any | null>(null);
  const shotRef = useRef<View>(null);

  // Image picker
  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!res.canceled && res.assets && res.assets[0]?.uri) setBgUri(res.assets[0].uri);
  }, []);

  // Canvas touch handlers
  const onCanvasTouchStart = useCallback((e: any) => {
    if (mode !== 'draw') return;
    const { locationX, locationY } = e.nativeEvent;
    setActiveStroke({ color, width: brush, points: [{ x: locationX, y: locationY }] });
  }, [mode, color, brush]);

  const onCanvasTouchMove = useCallback((e: any) => {
    if (mode !== 'draw' || !activeStroke) return;
    const { locationX, locationY } = e.nativeEvent;
    setActiveStroke((prev) => prev ? { ...prev, points: [...prev.points, { x: locationX, y: locationY }] } : prev);
  }, [mode, activeStroke]);

  const onCanvasTouchEnd = useCallback(() => {
    if (mode !== 'draw' || !activeStroke) return;
    setStrokes((s) => [...s, activeStroke]);
    setActiveStroke(null);
  }, [mode, activeStroke]);

  const undo = useCallback(() => {
    if (mode === 'draw') setStrokes((s) => s.slice(0, -1));
    else if (selectedId) setOverlays((o) => o.filter((x) => x.id !== selectedId));
  }, [mode, selectedId]);

  // Add text overlay
  const addTextOverlay = useCallback(() => {
    const trimmed = textDraft.trim();
    if (!trimmed) return;
    const id = `t_${Date.now()}`;
    const ov: OverlayText = { id, type: 'text', text: trimmed, color, fontFamily: font, x: 40, y: 80, scale: 1, rotation: 0 };
    setOverlays((o) => [...o, ov]);
    setTextDraft('');
    setMode('none');
    setSelectedId(id);
  }, [textDraft, color, font]);

  // Add tag from TagSearch
  const addTag = useCallback((user: any) => {
    const id = `g_${Date.now()}`;
    const ov: OverlayText = { id, type: 'tag', text: `@${user.username || user.first_name || 'user'}`, color: '#3b82f6', fontFamily: Platform.select({ android: 'sans-serif-medium', default: 'System' }), x: 40, y: 40, scale: 1, rotation: 0 };
    setOverlays((o) => [...o, ov]);
    setMode('none');
  }, []);

  // Move overlay
  const moveOverlay = useCallback((id: string, dx: number, dy: number) => {
    setOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, x: o.x + dx, y: o.y + dy } : o)));
  }, []);

  const removeOverlay = useCallback((id: string) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  // Save/capture story
  const onSave = useCallback(async () => {
    if (!bgUri) return;
    try {
      const uri = await captureRef(shotRef, { format: 'jpg', quality: 0.9 });
      addStory({ id: `s_${Date.now()}`, user: { name: 'Você', avatar: 'https://i.pravatar.cc/160?img=1' }, postedAt: 'agora', postedAtHours: 0, caption: overlays.find(o => o.type === 'text')?.text || '', cover: uri as string, views: 0, likes: 0, segments: [{ id: 'seg1', type: 'image', uri: uri as string, durationMs: 5000 }] });
      if (onClose) onClose();
    } catch (e) {
      console.warn('save error', e);
    }
  }, [bgUri, overlays, onClose]);

  // Render overlay
  const renderOverlay = useCallback((o: OverlayText) => {
    const { onStart, onMoveEvt, onEnd } = usePanDrag((dx, dy) => moveOverlay(o.id, dx, dy));
    const selected = selectedId === o.id;
    return (
      <Pressable
        key={o.id}
        onStartShouldSetResponder={() => true}
        onResponderGrant={onStart as any}
        onResponderMove={onMoveEvt as any}
        onResponderRelease={onEnd as any}
        onPress={() => setSelectedId(o.id)}
        style={{ position: 'absolute', left: o.x, top: o.y }}
      >
        <TextOverlay item={o} selected={selected} onSelect={(id) => setSelectedId(id)} />
        {selected && (
          <View style={styles.overlayActions}>
            <TouchableOpacity onPress={() => removeOverlay(o.id)} style={styles.smallBtn}><Text style={{ color: '#ef4444' }}>Remover</Text></TouchableOpacity>
          </View>
        )}
      </Pressable>
    );
  }, [moveOverlay, selectedId, removeOverlay]);

  // Hook cleanup for audio from MusicPicker is handled inside MusicPicker
  useEffect(() => {
    return () => {
      // nothing extra to cleanup here
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.iconBtn}><X size={22} color="#111827" /></TouchableOpacity>
        <Text style={styles.title}>Criar story</Text>
        <TouchableOpacity onPress={onSave} style={[styles.saveBtn, !bgUri && { opacity: 0.6 }]} disabled={!bgUri}><Save size={16} color="#fff" /><Text style={styles.saveText}>Salvar</Text></TouchableOpacity>
      </View>

      <View style={styles.canvasWrapper}>
        {!bgUri ? (
          <View style={styles.emptyState}>
            <TouchableOpacity onPress={pickImage} style={styles.pickBtn}><Text style={styles.pickLabel}>Escolher imagem</Text></TouchableOpacity>
          </View>
        ) : (
          <ViewShot ref={shotRef} style={{ flex: 1 }}>
            <ImageBackground source={{ uri: bgUri }} style={{ flex: 1 }} resizeMode="cover">
              <Canvas
                strokes={strokes}
                activeStroke={activeStroke}
                onTouchStart={onCanvasTouchStart}
                onTouchMove={onCanvasTouchMove}
                onTouchEnd={onCanvasTouchEnd}
                overlays={overlays}
                renderOverlay={renderOverlay}
              />
            </ImageBackground>
          </ViewShot>
        )}
      </View>

      {/* tools and contextual panes */}
      <View style={styles.tools}>
        <ToolBar mode={mode} onSelectMode={(m) => setMode(m as any)} onUndo={undo} onPickImage={pickImage} onSave={onSave} />

        {mode === 'draw' && (
          <View style={styles.drawControls}>
            <TouchableOpacity onPress={() => setBrush(Math.max(2, brush - 2))} style={styles.brushBtn}><Text>-</Text></TouchableOpacity>
            <Text style={styles.brushLabel}>Espessura: {brush}</Text>
            <TouchableOpacity onPress={() => setBrush(Math.min(24, brush + 2))} style={styles.brushBtn}><Text>+</Text></TouchableOpacity>
          </View>
        )}

        {mode === 'text' && (
          <View style={styles.textComposer}>
            <TextInput value={textDraft} onChangeText={setTextDraft} placeholder="Digite seu texto" style={styles.textInput} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TouchableOpacity onPress={() => setColor('#ffffff')} style={[styles.colorSwatch, { backgroundColor: '#ffffff' }]} />
              <TouchableOpacity onPress={() => setColor('#000000')} style={[styles.colorSwatch, { backgroundColor: '#000000' }]} />
              <TouchableOpacity onPress={() => setColor('#ef4444')} style={[styles.colorSwatch, { backgroundColor: '#ef4444' }]} />
              <TouchableOpacity onPress={addTextOverlay} style={styles.applyBtn}><Text style={{ color: '#fff' }}>Adicionar</Text></TouchableOpacity>
            </View>
          </View>
        )}

        {mode === 'tag' && (
          <View style={{ marginTop: 8 }}>
            <TagSearch onSelect={(u) => addTag(u)} />
          </View>
        )}

        {mode === 'music' && (
          <View style={{ marginTop: 8 }}>
            <MusicPicker onSelect={(t) => setMusicTrack(t)} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  title: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0856d6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  saveText: { color: '#fff', marginLeft: 6, fontWeight: '700' },
  canvasWrapper: { flex: 1, backgroundColor: '#000' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pickBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#dbeafe' },
  pickLabel: { color: '#0856d6', fontWeight: '700' },
  tools: { borderTopWidth: 1, borderColor: '#f1f5f9', padding: 10, backgroundColor: '#fff' },
  drawControls: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  brushBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  brushLabel: { fontWeight: '700' },
  textComposer: { marginTop: 8 },
  textInput: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#e6eef8' },
  colorSwatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: '#e6eef8' },
  applyBtn: { backgroundColor: '#0856d6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  overlayActions: { position: 'absolute', top: -32, right: -6 },
  smallBtn: { padding: 6, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e6eef8' },
});
