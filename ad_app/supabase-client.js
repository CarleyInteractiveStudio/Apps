import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://hwtdzeqzzbjjvrfcyecz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3dGR6ZXF6emJqanZyZmN5ZWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MzAzMzcsImV4cCI6MjA3MzIwNjMzN30.UtvHQGudFKvFD_usqABVtpTYwkpcAjm4unHPuBWqZ_Y';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
