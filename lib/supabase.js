import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uitlajpnqruvvykrcyyg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpdGxhanBucXJ1dnZ5a3JjeXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0Mzc0MjYsImV4cCI6MjA2MDAxMzQyNn0.QoAi9GvLNWxh_-LBqLWwXpTt_SaLuKOGz2QfrPzYVdU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

