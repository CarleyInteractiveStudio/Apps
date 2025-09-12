import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Define the structure of the incoming request data
interface WatchTimePayload {
  watchTime: number; // Expecting time in seconds
}

// Define the reward constants
const REWARD_THRESHOLD_SECONDS = 60; // Grant points every 60 seconds of watch time
const POINTS_PER_REWARD = 10;      // Grant 10 points per reward

Deno.serve(async (req) => {
  // This is needed if you're calling the function from a browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Create a Supabase client with the user's authentication token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 2. Get the user from the token
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // 3. Get the watch time from the request body
    const { watchTime }: WatchTimePayload = await req.json();
    if (!watchTime || typeof watchTime !== 'number' || watchTime <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid watchTime provided' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 4. Create an admin client to bypass RLS for secure updates
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 5. Fetch the user's current profile from the database
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('points, watch_time_progress')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // 6. Calculate new progress and any rewards earned
    const newProgress = profile.watch_time_progress + watchTime;
    const rewardsEarned = Math.floor(newProgress / REWARD_THRESHOLD_SECONDS);

    let pointsToAdd = 0;
    let finalProgress = newProgress;

    if (rewardsEarned > 0) {
      pointsToAdd = rewardsEarned * POINTS_PER_REWARD;
      finalProgress = newProgress % REWARD_THRESHOLD_SECONDS;
    }

    // 7. Update the user's profile in the database
    const { data: updatedProfile, error: updateError } = await adminClient
      .from('profiles')
      .update({
        points: profile.points + pointsToAdd,
        watch_time_progress: finalProgress,
      })
      .eq('id', user.id)
      .select('points, watch_time_progress')
      .single();

    if (updateError) throw updateError;

    // 8. Return the updated data to the client
    return new Response(JSON.stringify(updatedProfile), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
