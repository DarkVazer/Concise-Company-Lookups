// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Environment variables in supabase.js:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase configuration error:');
  if (!supabaseUrl) console.error('NEXT_PUBLIC_SUPABASE_URL is not defined');
  if (!supabaseKey) console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
  throw new Error('Supabase URL and Anon Key are required.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);