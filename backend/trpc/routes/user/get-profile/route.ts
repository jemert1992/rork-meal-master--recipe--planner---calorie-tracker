import { z } from 'zod';
import { publicProcedure } from '../../create-context';

const getProfileSchema = z.object({
  id: z.string(),
});

export const getProfileProcedure = publicProcedure
  .input(getProfileSchema)
  .query(async ({ input }: { input: z.infer<typeof getProfileSchema> }) => {
    try {
      // In a real app, you would fetch this from a database
      // For now, we'll simulate fetching and return a mock profile
      console.log('Fetching profile for ID:', input.id);

      // This would normally come from your database
      const profile = {
        id: input.id,
        name: 'User',
        completedOnboarding: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        profile,
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new Error('Failed to fetch profile');
    }
  });