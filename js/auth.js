import { supabase } from "./supabaseClient.js";

// ------------------------------------------------------------
// Session / profil
// ------------------------------------------------------------
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getProfile() {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, company_id, role, nom, prenom, actif, companies(raison_sociale, nom_commercial, logo_url)")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) {
    console.error("Erreur chargement profil :", error);
    return null;
  }
  return data;
}

// Redirige vers login.html si pas connecté, ou vers onboarding.html
// si connecté mais sans profil (entreprise pas encore créée / invitation
// pas encore utilisée). Retourne le profil si tout est OK.
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  const profile = await getProfile();
  if (!profile) {
    window.location.href = "onboarding.html";
    return null;
  }
  if (!profile.actif) {
    await signOut();
    window.location.href = "login.html?desactive=1";
    return null;
  }
  return profile;
}

// ------------------------------------------------------------
// Connexion / inscription
// ------------------------------------------------------------
export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email, password) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  await supabase.auth.signOut();
}

// Appelle la fonction SQL qui crée l'entreprise + le profil admin.
export async function createCompanyAndOwner(raisonSociale, nom, prenom) {
  return supabase.rpc("create_company_and_owner", {
    p_raison_sociale: raisonSociale,
    p_nom: nom,
    p_prenom: prenom,
  });
}

// ------------------------------------------------------------
// Rôles autorisés à écrire/supprimer (doit rester cohérent avec
// les policies RLS définies dans sql/003_rls.sql)
// ------------------------------------------------------------
export const ROLE_LABELS = {
  admin: "Administrateur / Patron",
  conducteur: "Conducteur de travaux",
  chef_chantier: "Chef de chantier",
  administratif: "Administratif",
  comptable: "Comptable",
  salarie: "Salarié",
  sous_traitant: "Sous-traitant",
};

export function canWriteClients(role) {
  return ["admin", "conducteur", "administratif"].includes(role);
}

export function canDeleteClients(role) {
  return ["admin", "conducteur"].includes(role);
}
