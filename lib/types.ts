export type Stage =
  | "discovery"
  | "invoice_sent"
  | "invoice_paid"
  | "production"
  | "post_production"
  | "delivered";

export const STAGES: { id: Stage; label: string; icon: string; description: string }[] = [
  { id: "discovery", label: "Discovery Call", icon: "🎯", description: "Initial consultation completed" },
  { id: "invoice_sent", label: "Invoice Sent", icon: "📄", description: "Invoice delivered to client" },
  { id: "invoice_paid", label: "Invoice Paid", icon: "💰", description: "Payment received and confirmed" },
  { id: "production", label: "Production Day", icon: "🎬", description: "Footage being captured on set" },
  { id: "post_production", label: "Post-Production", icon: "✂️", description: "Editing and color grading underway" },
  { id: "delivered", label: "Delivered", icon: "🚀", description: "Final content delivered to client" },
];

export const STAGE_ORDER: Stage[] = [
  "discovery",
  "invoice_sent",
  "invoice_paid",
  "production",
  "post_production",
  "delivered",
];

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignee?: string;
  dueDate?: string;
}

export type DailyTaskCategory =
  | "editing"
  | "color"
  | "audio"
  | "review"
  | "export"
  | "other";

export const DAILY_TASK_CATEGORIES: { id: DailyTaskCategory; label: string; icon: string; color: string }[] = [
  { id: "editing", label: "Editing", icon: "✂️", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { id: "color", label: "Color Grading", icon: "🎨", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  { id: "audio", label: "Audio / Music", icon: "🎵", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { id: "review", label: "Client Review", icon: "👁️", color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
  { id: "export", label: "Export / Deliver", icon: "📦", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  { id: "other", label: "Other", icon: "📌", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
];

export interface DailyTask {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  title: string;
  category: DailyTaskCategory;
  completed: boolean;
  visibleToClient: boolean;
}

export interface RevisionNote {
  id: string;
  timecode: string; // e.g. "1:32"
  note: string;
  createdAt: string;
  resolved: boolean;
}

export type RevisionStatus = "awaiting_feedback" | "feedback_received" | "resolved";

export interface RevisionRound {
  id: string;
  roundNumber: number;
  label: string;
  dropboxUrl: string;
  createdAt: string;
  notes: RevisionNote[];
  status: RevisionStatus;
  approvedAt?: string; // set when client approves this round
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string; // tailwind bg color class
}

export type ProductionStage =
  | "scheduled"
  | "production_day"
  | "editing"
  | "revisions"
  | "delivered";

export const PRODUCTION_STAGES: { id: ProductionStage; label: string; icon: string }[] = [
  { id: "scheduled", label: "Scheduled", icon: "🗓" },
  { id: "production_day", label: "Production Day", icon: "🎬" },
  { id: "editing", label: "Editing", icon: "✂️" },
  { id: "revisions", label: "Revisions", icon: "🔄" },
  { id: "delivered", label: "Delivered", icon: "✅" },
];

export const PRODUCTION_STAGE_ORDER: ProductionStage[] = [
  "scheduled",
  "production_day",
  "editing",
  "revisions",
  "delivered",
];

export interface Production {
  id: string;
  number: number;
  scheduledDate: string;
  stage: ProductionStage;
  revisionRounds: RevisionRound[];
  notes?: string;
}

export interface RetainerPeriod {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  invoiceAmount: number;
  invoicePaid: boolean;
  productions: Production[];
}

export type ProjectType = "one_time" | "retainer";

export interface Project {
  projectType?: ProjectType;
  retainerPeriods?: RetainerPeriod[];
  assignedEditorId?: string;
  deliveryDate?: string; // ISO date string YYYY-MM-DD
  id: string;
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  stage: Stage;
  token: string;
  invoiceAmount: number;
  invoicePaid: boolean;
  tasks: Task[];
  dailyTasks: DailyTask[];
  revisionRounds: RevisionRound[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}
