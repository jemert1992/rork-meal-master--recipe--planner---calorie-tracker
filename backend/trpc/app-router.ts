import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { createProfileProcedure } from "./routes/user/create-profile/route";
import { updateProfileProcedure } from "./routes/user/update-profile/route";
import { getProfileProcedure } from "./routes/user/get-profile/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  user: createTRPCRouter({
    createProfile: createProfileProcedure,
    updateProfile: updateProfileProcedure,
    getProfile: getProfileProcedure,
  }),
});

export type AppRouter = typeof appRouter;