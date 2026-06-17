export type Cohort = "weekday" | "weekend";
export type Role = "admin" | "member";
export type ScheduleStatus = "planned" | "done" | "canceled";

export const COHORT_LABEL: Record<Cohort, string> = {
  weekday: "주중반",
  weekend: "주말반",
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "운영자",
  member: "조원",
};

export const SCHEDULE_STATUS_LABEL: Record<ScheduleStatus, string> = {
  planned: "예정",
  done: "완료",
  canceled: "취소",
};

export interface Profile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  cohort: Cohort | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  cohort: Cohort;
  leader_id: string | null;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  profile_id: string;
}

export interface Property {
  id: string;
  name: string;
  auction_no: string | null;
  address: string | null;
  property_type: string | null;
  region: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Schedule {
  id: string;
  title: string;
  visit_date: string;
  cohort: Cohort;
  group_id: string | null;
  region: string | null;
  plan: string | null;
  status: ScheduleStatus;
  created_by: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  title: string;
  visit_date: string | null;
  region: string | null;
  schedule_id: string | null;
  property_id: string | null;
  author_id: string;
  summary: string | null;
  location_review: string | null;
  price_review: string | null;
  pros: string | null;
  cons: string | null;
  conclusion: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface ReportFile {
  id: string;
  report_id: string;
  storage_path: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  report_id: string | null;
  property_id: string | null;
  author_id: string;
  rating: number | null;
  content: string;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  category: string | null;
  author_id: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface Memo {
  id: string;
  owner_id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}
