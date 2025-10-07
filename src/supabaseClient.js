import { createClient } from '@supabase/supabase-js'

 const supabaseUrl = 'https://icdtdxtmpppztmwifuyb.supabase.co'
const supabaseKey = 'sb_publishable_ei_L3bsrJs4oGASDGoy9Sg_CdLezqja'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,        // Stores the session in localStorage
    autoRefreshToken: true,       // Token renews automatically
    detectSessionInUrl: true      // Reads token from email link
  }
})