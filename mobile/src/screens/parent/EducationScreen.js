import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert
} from 'react-native';
import { educationAPI } from '../../services/api';

const COLORS = { primary: '#8E44AD', bg: '#F5EEF8', text: '#4A235A', accent: '#AF7AC5' };

export default function EducationScreen({ route }) {
  const { child } = route.params;
  const [subject, setSubject] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState('choose'); // 'choose' | 'test' | 'result'
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await educationAPI.history(child.id);
      setHistory(res.data);
    } catch {}
  };

  const startTest = async (subj) => {
    setLoading(true);
    setSubject(subj);
    try {
      const res = await educationAPI.getTest(child.id, subj);
      setQuestions(res.data);
      setAnswers({});
      setStep('test');
    } catch (e) {
      Alert.alert('Xatolik', 'Savollar topilmadi');
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (qId, option) => {
    setAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const submitTest = async () => {
    if (Object.keys(answers).length < questions.length) {
      Alert.alert('Diqqat', 'Barcha savollarga javob bering');
      return;
    }
    setLoading(true);
    try {
      const formatted = questions.map((q) => ({
        question_id: q.id,
        selected: answers[q.id],
      }));
      const res = await educationAPI.submitTest(child.id, subject, formatted);
      setResult(res.data);
      setStep('result');
      loadHistory();
    } catch {
      Alert.alert('Xatolik');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
  );

  if (step === 'choose') return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.title}>📚 Testlar</Text>
      <Text style={styles.sub}>{child.full_name} • {child.grade}-sinf</Text>

      <TouchableOpacity style={[styles.subjectCard, { backgroundColor: '#2ECC71' }]} onPress={() => startTest('math')}>
        <Text style={styles.subjectIcon}>🔢</Text>
        <Text style={styles.subjectName}>Matematika</Text>
        <Text style={styles.subjectGrade}>{child.grade}-sinf darajasida</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.subjectCard, { backgroundColor: '#3498DB' }]} onPress={() => startTest('english')}>
        <Text style={styles.subjectIcon}>🔤</Text>
        <Text style={styles.subjectName}>Ingliz tili</Text>
        <Text style={styles.subjectGrade}>{child.grade}-sinf darajasida</Text>
      </TouchableOpacity>

      {history.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Oxirgi natijalar</Text>
          {history.slice(0, 5).map((s) => (
            <View key={s.id} style={styles.historyCard}>
              <Text style={styles.historySubject}>{s.subject === 'math' ? '🔢 Matematika' : '🔤 Ingliz tili'}</Text>
              <Text style={styles.historyScore}>{s.score}/{s.total}</Text>
              <Text style={[styles.historyPercent, { color: s.score / s.total >= 0.6 ? '#2ECC71' : '#E74C3C' }]}>
                {Math.round(s.score / s.total * 100)}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  if (step === 'test') return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.testHeader}>
        {subject === 'math' ? '🔢 Matematika' : '🔤 Ingliz tili'} testi
      </Text>
      <Text style={styles.testProgress}>{Object.keys(answers).length}/{questions.length} javob berildi</Text>

      {questions.map((q, idx) => (
        <View key={q.id} style={styles.questionCard}>
          <Text style={styles.questionNum}>Savol {idx + 1}</Text>
          <Text style={styles.questionText}>{q.question_text}</Text>
          {['A','B','C','D'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.optionBtn,
                answers[q.id] === opt && styles.optionSelected,
              ]}
              onPress={() => selectAnswer(q.id, opt)}
            >
              <Text style={[styles.optionLabel, answers[q.id] === opt && styles.optionLabelSelected]}>
                {opt}
              </Text>
              <Text style={[styles.optionText, answers[q.id] === opt && { color: '#fff' }]}>
                {q[`option_${opt.toLowerCase()}`]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <TouchableOpacity style={styles.submitBtn} onPress={submitTest}>
        <Text style={styles.submitText}>Testni Yakunlash</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (step === 'result') return (
    <View style={styles.center}>
      <Text style={styles.resultIcon}>{result.score / result.total >= 0.6 ? '🏆' : '📝'}</Text>
      <Text style={styles.resultScore}>{result.score}/{result.total}</Text>
      <Text style={styles.resultPercent}>{Math.round(result.score / result.total * 100)}%</Text>
      <Text style={styles.resultMsg}>
        {result.score / result.total >= 0.8 ? 'Ajoyib natija! 🎉' :
         result.score / result.total >= 0.6 ? 'Yaxshi! Davom eting 👍' : 'Ko\'proq mashq qiling 💪'}
      </Text>
      <TouchableOpacity style={styles.backBtn} onPress={() => setStep('choose')}>
        <Text style={styles.backBtnText}>Orqaga</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inner: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: 14, color: COLORS.accent, marginTop: 4, marginBottom: 24 },
  subjectCard: {
    borderRadius: 20, padding: 24, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 16, elevation: 3,
  },
  subjectIcon: { fontSize: 40 },
  subjectName: { fontSize: 20, fontWeight: '800', color: '#fff', flex: 1 },
  subjectGrade: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  historySection: { marginTop: 24 },
  historyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  historyCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 8, elevation: 1,
  },
  historySubject: { flex: 1, fontSize: 14, color: COLORS.text },
  historyScore: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginRight: 8 },
  historyPercent: { fontSize: 13, fontWeight: '700', minWidth: 36 },
  testHeader: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  testProgress: { fontSize: 13, color: COLORS.accent, marginBottom: 20 },
  questionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16, elevation: 2 },
  questionNum: { fontSize: 12, color: COLORS.accent, fontWeight: '600', marginBottom: 6 },
  questionText: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 14 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E8D5F5', borderRadius: 10,
    padding: 12, marginBottom: 8,
  },
  optionSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionLabel: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#E8D5F5', textAlign: 'center', lineHeight: 24,
    fontWeight: '700', color: COLORS.primary, marginRight: 12,
  },
  optionLabelSelected: { backgroundColor: 'rgba(255,255,255,0.3)', color: '#fff' },
  optionText: { fontSize: 14, color: COLORS.text, flex: 1 },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resultIcon: { fontSize: 80, marginBottom: 16 },
  resultScore: { fontSize: 48, fontWeight: '800', color: COLORS.text },
  resultPercent: { fontSize: 24, color: COLORS.accent, fontWeight: '600' },
  resultMsg: { fontSize: 18, color: COLORS.text, marginTop: 12, fontWeight: '600' },
  backBtn: {
    marginTop: 32, backgroundColor: COLORS.primary, borderRadius: 12,
    paddingHorizontal: 36, paddingVertical: 14,
  },
  backBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
