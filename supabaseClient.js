import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vizsoysvluubygadevhq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpenNveXN2bHV1YnlnYWRldmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzM0MjMsImV4cCI6MjA4Njc0OTQyM30.U9nM7UDYBZYPwUFWLHIhc9b9TwLIJTkqqyCwWY40zAQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
