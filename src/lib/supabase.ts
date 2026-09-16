import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sptifxljiqfnmymmglnm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdGlmeGxqaXFmbm15bW1nbG5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjYzNjUsImV4cCI6MjA4ODc0MjM2NX0.iBY_rI9yKfXT4rm7xNWFYijV4Gj_SVIQxetzxMcYJoo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);