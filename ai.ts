import { StartupReport, SurveyAnswers, supabase } from './supabase';
import { generateFallbackReport } from './fallbackGenerator';
import { isGuest, saveToGuestVault, getGuestVault, deleteFromGuestVault, getGuestSettings } from './guest';

function describeInput(input: SurveyAnswers | string): string {
  if (typeof input === 'string') return input;
  const parts = [
    `Who: ${input.describes}`,
    `Budget: ${input.budget}`,
    `Business type: ${input.business_type}`,
    `Skills: ${input.skills.join(', ')}`,
    `Time: ${input.timeAvailable}`,
    `Goal: ${input.goal}`,
  ];
  return parts.join('. ');
}

export async function generateStartupReport(
  input: SurveyAnswers | string,
  country?: string
): Promise<StartupReport> {
  const prompt = describeInput(input);
  const userCountry = country ?? getGuestSettings().country;

  const functionUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-startup`;
  try {
    const res = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ prompt, country: userCountry }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.report) {
        return json.report as StartupReport;
      }
    }
  } catch {
    // fall through to local generator
  }

  return generateFallbackReport(input);
}

// ----------------- Vault persistence -----------------

export async function saveToVault(
  report: StartupReport,
  input: SurveyAnswers | string
) {
  const inputSummary = typeof input === 'string' ? input : JSON.stringify(input);

  // Guest mode: store locally
  if (isGuest()) {
    return saveToGuestVault(report, inputSummary);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('startup_vault')
    .insert({
      user_id: user.id,
      title: report.overview.title,
      input_summary: inputSummary,
      overview: report.overview,
      business: report.business,
      marketing: report.marketing,
      swot: report.swot,
      revenue: report.revenue,
      competitors: report.competitors,
      roadmap: report.roadmap,
      tracker: report.tracker,
      inspo: report.inspo,
      docs: report.docs,
      prompts: report.prompts,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listVault() {
  if (isGuest()) {
    return getGuestVault();
  }
  const { data, error } = await supabase
    .from('startup_vault')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateVaultTracker(vaultId: string, tracker: StartupReport['tracker']) {
  if (isGuest()) {
    // Update locally
    const vault = getGuestVault();
    const item = vault.find((v) => v.id === vaultId);
    if (item) {
      item.report.tracker = tracker;
      try { localStorage.setItem('cayim_guest_vault', JSON.stringify(vault)); } catch {}
    }
    return;
  }
  const { error } = await supabase
    .from('startup_vault')
    .update({ tracker })
    .eq('id', vaultId);
  if (error) throw error;
}

export async function deleteFromVault(vaultId: string) {
  if (isGuest()) {
    deleteFromGuestVault(vaultId);
    return;
  }
  const { error } = await supabase.from('startup_vault').delete().eq('id', vaultId);
  if (error) throw error;
}

// ----------------- Favorites -----------------

export async function toggleFavorite(vaultId: string, current: boolean) {
  if (isGuest()) {
    const vault = getGuestVault();
    const item = vault.find((v) => v.id === vaultId);
    if (item) {
      try { localStorage.setItem('cayim_guest_vault', JSON.stringify(vault)); } catch {}
    }
    return;
  }
  const { error } = await supabase
    .from('startup_vault')
    .update({ is_favorite: !current })
    .eq('id', vaultId);
  if (error) throw error;
}

// ----------------- Analytics -----------------

export async function trackEvent(eventName: string, eventData?: Record<string, any>) {
  if (isGuest()) return; // Don't track analytics for guests
  try {
    await supabase.from('analytics_events').insert({
      event_name: eventName,
      event_data: eventData ?? {},
    });
  } catch {
    // Silently fail — analytics are non-critical
  }
}

// ----------------- User Settings -----------------

export async function getUserSettings() {
  if (isGuest()) {
    return getGuestSettings();
  }
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function upsertUserSettings(settings: { country?: string; business_type?: string; theme?: string; notifications?: boolean }) {
  if (isGuest()) {
    const { saveGuestSettings } = await import('./guest');
    saveGuestSettings(settings);
    return;
  }
  const { error } = await supabase
    .from('user_settings')
    .upsert(settings, { onConflict: 'user_id' });
  if (error) throw error;
}
