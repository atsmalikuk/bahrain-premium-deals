import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vizsoysvluubygadevhq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpenNveXN2bHV1YnlnYWRldmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2MTcxMTYsImV4cCI6MjA1NTE5MzExNn0.MRJRL9gjQMOUGOvRsgJOjBJYxhmFVMnHBKkqOFaKCbQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
