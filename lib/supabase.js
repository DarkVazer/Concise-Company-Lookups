// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase configuration error:');
  if (!supabaseUrl) console.error('SUPABASE_URL is not defined');
  if (!supabaseKey) console.error('SUPABASE_ANON_KEY is not defined');
  throw new Error('Supabase URL and Anon Key are required.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);