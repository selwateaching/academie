import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

if (SUPABASE_URL.includes("VOTRE-PROJET")) {
  console.warn(
    "Configuration Supabase manquante : copie js/config.example.js vers js/config.js et renseigne tes clés."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
