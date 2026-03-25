   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = 'https://guyinhzczbyugveodsyq.supabase.co';
   const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1eWluaHpjemJ5dWd2ZW9kc3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODgzNzksImV4cCI6MjA4OTk2NDM3OX0.x-s131eRwCIHoHpntL8IAo_eoPtk8GYGq5x-f50n4RE';

   export const supabase = createClient(supabaseUrl, supabaseAnonKey);