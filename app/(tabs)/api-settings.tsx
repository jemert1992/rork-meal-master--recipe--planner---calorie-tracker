import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, ScrollView, Pressable, Alert, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRecipeStore } from '@/store/recipeStore';
import { Database, Cloud, RefreshCw, Info, Key } from 'lucide-react-native';
import Colors from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ApiSettingsScreen() {
  const { 
    apiSources, 
    setApiSource, 
    useFirestore, 
    setUseFirestore,
    loadRecipesFromApi
  } = useRecipeStore();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [edamamAppId, setEdamamAppId] = useState('');
  const [edamamAppKey, setEdamamAppKey] = useState('');
  const [showEdamamConfig, setShowEdamamConfig] = useState(false);
  
  // Load saved Edamam credentials on mount
  React.useEffect(() => {
    const loadEdamamCredentials = async () => {
      try {
        const savedAppId = await AsyncStorage.getItem('edamam_app_id');
        const savedAppKey = await AsyncStorage.getItem('edamam_app_key');
        
        if (savedAppId) setEdamamAppId(savedAppId);
        if (savedAppKey) setEdamamAppKey(savedAppKey);
      } catch (error) {
        console.error('Error loading Edamam credentials:', error);
      }
    };
    
    loadEdamamCredentials();
  }, []);
  
  const handleToggleApiSource = (source: string, enabled: boolean) => {
    setApiSource(source, enabled);
  };
  
  const handleToggleFirestore = () => {
    if (!useFirestore) {
      Alert.alert(
        "Enable Firestore",
        "To use Firestore, you need to configure your Firebase project in services/firebaseService.ts. Have you done this?",
        [
          {
            text: "No, Cancel",
            style: "cancel"
          },
          {
            text: "Yes, Enable",
            onPress: () => setUseFirestore(true)
          }
        ]
      );
    } else {
      setUseFirestore(false);
    }
  };
  
  const handleRefreshRecipes = async () => {
    setIsRefreshing(true);
    try {
      await loadRecipesFromApi(false);
      Alert.alert(
        "Recipes Refreshed",
        "Successfully refreshed recipes from selected API sources."
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to refresh recipes. Please check your internet connection and try again."
      );
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const handleSaveEdamamCredentials = async () => {
    try {
      await AsyncStorage.setItem('edamam_app_id', edamamAppId);
      await AsyncStorage.setItem('edamam_app_key', edamamAppKey);
      
      Alert.alert(
        "Credentials Saved",
        "Your Edamam API credentials have been saved. You can now enable the Edamam API source.",
        [
          {
            text: "Enable Edamam",
            onPress: () => {
              setApiSource('useEdamam', true);
              setShowEdamamConfig(false);
            }
          },
          {
            text: "Later",
            style: "cancel",
            onPress: () => setShowEdamamConfig(false)
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to save Edamam credentials. Please try again."
      );
    }
  };
  
  const showApiInfo = (apiName: string) => {
    let title = '';
    let message = '';
    
    switch (apiName) {
      case 'MealDB':
        title = "TheMealDB API";
        message = "A free, open database of recipes from around the world. No API key required for basic usage.";
        break;
      case 'Spoonacular':
        title = "Spoonacular API";
        message = "A comprehensive food and recipe API with detailed nutritional information. Requires an API key with usage limits.";
        break;
      case 'Edamam':
        title = "Edamam Recipe API";
        message = "A powerful recipe database with extensive nutritional analysis. Requires an API key and app ID from Edamam. Sign up at developer.edamam.com to get your credentials.";
        break;
      case 'Firebase':
        title = "Firebase/Firestore";
        message = "Store recipes in your own Firebase Firestore database. Requires Firebase configuration in services/firebaseService.ts.";
        break;
    }
    
    Alert.alert(title, message);
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>API Settings</Text>
      <Text style={styles.subtitle}>Configure which recipe APIs to use</Text>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Storage</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Database size={20} color={useFirestore ? Colors.primary : Colors.textLight} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingName}>Use Firestore</Text>
                <Text style={styles.settingDescription}>Store and retrieve recipes from your Firebase Firestore database</Text>
              </View>
            </View>
            <Switch
              value={useFirestore}
              onValueChange={handleToggleFirestore}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={useFirestore ? Colors.primary : Colors.lightGray}
            />
            <Pressable 
              style={styles.infoButton} 
              onPress={() => showApiInfo('Firebase')}
            >
              <Info size={16} color={Colors.textLight} />
            </Pressable>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipe APIs</Text>
          <Text style={styles.sectionDescription}>
            Enable or disable recipe data sources. At least one source should be enabled.
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Cloud size={20} color={apiSources.useMealDB ? Colors.primary : Colors.textLight} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingName}>TheMealDB</Text>
                <Text style={styles.settingDescription}>Free, open recipe database</Text>
              </View>
            </View>
            <Switch
              value={apiSources.useMealDB}
              onValueChange={(enabled) => handleToggleApiSource('useMealDB', enabled)}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={apiSources.useMealDB ? Colors.primary : Colors.lightGray}
            />
            <Pressable 
              style={styles.infoButton} 
              onPress={() => showApiInfo('MealDB')}
            >
              <Info size={16} color={Colors.textLight} />
            </Pressable>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Cloud size={20} color={apiSources.useSpoonacular ? Colors.primary : Colors.textLight} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingName}>Spoonacular</Text>
                <Text style={styles.settingDescription}>Comprehensive food and recipe API</Text>
              </View>
            </View>
            <Switch
              value={apiSources.useSpoonacular}
              onValueChange={(enabled) => handleToggleApiSource('useSpoonacular', enabled)}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={apiSources.useSpoonacular ? Colors.primary : Colors.lightGray}
            />
            <Pressable 
              style={styles.infoButton} 
              onPress={() => showApiInfo('Spoonacular')}
            >
              <Info size={16} color={Colors.textLight} />
            </Pressable>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Cloud size={20} color={apiSources.useEdamam ? Colors.primary : Colors.textLight} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingName}>Edamam</Text>
                <Text style={styles.settingDescription}>Recipe database with nutritional analysis</Text>
                {edamamAppId && edamamAppKey ? (
                  <Text style={styles.configSuccess}>API credentials configured</Text>
                ) : (
                  <Text style={styles.configRequired}>Requires API key configuration</Text>
                )}
              </View>
            </View>
            <Switch
              value={apiSources.useEdamam}
              onValueChange={(enabled) => {
                if (enabled) {
                  if (!edamamAppId || !edamamAppKey) {
                    setShowEdamamConfig(true);
                  } else {
                    handleToggleApiSource('useEdamam', true);
                  }
                } else {
                  handleToggleApiSource('useEdamam', false);
                }
              }}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={apiSources.useEdamam ? Colors.primary : Colors.lightGray}
            />
            <Pressable 
              style={styles.infoButton} 
              onPress={() => showApiInfo('Edamam')}
            >
              <Info size={16} color={Colors.textLight} />
            </Pressable>
          </View>
          
          {showEdamamConfig && (
            <View style={styles.configSection}>
              <Text style={styles.configTitle}>
                <Key size={16} color={Colors.primary} /> Edamam API Configuration
              </Text>
              <Text style={styles.configInstructions}>
                Enter your Edamam API credentials below. You can get these by signing up at developer.edamam.com
              </Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>App ID</Text>
                <TextInput
                  style={styles.input}
                  value={edamamAppId}
                  onChangeText={setEdamamAppId}
                  placeholder="Enter your Edamam App ID"
                  placeholderTextColor={Colors.textLight}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>App Key</Text>
                <TextInput
                  style={styles.input}
                  value={edamamAppKey}
                  onChangeText={setEdamamAppKey}
                  placeholder="Enter your Edamam App Key"
                  placeholderTextColor={Colors.textLight}
                  secureTextEntry={true}
                />
              </View>
              
              <View style={styles.configButtonsContainer}>
                <Pressable 
                  style={styles.cancelButton}
                  onPress={() => setShowEdamamConfig(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                
                <Pressable 
                  style={[
                    styles.saveButton,
                    (!edamamAppId || !edamamAppKey) && styles.saveButtonDisabled
                  ]}
                  onPress={handleSaveEdamamCredentials}
                  disabled={!edamamAppId || !edamamAppKey}
                >
                  <Text style={styles.saveButtonText}>Save Credentials</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Configuration</Text>
          <Text style={styles.configInstructions}>
            To use all features, you need to configure API keys in the following files:
          </Text>
          
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
              {`// For Spoonacular API
// services/recipeApiService.ts
const SPOONACULAR_API_KEY = '802ab87547244544b1e9a9dc02f63a2b';

// For Edamam API
// Configured through the settings UI above
// or manually in services/edamamService.ts
const EDAMAM_APP_ID = 'YOUR_EDAMAM_APP_ID';
const EDAMAM_APP_KEY = 'YOUR_EDAMAM_APP_KEY';

// For Firebase/Firestore
// services/firebaseService.ts
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ...other Firebase config
};`}
            </Text>
          </View>
        </View>
        
        <Pressable 
          style={[styles.refreshButton, isRefreshing && styles.refreshButtonDisabled]}
          onPress={handleRefreshRecipes}
          disabled={isRefreshing}
        >
          <RefreshCw size={20} color={Colors.white} />
          <Text style={styles.refreshButtonText}>
            {isRefreshing ? "Refreshing..." : "Refresh Recipes"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  configRequired: {
    fontSize: 12,
    color: Colors.warning,
    marginTop: 2,
  },
  configSuccess: {
    fontSize: 12,
    color: Colors.success,
    marginTop: 2,
  },
  infoButton: {
    padding: 8,
    marginLeft: 8,
  },
  configInstructions: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 12,
    lineHeight: 20,
  },
  codeBlock: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#333',
  },
  refreshButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  refreshButtonDisabled: {
    backgroundColor: Colors.primaryLight,
  },
  refreshButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  configSection: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  configButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  cancelButtonText: {
    color: Colors.textLight,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.primaryLight,
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: '500',
  },
});