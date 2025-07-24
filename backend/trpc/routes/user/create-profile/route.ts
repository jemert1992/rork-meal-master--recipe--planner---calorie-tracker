import { z } from 'zod';
import { publicProcedure } from '../../create-context';

const createProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(13).max(120),
  gender: z.enum(['male', 'female', 'other']),
  weight: z.number().min(30).max(500), // in kg
  height: z.number().min(100).max(250), // in cm
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very-active']),
  dietType: z.enum(['any', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'gluten-free', 'dairy-free', 'low-carb']),
  allergies: z.array(z.string()).optional().default([]),
  calorieGoal: z.number().optional(),
  proteinGoal: z.number().optional(),
  carbsGoal: z.number().optional(),
  fatGoal: z.number().optional(),
  fitnessGoals: z.array(z.enum(['weight-loss', 'muscle-gain', 'general-health', 'heart-health', 'energy-boost', 'high-protein'])).optional().default([]),
  autoGenerateMeals: z.boolean().optional().default(true),
});

export const createProfileProcedure = publicProcedure
  .input(createProfileSchema)
  .mutation(async ({ input }: { input: z.infer<typeof createProfileSchema> }) => {
    try {
      // In a real app, you would save this to a database
      // For now, we'll simulate saving and return the profile with an ID
      const profile = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...input,
        completedOnboarding: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('Created user profile:', profile);

      return {
        success: true,
        profile,
        message: 'Profile created successfully',
      };
    } catch (error) {
      console.error('Error creating profile:', error);
      throw new Error('Failed to create profile');
    }
  });