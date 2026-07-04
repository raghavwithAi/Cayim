import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key: string) => {
        if (typeof localStorage !== 'undefined') {
          const v = localStorage.getItem(key);
          return Promise.resolve(v);
        }
        return Promise.resolve(null);
      },
      setItem: (key: string, value: string) => {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
        return Promise.resolve();
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Tell Supabase to refresh the token when the app returns to the foreground.
let appStateListener: ((state: AppStateStatus) => void) | null = null;
appStateListener = (state: AppStateStatus) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
};
AppState.addEventListener('change', appStateListener);

export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  bio: string | null;
};

export type UserSettings = {
  id: string;
  user_id: string;
  country: string;
  business_type: string | null;
  theme: string;
  notifications: boolean;
};

export type FavoriteRow = {
  id: string;
  user_id: string;
  vault_id: string;
  created_at: string;
};

export type SurveyAnswers = {
  describes: string;
  budget: string;
  business_type: string;
  skills: string[];
  timeAvailable: string;
  goal: string;
};

export type TrackerStep = {
  label: string;
  done: boolean;
};

export type InspoCompany = {
  name: string;
  logoUrl: string;
  description: string;
  businessModel: string;
  whyRelevant: string;
  keyLessons: string[];
};

export type DocsSection = {
  registrations: { name: string; description: string; cost: string; url?: string }[];
  licenses: { name: string; description: string; cost: string }[];
  taxes: { name: string; description: string; rate: string }[];
  compliance: { name: string; description: string }[];
  certifications: { name: string; description: string; optional: boolean }[];
};

export type PromptsData = {
  aiPrompts: { category: string; prompt: string }[];
  businessNames: { name: string; domainSuggestion: string; rationale: string }[];
};

export type StartupReport = {
  overview: { title: string; summary: string; tags: string[] };
  business: {
    idea: string;
    description: string;
    whyItFits: string;
    potentialEarnings: string;
    difficulty: string;
    startupCost: string;
    riskAnalysis: string;
  };
  marketing: {
    instagram: string;
    youtube: string;
    community: string;
    acquisition: string;
    growth: string;
  };
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  revenue: {
    sources: string[];
    pricingModel: string;
    profitPotential: string;
    monthlyEstimate: string;
  };
  competitors: {
    name: string;
    advantage: string;
    disadvantage: string;
    marketPosition: string;
  }[];
  roadmap: { week: string; steps: string[] }[];
  tracker: TrackerStep[];
  inspo: InspoCompany[];
  docs: DocsSection;
  prompts: PromptsData;
};

export type StartupVaultRow = {
  id: string;
  title: string;
  input_summary: string | null;
  overview: StartupReport['overview'] | null;
  business: StartupReport['business'] | null;
  marketing: StartupReport['marketing'] | null;
  swot: StartupReport['swot'] | null;
  revenue: StartupReport['revenue'] | null;
  competitors: StartupReport['competitors'] | null;
  roadmap: StartupReport['roadmap'] | null;
  tracker: StartupReport['tracker'] | null;
  is_favorite: boolean;
  created_at: string;
  inspo?: InspoCompany[] | null;
  docs?: DocsSection | null;
  prompts?: PromptsData | null;
  market_research?: any;
  target_audience?: any;
  competitor_analysis_ext?: any;
  usp?: any;
  revenue_model_ext?: any;
  roi_estimate?: any;
  startup_roadmap?: any;
  required_skills?: any;
  funding_options?: any;
  hackathons?: any;
  communities?: any;
  branding?: any;
  landing_page?: any;
  instagram_strategy?: any;
  viral_reels?: any;
};

export type Conversation = {
  id: string;
  user_id: string;
  context: Record<string, any>;
  context_complete: boolean;
  created_at: string;
  updated_at: string;
};

export type ConversationMessage = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export type AnalyticsEvent = {
  id: string;
  user_id: string;
  event_name: string;
  event_data: Record<string, any>;
  created_at: string;
};

export type GuestSession = {
  id: string;
  guest_uuid: string;
  migrated_user_id: string | null;
  data: Record<string, any>;
  created_at: string;
  migrated_at: string | null;
};

export type GeneratedIdea = {
  id: string;
  conversation_id: string;
  user_id: string;
  idea_index: number;
  idea_type: string;
  title: string;
  summary: string;
  market_research?: {
    market_size: string;
    growth_rate: string;
    trends: string[];
    key_insights: string;
  };
  target_audience?: {
    primary: string;
    demographics: string;
    pain_points: string[];
    where_to_find_them: string;
  };
  competitor_analysis?: Array<{
    name: string;
    strengths: string;
    weaknesses: string;
    market_position: string;
  }>;
  usp?: {
    unique_value: string;
    differentiation: string;
    value_proposition: string;
  };
  revenue_model?: {
    primary_stream: string;
    secondary_streams: string[];
    pricing_strategy: string;
    unit_economics: string;
  };
  roi_estimate?: {
    initial_investment: string;
    break_even_timeline: string;
    year_1_revenue_potential: string;
    year_3_revenue_potential: string;
  };
  startup_roadmap?: {
    phase_1: { timeline: string; steps: string[] };
    phase_2: { timeline: string; steps: string[] };
    phase_3: { timeline: string; steps: string[] };
    phase_4: { timeline: string; steps: string[] };
  };
  required_skills?: {
    must_have: string[];
    nice_to_have: string[];
    tools_needed: string[];
    learning_resources: string[];
  };
  funding_options?: {
    bootstrappable: boolean;
    funding_sources: string[];
    grants_available: string[];
    estimated_startup_cost: string;
  };
  hackathons?: Array<{
    name: string;
    relevance: string;
    timeline: string;
    url?: string;
  }>;
  communities?: Array<{
    name: string;
    platform: string;
    size: string;
    why_join: string;
  }>;
  branding?: {
    name_suggestions: string[];
    tone_of_voice: string;
    visual_identity: string;
    logo_prompt: string;
  };
  landing_page?: {
    headline: string;
    subheadline: string;
    hero_copy: string;
    features: string[];
    cta: string;
    design_prompt: string;
  };
  instagram_strategy?: {
    handle_suggestion: string;
    bio: string;
    content_pillars: string[];
    posting_frequency: string;
    hashtag_strategy: {
      primary: string[];
      niche: string[];
      community: string[];
    };
    engagement_tactics: string[];
  };
  viral_reels?: Array<{
    title: string;
    hook: string;
    body: string;
    cta: string;
    camera_setup: string;
    b_roll: string;
    captions: string;
    hashtags: string[];
    best_time_to_post: string;
  }>;
  full_report?: any;
  created_at: string;
};
