import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uruvljmtqhfezvsbdlwq.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_9BrR76nREg8zkMVwPYd5rQ_gCVA8Jkp'

export const supabase = createClient(SUPABASE_URL,SUPABASE_ANON_KEY)