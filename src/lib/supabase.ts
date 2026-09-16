import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Variables d'environnement Supabase manquantes pour le temps réel.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');