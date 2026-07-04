import { supabase, StartupReport } from './supabase';

// Guest mode management — stores vault items and settings in localStorage
// so guests can use all core features without signing up. On signup/signin,
// one-click migration moves all guest data to their Supabase account.

const GUEST_KEY = 'cayim_guest_uuid';
const GUEST_VAULT_KEY = 'cayim_guest_vault';
const GUEST_SETTINGS_KEY = 'cayim_guest_settings';

export function getGuestId(): string {
  let id = '';
  try {
    id = localStorage.getItem(GUEST_KEY) ?? '';
  } catch {
    // SSR or restricted environment
  }
  if (!id) {
    id = 'guest-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    try { localStorage.setItem(GUEST_KEY, id); } catch {}
  }
  return id;
}

export function isGuest(): boolean {
  try {
    return localStorage.getItem(GUEST_KEY) !== null;
  } catch {
    return false;
  }
}

export function clearGuest() {
  try {
    localStorage.removeItem(GUEST_KEY);
    localStorage.removeItem(GUEST_VAULT_KEY);
    localStorage.removeItem(GUEST_SETTINGS_KEY);
  } catch {}
}

export type GuestVaultItem = {
  id: string;
  title: string;
  input_summary: string;
  report: StartupReport;
  created_at: string;
};

export function getGuestVault(): GuestVaultItem[] {
  try {
    const raw = localStorage.getItem(GUEST_VAULT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToGuestVault(report: StartupReport, inputSummary: string): GuestVaultItem {
  const item: GuestVaultItem = {
    id: 'guest-vault-' + Date.now(),
    title: report.overview.title,
    input_summary: inputSummary,
    report,
    created_at: new Date().toISOString(),
  };
  const vault = getGuestVault();
  vault.unshift(item);
  try { localStorage.setItem(GUEST_VAULT_KEY, JSON.stringify(vault)); } catch {}
  return item;
}

export function deleteFromGuestVault(id: string) {
  const vault = getGuestVault().filter((v) => v.id !== id);
  try { localStorage.setItem(GUEST_VAULT_KEY, JSON.stringify(vault)); } catch {}
}

export type GuestSettings = {
  country: string;
  business_type: string;
  theme: string;
  notifications: boolean;
};

export function getGuestSettings(): GuestSettings {
  try {
    const raw = localStorage.getItem(GUEST_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { country: 'India', business_type: '', theme: 'system', notifications: true };
}

export function saveGuestSettings(settings: Partial<GuestSettings>) {
  const current = getGuestSettings();
  const updated = { ...current, ...settings };
  try { localStorage.setItem(GUEST_SETTINGS_KEY, JSON.stringify(updated)); } catch {}
}

// One-click migration: moves all guest vault items to Supabase, then clears guest state.
export async function migrateGuestData(userId: string): Promise<number> {
  const guestVault = getGuestVault();
  const guestSettings = getGuestSettings();
  let migrated = 0;

  // Migrate vault items
  for (const item of guestVault) {
    try {
      const r = item.report;
      const { error } = await supabase.from('startup_vault').insert({
        user_id: userId,
        title: r.overview.title,
        input_summary: item.input_summary,
        overview: r.overview,
        business: r.business,
        marketing: r.marketing,
        swot: r.swot,
        revenue: r.revenue,
        competitors: r.competitors,
        roadmap: r.roadmap,
        tracker: r.tracker,
        inspo: r.inspo,
        docs: r.docs,
        prompts: r.prompts,
      });
      if (!error) migrated++;
    } catch {
      // skip individual failures
    }
  }

  // Migrate settings
  if (guestSettings.country || guestSettings.business_type) {
    try {
      await supabase.from('user_settings').upsert({
        user_id: userId,
        country: guestSettings.country,
        business_type: guestSettings.business_type,
        theme: guestSettings.theme,
        notifications: guestSettings.notifications,
      }, { onConflict: 'user_id' });
    } catch {}
  }

  // Update profile country if set
  if (guestSettings.country) {
    try {
      await supabase.from('profiles').update({ country: guestSettings.country }).eq('id', userId);
    } catch {}
  }

  clearGuest();
  return migrated;
}
