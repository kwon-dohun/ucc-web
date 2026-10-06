export type MemberRole = "president" | "officer" | "member";
export type EventStatus = "draft" | "published" | "finished";
export type EventKind = "giveaway" | "signup" | "notice";

export type Epic = { total: number; recognized: number; language: number };

export type Profile = {
  id: string;
  name: string;
  student_no: string;
  department_id: string;
  grade: number;
  phone: string | null;
  interests: string[];
  wants: string[];
  skills: string[];
  epic: Epic;
  demo_role: string | null;
};

export type Org = {
  id: string;
  slug: string;
  kind: "council" | "club";
  department_id: string | null;
  name: string;
  term: number;
  intro: string | null;
  room: string | null;
  instagram: string | null;
  category: string | null;
  meets: string | null;
  fee: string | null;
  size_label: string | null;
  recruiting: string | null;
  rental_enabled: boolean;
};

export type Membership = {
  id: string;
  org_id: string;
  user_id: string;
  unit_id: string | null;
  title: string;
  role: MemberRole;
  term: number;
  active: boolean;
  sort: number;
};

export type Step = { title: string; body: string };

export type Opportunity = {
  id: string;
  source: string;
  source_kind: "school" | "department" | "epic" | "contest" | "scholarship" | "org";
  department_id: string | null;
  title: string;
  summary: string;
  starts_at: string | null;
  deadline: string | null;
  location: string | null;
  mode: "offline" | "online" | "mixed" | null;
  capacity: number | null;
  epic_points: number | null;
  epic_category: "recognized" | "contest" | "microdegree" | "internship" | "certificate" | null;
  eligible_grades: number[] | null;
  eligible_departments: string[] | null;
  eligibility_note: string | null;
  steps: Step[];
  warning: string | null;
  original_url: string | null;
  posted_at: string | null;
  tags: string[];
  admin_notice: boolean;
};

export type EventOption = {
  id: string;
  event_id: string;
  name: string;
  quantity: number;
  taken: number;
  walkup: number;
  sold_out_at: string | null;
  sort: number;
};

export type EventStats = {
  total?: number;
  applied?: number;
  picked?: number;
  no_show?: number;
  walkup?: number;
  sold_out_minutes?: number | null;
  unit?: string;
  note?: string;
  options?: { name: string; quantity: number; taken: number; sold_out_minutes: number | null }[];
};

export type UccEvent = {
  id: string;
  org_id: string;
  series_id: string | null;
  source_event_id: string | null;
  kind: EventKind;
  status: EventStatus;
  title: string;
  semester: string;
  term: number;
  greeting: string | null;
  location: string | null;
  opens_at: string | null;
  pickup_starts_at: string | null;
  pickup_ends_at: string | null;
  audience: "department" | "college" | "all";
  dues_only: boolean;
  per_person: number;
  show_remaining: boolean;
  leftovers_open: boolean;
  applied_count: number;
  stats: EventStats | null;
  created_by: string | null;
  published_at: string | null;
  finished_at: string | null;
};

export type Series = {
  id: string;
  org_id: string;
  name: string;
  kind: EventKind;
  usual_months: number[];
  sort: number;
};
