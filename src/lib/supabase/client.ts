import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lotvpxaxicbqssdszngk.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvdHZweGF4aWNicXNzZHN6bmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0ODAwNTAsImV4cCI6MjEwNzA1NjA1MH0.TrDJb-TXMtiUiQoX8A3xhv7DtxDmP2NZlnnE_cAT8aQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
