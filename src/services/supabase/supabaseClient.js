import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrxlrpqyhcwkwpaqlaro.supabase.co';
const supabaseAnonKey = 'sb_publishable_VkL5PG5MHi5HbYbX8xHxJw_8EXIe64B';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
