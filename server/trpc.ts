import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface CreateContextOptions {
  headers: Headers;
}

export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    headers: opts.headers,
  };
};

export const createTRPCContext = (opts: { headers: Headers }) => {
  return createInnerTRPCContext({
    headers: opts.headers,
  });
};

export const createTRPCContextAppRouter = async (opts: {
  headers: Headers;
}) => {
  try {
    const supabase = await createSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Log authentication details for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('tRPC Context - Auth check:', {
        hasUser: !!user,
        userId: user?.id,
        authError: authError?.message,
        cookies: opts.headers.get('cookie')?.substring(0, 100) + '...'
      });
    }

    if (authError) {
      console.error('tRPC Context - Auth error:', authError);
    }

    return {
      headers: opts.headers,
      supabase, // This will never be null now
      user,
    };
  } catch (error) {
    console.error('tRPC Context - Failed to create context:', error);
    // Instead of returning null, throw an error to prevent the context from being created
    throw new Error('Failed to initialize database connection');
  }
};

export const createTRPCContextAppRouterFetch = (opts: { headers: Headers }) => {
  return createInnerTRPCContext({
    headers: opts.headers,
  });
};

const t = initTRPC.context<typeof createTRPCContextAppRouter>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    console.error('Protected procedure called without user context:', {
      hasSupabase: !!ctx.supabase,
      hasUser: !!ctx.user,
      headers: ctx.headers ? 'present' : 'missing'
    });
    throw new TRPCError({ 
      code: "UNAUTHORIZED",
      message: "User not authenticated. Please log in and try again."
    });
  }
  return next({
    ctx: {
      user: ctx.user,
      supabase: ctx.supabase,
      headers: ctx.headers,
    },
  });
});

async function createSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
      auth: {
        // Ensure we're using the same storage key as the client
        storageKey: 'sb-auth-token',
        // Enable debug in development
        debug: process.env.NODE_ENV === 'development',
      }
    }
  );
}
