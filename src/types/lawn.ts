// ─────────────────────────────────────────────────────────────────────────────
// Grass Guru — Core Data Model
// Mirrors the schema defined in the Product Brief §6.
// All data is persisted as JSON via expo-file-system (one file per lawn).
// ─────────────────────────────────────────────────────────────────────────────

// ── Enumerations ─────────────────────────────────────────────────────────────

export type SunExposure = 'full_sun' | 'partial_shade' | 'full_shade';

export type IrrigationType = 'none' | 'manual' | 'sprinkler' | 'drip';

export type LawnCondition =
  | 'excellent'
  | 'decent'
  | 'struggling'
  | 'starting_fresh';

export type IssueStatus = 'active' | 'treated' | 'resolved' | 'monitoring';

export type IssueType =
  | 'fungus'
  | 'brown_patch'
  | 'grubs'
  | 'chinch_bugs'
  | 'bare_spots'
  | 'weeds'
  | 'drought_stress'
  | 'nutrient_deficiency'
  | 'thatch'
  | 'other';

export type GrassIdentificationMethod = 'photo' | 'manual_selection' | 'unknown';

// ── Location ─────────────────────────────────────────────────────────────────

export interface LawnLocation {
  zip: string;
  city: string;
  state: string;
  /** USDA Plant Hardiness Zone, e.g. "8a" */
  usda_zone: string;
  /** e.g. "humid subtropical", "semi-arid", "temperate continental" */
  climate_region: string;
  /** Latitude, used for sunrise/sunset and frost date calculations */
  latitude?: number;
  /** Longitude */
  longitude?: number;
}

// ── Grass Identification ──────────────────────────────────────────────────────

export interface GrassIdentification {
  /** e.g. "St. Augustine", "Bermuda", "Zoysia", "Tall Fescue", "Kentucky Bluegrass" */
  type: string;
  identified_via: GrassIdentificationMethod;
  /** 0–1 confidence score returned by the vision model */
  confidence: number;
  identification_date: string; // ISO date string
  /** Short description of this grass type's characteristics returned by AI */
  description?: string;
  /** Care summary returned by AI at identification time */
  care_summary?: string;
}

// ── Lawn Zones ────────────────────────────────────────────────────────────────

export interface LawnZone {
  zone_id: string;
  label: string; // e.g. "Front Yard", "Back Right Near Fence"
  sq_ft: number;
  sun_exposure: SunExposure;
  irrigation: IrrigationType;
  /** Optional grass type override if zone differs from the primary grass */
  grass_type?: string;
  notes?: string;
}

// ── Maintenance Plan ──────────────────────────────────────────────────────────

export interface MaintenancePlanTask {
  task_id: string;
  month: number; // 1–12
  title: string;
  description: string;
  category: 'mowing' | 'fertilizing' | 'watering' | 'aeration' | 'overseeding' | 'weed_control' | 'pest_control' | 'winterization' | 'other';
  /** Whether the user has marked this task done */
  completed: boolean;
  completed_at?: string;
  /** If true, a local push notification has been scheduled for this task */
  notification_scheduled: boolean;
  notification_id?: string;
}

export interface FertilizationScheduleEntry {
  month: number;
  npk_ratio: string; // e.g. "32-0-10"
  product_type: string; // e.g. "Slow-release nitrogen fertilizer"
  rate_per_1000_sqft: string; // e.g. "4 lbs per 1,000 sq ft"
  notes: string;
}

export interface MaintenancePlan {
  generated_at: string; // ISO datetime string
  /** Profile hash used to detect when regeneration is needed */
  profile_hash: string;
  annual_tasks: MaintenancePlanTask[];
  fertilization_schedule: FertilizationScheduleEntry[];
  watering_guidelines: string;
  seasonal_notes: {
    spring: string;
    summer: string;
    fall: string;
    winter: string;
  };
  weed_and_pest_watch: string;
  /** Raw markdown text of the full plan, used for display and export */
  raw_plan_markdown: string;
}

// ── Issue Log ─────────────────────────────────────────────────────────────────

export interface IssueLog {
  issue_id: string;
  type: IssueType;
  /** Zone label or zone_id where the issue was observed */
  zone: string;
  description: string;
  logged_at: string; // ISO datetime string
  /** Local file URI, e.g. "file:///data/user/0/.../photos/issue_i1.jpg" */
  photo_uri?: string;
  /** Full AI-generated treatment recommendation */
  ai_recommendation?: string;
  status: IssueStatus;
  resolved_at?: string;
  treatment_notes?: string;
}

// ── Notification Preferences ──────────────────────────────────────────────────

export interface NotificationPreferences {
  enabled: boolean;
  advance_days: number; // How many days before a task to send the reminder
  quiet_hours_start: number; // 0–23 hour
  quiet_hours_end: number; // 0–23 hour
}

// ── Root Lawn Profile ─────────────────────────────────────────────────────────

export interface LawnProfile {
  lawn_id: string;
  name: string; // User-given nickname, e.g. "Main Front Yard"
  created_at: string; // ISO date string
  updated_at: string; // ISO datetime string
  location: LawnLocation;
  grass: GrassIdentification;
  zones: LawnZone[];
  total_sq_ft: number;
  condition: LawnCondition;
  /** Any issues user called out during onboarding */
  onboarding_issues: string[];
  maintenance_plan?: MaintenancePlan;
  issue_log: IssueLog[];
  notification_preferences: NotificationPreferences;
  /** Pro tier feature flag (unlocked via in-app purchase) */
  is_pro: boolean;
}

// ── App State helpers ─────────────────────────────────────────────────────────

/** Lightweight index entry for the profile picker */
export interface LawnProfileSummary {
  lawn_id: string;
  name: string;
  grass_type: string;
  total_sq_ft: number;
  updated_at: string;
}

// ── Onboarding State ──────────────────────────────────────────────────────────

/**
 * In-progress data collected across onboarding steps before the first
 * LawnProfile is fully assembled and saved.
 */
export interface OnboardingDraft {
  name?: string;
  location?: Partial<LawnLocation>;
  grass?: Partial<GrassIdentification>;
  zones?: LawnZone[];
  total_sq_ft?: number;
  condition?: LawnCondition;
  onboarding_issues?: string[];
}

// ── Navigation param lists ────────────────────────────────────────────────────

export type OnboardingParamList = {
  Welcome: undefined;
  Location: { draft: OnboardingDraft };
  GrassType: { draft: OnboardingDraft };
  Measurement: { draft: OnboardingDraft };
  Condition: { draft: OnboardingDraft };
  OnboardingComplete: { draft: OnboardingDraft };
};

export type MainTabParamList = {
  Dashboard: { lawnId: string };
  MaintenancePlan: { lawnId: string };
  IssueLog: { lawnId: string };
  LawnProfile: { lawnId: string };
  Settings: undefined;
};

export type IssuesStackParamList = {
  IssueLog: { lawnId: string };
  LogNewIssue: { lawnId: string };
  IssueDetail: { lawnId: string; issueId: string };
};

export type RootParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Main: undefined;
};
