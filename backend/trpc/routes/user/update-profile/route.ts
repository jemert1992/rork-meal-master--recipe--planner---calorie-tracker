import { z } from 'zod';
import { publicProcedure } from '../../create-context';

const updateProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  age: z.number().min(13).max(120).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  weight: z.number().min(30).max(500).optional(), // in kg
  height: z.number().min(100).max(250).optional(), // in cm
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very-active']).optional(),
  dietType: z.enum(['any', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'gluten-free', 'dairy-free', 'low-carb']).optional(),
  allergies: z.array(z.string()).optional(),
  calorieGoal: z.number().optional(),
  proteinGoal: z.number().optional(),
  carbsGoal: z.number().optional(),
  fatGoal: z.number().optional(),
  fitnessGoals: z.array(z.enum(['weight-loss', 'muscle-gain', 'general-health', 'heart-health', 'energy-boost', 'high-protein'])).optional(),
  autoGenerateMeals: z.boolean().optional(),
  completedOnboarding: z.boolean().optional(),
});

export const updateProfileProcedure = publicProcedure
  .input(updateProfileSchema)
  .mutation(async ({ input }: { input: z.infer<typeof updateProfileSchema> }) => {
    try {
      // In a real app, you would update this in a database
      // For now, we'll simulate updating and return the updated profile
      const updatedProfile = {
        ...input,
        updatedAt: new Date().toISOString(),
      };

      console.log('Updated user profile:', updatedProfile);

      return {
        success: true,
        profile: updatedProfile,
        message: 'Profile updated successfully',
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  });