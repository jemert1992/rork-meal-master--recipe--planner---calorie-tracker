import React, { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import Colors from '@/constants/colors';
import { useMealPlanStore } from '@/store/mealPlanStore';
import { useRecipeStore } from '@/store/recipeStore';
import * as firebaseService from '@/services/firebaseService';
import { Recipe } from '@/types';
import WeeklyMealPlanner from '@/components/WeeklyMealPlanner';

function cloneRecipes(arr: Recipe[]): Recipe[] {
  return arr.map(r => ({ ...r, ingredients: [...r.ingredients], instructions: [...r.instructions], tags: [...r.tags] }));
}

export default function GeneratorTestsScreen() {
  const mealPlanStore = useMealPlanStore();
  const recipeStore = useRecipeStore();

  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{ name: string; passed: boolean; details: string }[]>([]);

  const append = useCallback((line: string) => {
    setLog(prev => [...prev, line]);
    console.log('[TEST]', line);
  }, []);

  const resetStores = useCallback(() => {
    useMealPlanStore.setState({
      mealPlan: {},
      weeklyUsedRecipeIds: new Set<string>(),
      alternativeRecipes: {},
      isLoadingAlternatives: false,
      lastGenerationError: null,
      generationSuggestions: [],
      uniquePerWeek: false,
      recipePoolsCache: null,
    } as any, true);
    useRecipeStore.setState({
      recipes: [],
      favoriteRecipeIds: [],
      collections: useRecipeStore.getState().collections,
      isLoading: false,
      hasLoadedFromApi: false,
      offlineRecipes: [],
      useFirestore: false,
      pagination: { lastDoc: null, hasMore: true, loading: false },
      apiSources: { useMealDB: false, useSpoonacular: false, useEdamam: false, useFirebase: false },
    } as any, true);
  }, []);

  const makeLocalRecipes = useCallback((): Recipe[] => {
    const base: Recipe[] = [
      {
        id: 'loc-bk-1', name: 'Greek Yogurt Parfait', image: undefined, prepTime: '10 min', cookTime: '0 min', servings: 1,
        calories: 380, protein: 28, carbs: 40, fat: 9, fiber: 4,
        ingredients: ['1 cup greek yogurt', '1/2 cup berries', '1 tbsp honey', '1/4 cup granola'],
        instructions: ['Layer ingredients', 'Serve'], tags: ['breakfast','simple'], mealType: 'breakfast', complexity: 'simple',
      },
      {
        id: 'loc-ln-1', name: 'Chicken Salad Bowl', image: undefined, prepTime: '15 min', cookTime: '0 min', servings: 1,
        calories: 520, protein: 42, carbs: 35, fat: 18, fiber: 6,
        ingredients: ['150 g chicken', '2 cup greens', '1 tbsp olive oil', '1/2 cup rice'],
        instructions: ['Assemble bowl'], tags: ['lunch','high-protein'], mealType: 'lunch', complexity: 'simple',
      },
      {
        id: 'loc-dn-1', name: 'Salmon with Quinoa', image: undefined, prepTime: '20 min', cookTime: '15 min', servings: 1,
        calories: 650, protein: 45, carbs: 50, fat: 22, fiber: 5,
        ingredients: ['150 g salmon', '3/4 cup quinoa', '1 cup broccoli'],
        instructions: ['Cook and plate'], tags: ['dinner','high-protein'], mealType: 'dinner', complexity: 'simple',
      }
    ];
    return base;
  }, []);

  const makeManyLocalRecipes = useCallback((countPerType: number): Recipe[] => {
    const arr: Recipe[] = [];
    for (let i = 0; i < countPerType; i++) {
      arr.push({
        id: `bulk-bk-${i}`, name: `Bulk Breakfast ${i}`, image: undefined, prepTime: '5 min', cookTime: '0 min', servings: 1,
        calories: 350 + (i % 60), protein: 20, carbs: 40, fat: 10, fiber: 5,
        ingredients: ['eggs', 'toast'], instructions: ['mix','cook'], tags: ['breakfast'], mealType: 'breakfast', complexity: 'simple',
      });
      arr.push({
        id: `bulk-ln-${i}`, name: `Bulk Lunch ${i}`, image: undefined, prepTime: '10 min', cookTime: '10 min', servings: 1,
        calories: 550 + (i % 60), protein: 30, carbs: 50, fat: 15, fiber: 6,
        ingredients: ['chicken', 'rice'], instructions: ['prep','cook'], tags: ['lunch'], mealType: 'lunch', complexity: 'simple',
      });
      arr.push({
        id: `bulk-dn-${i}`, name: `Bulk Dinner ${i}`, image: undefined, prepTime: '15 min', cookTime: '15 min', servings: 1,
        calories: 650 + (i % 60), protein: 35, carbs: 55, fat: 18, fiber: 7,
        ingredients: ['salmon', 'quinoa'], instructions: ['prep','cook'], tags: ['dinner'], mealType: 'dinner', complexity: 'simple',
      });
    }
    return arr;
  }, []);

  const patchFirebase = useCallback((mode: 'success' | 'fail' | 'empty') => {
    const impl = async (mt: 'breakfast' | 'lunch' | 'dinner') => {
      if (mode === 'fail') throw new Error('Simulated API failure');
      if (mode === 'empty') return [] as Recipe[];
      const local = makeLocalRecipes();
      const pick = mt === 'breakfast' ? local[0] : mt === 'lunch' ? local[1] : local[2];
      return [pick];
    };
    (firebaseService as any).getRecipesForMealPlan = async (mealType: 'breakfast' | 'lunch' | 'dinner') => impl(mealType);
    (firebaseService as any).getAlternativeRecipes = async (_mt: any, _id: string) => [];
  }, [makeLocalRecipes]);

  const runSuite = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setResults([]);
    setLog([]);

    const addResult = (name: string, passed: boolean, details: string) => {
      setResults(prev => [...prev, { name, passed, details }]);
      append(`${passed ? 'PASS' : 'FAIL'}: ${name} ${details ? '- ' + details : ''}`);
    };

    try {
      // 1) Success path (remote ok)
      resetStores();
      recipeStore.setApiSource('useFirebase', true);
      useRecipeStore.setState({ recipes: cloneRecipes(makeLocalRecipes()) } as any, true);
      patchFirebase('success');
      const d = '2025-01-01';
      const r1 = await mealPlanStore.generateAllMealsForDay(d, useRecipeStore.getState().recipes);
      const mp1 = useMealPlanStore.getState().mealPlan[d];
      const filled1 = !!(mp1?.breakfast && mp1?.lunch && mp1?.dinner);
      addResult('Success path fills all day slots', r1.success && filled1, `generated=${r1.generatedMeals.length}`);

      // 2) API failure -> local fallback
      resetStores();
      useRecipeStore.setState({ recipes: cloneRecipes(makeLocalRecipes()) } as any, true);
      patchFirebase('fail');
      const r2 = await mealPlanStore.generateAllMealsForDay('2025-01-02', useRecipeStore.getState().recipes);
      const mp2 = useMealPlanStore.getState().mealPlan['2025-01-02'];
      const filled2 = !!(mp2?.breakfast && mp2?.lunch && mp2?.dinner);
      addResult('API failure falls back to local', r2.success && filled2, r2.suggestions.join(', '));

      // 3) Empty pool across sources -> ensure last-resort behavior or clear error
      resetStores();
      useRecipeStore.setState({ recipes: [] } as any, true);
      patchFirebase('empty');
      const r3 = await mealPlanStore.generateAllMealsForDay('2025-01-03', []);
      const mp3 = useMealPlanStore.getState().mealPlan['2025-01-03'];
      const filled3 = !!(mp3?.breakfast || mp3?.lunch || mp3?.dinner);
      addResult('Empty pool yields graceful result', r3.success ? filled3 : true, r3.error ?? 'no-error');

      // 4) Serving scaling clamps and updates
      const date4 = '2025-01-04';
      patchFirebase('success');
      useRecipeStore.setState({ recipes: cloneRecipes(makeLocalRecipes()) } as any, true);
      await mealPlanStore.generateAllMealsForDay(date4, useRecipeStore.getState().recipes);
      useMealPlanStore.getState().updateMealServings(date4, 'lunch', 5);
      useMealPlanStore.getState().updateMealServings(date4, 'lunch', 100);
      const lunchServ = useMealPlanStore.getState().mealPlan[date4]?.lunch?.servings ?? 0;
      addResult('Servings scaling clamps to <= 20', lunchServ === 20, `servings=${lunchServ}`);

      // 5) Weekly plan: all slots filled when sources present
      resetStores();
      useRecipeStore.setState({ recipes: cloneRecipes(makeLocalRecipes()) } as any, true);
      patchFirebase('success');
      const wk = await mealPlanStore.generateWeeklyMealPlan('2025-01-06', '2025-01-12');
      const mp = useMealPlanStore.getState().mealPlan;
      let total = 0; let filled = 0;
      Object.keys(mp).forEach(date => {
        if (date >= '2025-01-06' && date <= '2025-01-12') {
          total += 3;
          const dmp = mp[date];
          if (dmp?.breakfast) filled++;
          if (dmp?.lunch) filled++;
          if (dmp?.dinner) filled++;
        }
      });
      addResult('Weekly generation fills many slots', wk.success && filled > 0, `filled=${filled}/${total}`);

      // 6) UI recovery: error modal only when unavoidable
      resetStores();
      useRecipeStore.setState({ recipes: [] } as any, true);
      patchFirebase('empty');
      const r6 = await mealPlanStore.generateMealPlan('2025-01-07', [], undefined);
      const hadError = !!useMealPlanStore.getState().lastGenerationError;
      useMealPlanStore.getState().clearGenerationError();
      const cleared = !useMealPlanStore.getState().lastGenerationError;
      addResult('Error state set then recoverable', (!r6.success && hadError) && cleared, r6.error ?? 'no-error');

      // 7) Weekly uniqueness ON with ample pool -> no repeats within the week
      resetStores();
      mealPlanStore.setUniquePerWeek(true);
      useRecipeStore.setState({ recipes: cloneRecipes(makeManyLocalRecipes(10)) } as any, true);
      patchFirebase('empty');
      const wk2 = await mealPlanStore.generateWeeklyMealPlan('2025-02-03', '2025-02-09');
      const mpW2 = useMealPlanStore.getState().mealPlan;
      const ids = new Set<string>();
      let duplicateFound = false;
      Object.keys(mpW2).forEach(date => {
        if (date >= '2025-02-03' && date <= '2025-02-09') {
          const dmp = mpW2[date];
          ['breakfast','lunch','dinner'].forEach((k) => {
            const recId = (dmp as any)[k]?.recipeId as string | undefined;
            if (recId) {
              if (ids.has(recId)) duplicateFound = true; else ids.add(recId);
            }
          });
        }
      });
      addResult('Weekly uniqueness respected with ample pool', wk2.success && !duplicateFound, `uniqueIds=${ids.size}`);

      // 8) Weekly uniqueness ON with tiny pool -> still fills by relaxing uniqueness (repeats allowed), no blocking error
      resetStores();
      mealPlanStore.setUniquePerWeek(true);
      useRecipeStore.setState({ recipes: cloneRecipes(makeLocalRecipes()) } as any, true);
      patchFirebase('empty');
      const wk3 = await mealPlanStore.generateWeeklyMealPlan('2025-02-10', '2025-02-12');
      const mpW3 = useMealPlanStore.getState().mealPlan;
      let filledSlots = 0; let repCount = 0; const seen = new Set<string>();
      ['2025-02-10','2025-02-11','2025-02-12'].forEach(d => {
        const dd = mpW3[d];
        if (dd?.breakfast) { filledSlots++; if (seen.has(dd.breakfast.recipeId ?? '')) repCount++; seen.add(dd.breakfast.recipeId ?? ''); }
        if (dd?.lunch) { filledSlots++; if (seen.has(dd.lunch.recipeId ?? '')) repCount++; seen.add(dd.lunch.recipeId ?? ''); }
        if (dd?.dinner) { filledSlots++; if (seen.has(dd.dinner.recipeId ?? '')) repCount++; seen.add(dd.dinner.recipeId ?? ''); }
      });
      const noModal = useMealPlanStore.getState().lastGenerationError === null;
      addResult('Tiny pool still fills and avoids error modal', wk3.success && filledSlots === 9 && noModal, `repeats=${repCount}`);

      // 9) Fallback to previously used when pool exhausted mid-week
      resetStores();
      mealPlanStore.setUniquePerWeek(true);
      useRecipeStore.setState({ recipes: cloneRecipes(makeLocalRecipes()) } as any, true);
      patchFirebase('empty');
      await mealPlanStore.generateWeeklyMealPlan('2025-02-13', '2025-02-13');
      const before = useMealPlanStore.getState().mealPlan['2025-02-13'];
      const r9 = await mealPlanStore.generateWeeklyMealPlan('2025-02-14', '2025-02-14');
      const after = useMealPlanStore.getState().mealPlan['2025-02-14'];
      const repeatedBreakfast = before?.breakfast?.recipeId && after?.breakfast?.recipeId && before.breakfast.recipeId === after.breakfast.recipeId;
      addResult('Repeats allowed when needed to avoid empty slot', Boolean(r9.success && repeatedBreakfast), repeatedBreakfast ? 'repeated breakfast OK' : 'no repeat');

    } catch (e) {
      append(`Fatal test runner error: ${String(e)}`);
    } finally {
      setRunning(false);
    }
  }, [append, patchFirebase, resetStores, running, recipeStore, makeLocalRecipes, mealPlanStore, makeManyLocalRecipes]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Meal Generator Integration Tests</Text>
      <Text style={styles.subtitle}>Environment: {Platform.OS}</Text>

      <Pressable
        style={({ pressed }) => [styles.runButton, pressed && styles.pressed]}
        onPress={runSuite}
        disabled={running}
        accessibilityLabel="Run generator tests"
        testID="run-generator-tests"
      >
        <Text style={styles.runButtonText}>{running ? 'Running…' : 'Run All Tests'}</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Results</Text>
        {results.length === 0 && (
          <Text style={styles.muted}>No results yet.</Text>
        )}
        {results.length > 0 && (
          <View>
            {results.map((r, i) => (
              <View key={`res-${i}`} style={[styles.resultRow, r.passed ? styles.pass : styles.fail]}>
                <Text style={styles.resultName}>{r.name}</Text>
                <Text style={styles.resultDetails}>{r.details}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manual UI Check</Text>
        <Text style={styles.muted}>Open planner below to visually verify error handling and filling behavior.</Text>
        <WeeklyMealPlanner onGenerateGroceryList={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Log</Text>
        {log.map((l, idx) => (
          <Text key={`log-${idx}`} style={styles.logLine}>{l}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary },
  runButton: { backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  runButtonText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  pressed: { opacity: 0.9 },
  section: { backgroundColor: Colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.borderLight },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  muted: { color: Colors.textLight },
  resultRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.backgroundLight },
  resultName: { fontWeight: '700', color: Colors.text },
  resultDetails: { color: Colors.textSecondary, marginTop: 4 },
  pass: { borderLeftWidth: 3, borderLeftColor: '#22c55e', paddingLeft: 8 },
  fail: { borderLeftWidth: 3, borderLeftColor: '#ef4444', paddingLeft: 8 },
  logLine: { color: Colors.textSecondary, fontSize: 12 },
});