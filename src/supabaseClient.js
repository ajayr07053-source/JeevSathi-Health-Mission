import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yubmzqayxmhgyetgmykf.supabase.co";

const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1Ym16cWF5eG1oZ3lldGdteWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NzUyNzksImV4cCI6MjEwMzM1MTI3OX0.TZZgw2AIjI_S5euIN81LABvSS86I83JM2KSZJeqVIUI";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);