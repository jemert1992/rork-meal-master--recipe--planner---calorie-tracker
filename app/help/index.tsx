import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronRight,
  Target,
  Calendar,
  ShoppingCart,
  Utensils,
  Settings,
  HelpCircle
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useTutorialStore } from '@/store/tutorialStore';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: 'How do I set up my nutrition goals?',
    answer: 'Go to your Profile tab and tap "Edit Profile". Enter your personal information like age, weight, height, and activity level. The app will automatically calculate your nutrition goals based on this information.',
    category: 'Getting Started'
  },
  {
    id: '2',
    question: 'How does the "Pick for Me" feature work?',
    answer: 'The "Pick for Me" feature automatically selects meals based on your dietary preferences, nutrition goals, and allergies. It ensures variety by avoiding recently used recipes and balances your daily nutrition.',
    category: 'Meal Planning'
  },
  {
    id: '3',
    question: 'Can I add custom meals?',
    answer: 'Yes! When adding a meal, you can create custom meals by entering the meal name, calories, and nutritional information manually. This is perfect for homemade recipes or meals not in our database.',
    category: 'Meal Planning'
  },
  {
    id: '4',
    question: 'How is my grocery list generated?',
    answer: 'Your grocery list is automatically created from all the recipes in your meal plan. The app extracts ingredients, combines similar items, and organizes them by category for efficient shopping.',
    category: 'Grocery Lists'
  },
  {
    id: '5',
    question: 'What dietary preferences are supported?',
    answer: 'We support various dietary preferences including vegetarian, vegan, keto, paleo, gluten-free, dairy-free, low-carb, and high-protein diets. You can set these in your profile.',
    category: 'Dietary Preferences'
  },
  {
    id: '6',
    question: 'How do I track my daily nutrition?',
    answer: 'Use the nutrition bar on your home screen and meal plan to see your daily progress. You can also add individual food items in the Profile tab\'s calorie tracker for more detailed tracking.',
    category: 'Nutrition Tracking'
  },
  {
    id: '7',
    question: 'Can I plan meals for multiple days?',
    answer: 'Absolutely! Use the date selector in the meal plan to navigate between days. You can plan your entire week in advance and generate grocery lists for multiple days.',
    category: 'Meal Planning'
  },
  {
    id: '8',
    question: 'How do I handle food allergies?',
    answer: 'Set your allergies in your profile under "Edit Profile". The app will automatically filter out recipes containing your allergens when generating meal plans.',
    category: 'Dietary Preferences'
  }
];

const FEATURE_GUIDES = [
  {
    id: 'nutrition',
    title: 'Nutrition Tracking',
    description: 'Monitor your daily calories, protein, carbs, and fats',
    icon: Target,
    color: Colors.primary
  },
  {
    id: 'meal-planning',
    title: 'Meal Planning',
    description: 'Plan your weekly meals with smart recommendations',
    icon: Calendar,
    color: '#4CAF50'
  },
  {
    id: 'grocery-lists',
    title: 'Smart Grocery Lists',
    description: 'Auto-generate shopping lists from your meal plans',
    icon: ShoppingCart,
    color: '#FF9800'
  },
  {
    id: 'recipes',
    title: 'Recipe Discovery',
    description: 'Find recipes that match your preferences',
    icon: Utensils,
    color: '#9C27B0'
  }
];

export default function HelpScreen() {
  const router = useRouter();
  const { startTutorial } = useTutorialStore();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(FAQ_DATA.map(item => item.category)))];
  
  const filteredFAQ = selectedCategory === 'All' 
    ? FAQ_DATA 
    : FAQ_DATA.filter(item => item.category === selectedCategory);

  const handleFAQPress = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleRestartTutorial = () => {
    startTutorial();
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <Pressable style={styles.actionCard} onPress={handleRestartTutorial}>
            <View style={styles.actionIcon}>
              <HelpCircle size={24} color={Colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Restart Tutorial</Text>
              <Text style={styles.actionDescription}>
                Take the guided tour again to learn about all features
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.textLight} />
          </Pressable>
        </View>

        {/* Feature Guides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feature Guides</Text>
          
          {FEATURE_GUIDES.map((guide) => (
            <View key={guide.id} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: guide.color + '20' }]}>
                <guide.icon size={24} color={guide.color} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{guide.title}</Text>
                <Text style={styles.featureDescription}>{guide.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {/* Category Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryFilter}
            contentContainerStyle={styles.categoryFilterContent}
          >
            {categories.map((category) => (
              <Pressable
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.categoryButtonTextActive
                ]}>
                  {category}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* FAQ Items */}
          {filteredFAQ.map((item) => (
            <View key={item.id} style={styles.faqCard}>
              <Pressable
                style={styles.faqHeader}
                onPress={() => handleFAQPress(item.id)}
              >
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <ChevronDown 
                  size={20} 
                  color={Colors.textLight}
                  style={[
                    styles.faqChevron,
                    expandedFAQ === item.id && styles.faqChevronExpanded
                  ]}
                />
              </Pressable>
              
              {expandedFAQ === item.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{item.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need More Help?</Text>
          
          <View style={styles.contactCard}>
            <Text style={styles.contactTitle}>Still have questions?</Text>
            <Text style={styles.contactDescription}>
              We're here to help! The tutorial covers all the main features, and this FAQ should answer most questions.
            </Text>
            
            <View style={styles.contactActions}>
              <Pressable style={styles.contactButton} onPress={handleRestartTutorial}>
                <Text style={styles.contactButtonText}>Take Tutorial Again</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
  categoryFilter: {
    marginBottom: 16,
  },
  categoryFilterContent: {
    paddingRight: 24,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  categoryButtonTextActive: {
    color: Colors.white,
  },
  faqCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  faqChevron: {
    transform: [{ rotate: '0deg' }],
  },
  faqChevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  faqAnswerText: {
    fontSize: 15,
    color: Colors.textLight,
    lineHeight: 22,
    marginTop: 12,
  },
  contactCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  contactDescription: {
    fontSize: 15,
    color: Colors.textLight,
    lineHeight: 22,
    marginBottom: 20,
  },
  contactActions: {
    alignItems: 'center',
  },
  contactButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  contactButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  bottomPadding: {
    height: 40,
  },
});