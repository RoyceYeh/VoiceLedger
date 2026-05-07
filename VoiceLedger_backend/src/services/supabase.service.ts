import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// service key 繞過 RLS，僅在後端使用
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey);
