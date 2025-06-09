import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Upload, Database } from 'lucide-react-native';
import { useRecipeStore } from '@/store/recipeStore';
import Colors from '@/constants/colors';
import { mockRecipes } from '@/constants/mockData';
import { Recipe } from '@/types';

export default function ImportRecipesScreen() {
  const router = useRouter();
  const { importRecipesToFirestore, setUseFirestore, useFirestore } = useRecipeStore();
  const [isImporting, setIsImporting] = useState(false);
  const [importCount, setImportCount] = useState(10);
  const [importResults, setImportResults] = useState<{
    added: number;
    duplicates: number;
    errors: number;
  } | null>(null);

  const handleBackPress = () => {
    router.back();
  };

  const handleImportMockRecipes = async () => {
    if (!useFirestore) {
      Alert.alert(
        "Firestore Required",
        "You need to enable Firestore to import recipes. Enable it now?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Enable",
            onPress: () => {
              setUseFirestore(true);
              // Don't start import yet, let user confirm after enabling
            }
          }
        ]
      );
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      // Select a subset of mock recipes to import
      const recipesToImport = mockRecipes.slice(0, importCount) as Recipe[];
      
      // Import recipes to Firestore
      const results = await importRecipesToFirestore(recipesToImport);
      
      // Update results
      setImportResults(results);
      
      // Show success message
      Alert.alert(
        "Import Complete",
        `Successfully imported recipes to Firestore:

Added: ${results.added}
Duplicates: ${results.duplicates}
Errors: ${results.errors}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Error importing recipes:', error);
      Alert.alert(
        "Import Failed",
        "There was an error importing recipes to Firestore. Please check your connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsImporting(false);
    }
  };

  const toggleFirestore = () => {
    setUseFirestore(!useFirestore);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBackPress}>
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Import Recipes</Text>
        <Pressable style={styles.firestoreToggle} onPress={toggleFirestore}>
          <Database size={20} color={useFirestore ? Colors.primary : Colors.textLight} />
          <Text style={[styles.firestoreText, useFirestore && styles.firestoreTextActive]}>
            {useFirestore ? 'Firestore Enabled' : 'Firestore Disabled'}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import Mock Recipes</Text>
          <Text style={styles.sectionDescription}>
            Import a selection of mock recipes to Firestore. This will add new recipes to your database.
          </Text>

          <View style={styles.importOptions}>
            <Text style={styles.optionLabel}>Number of recipes to import:</Text>
            <TextInput
              style={styles.countInput}
              value={importCount.toString()}
              onChangeText={(text) => setImportCount(parseInt(text) || 0)}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>

          <Pressable
            style={[styles.importButton, isImporting && styles.importButtonDisabled]}
            onPress={handleImportMockRecipes}
            disabled={isImporting}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Upload size={20} color={Colors.white} />
                <Text style={styles.importButtonText}>Import Mock Recipes</Text>
              </>
            )}
          </Pressable>

          {importResults && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Import Results</Text>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Added:</Text>
                <Text style={styles.resultValue}>{importResults.added}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Duplicates:</Text>
                <Text style={styles.resultValue}>{importResults.duplicates}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Errors:</Text>
                <Text style={styles.resultValue}>{importResults.errors}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Firestore Configuration</Text>
          <Text style={styles.sectionDescription}>
            Before importing recipes, make sure you have configured your Firebase project correctly.
            You need to update the Firebase configuration in services/firebaseService.ts with your own project details.
          </Text>

          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
              {`// In services/firebaseService.ts

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};`}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Firestore Indexes</Text>
          <Text style={styles.sectionDescription}>
            For optimal performance, create the following composite indexes in your Firestore database:
          </Text>

          <View style={styles.indexList}>
            <View style={styles.indexItem}>
              <Text style={styles.indexTitle}>Collection: recipes</Text>
              <Text style={styles.indexFields}>Fields: tags.meal_type ASC, created_at DESC</Text>
            </View>
            <View style={styles.indexItem}>
              <Text style={styles.indexTitle}>Collection: recipes</Text>
              <Text style={styles.indexFields}>Fields: tags.complexity ASC, created_at DESC</Text>
            </View>
            <View style={styles.indexItem}>
              <Text style={styles.indexTitle}>Collection: recipes</Text>
              <Text style={styles.indexFields}>Fields: tags.diet ARRAY_CONTAINS, created_at DESC</Text>
            </View>
            <View style={styles.indexItem}>
              <Text style={styles.indexTitle}>Collection: recipes</Text>
              <Text style={styles.indexFields}>Fields: tags.goal ARRAY_CONTAINS, created_at DESC</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  firestoreToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  firestoreText: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 6,
  },
  firestoreTextActive: {
    color: Colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
    lineHeight: 20,
  },
  importOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 14,
    color: Colors.text,
    marginRight: 12,
  },
  countInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 80,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  importButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importButtonDisabled: {
    backgroundColor: Colors.primaryLight,
  },
  importButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  resultsContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  codeBlock: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#333',
  },
  indexList: {
    marginTop: 8,
  },
  indexItem: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  indexTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  indexFields: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});