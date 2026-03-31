import { Project, Stage, TeamMember, ProjectType } from "./types";
import { nanoid } from "./nanoid";
import { supabase } from "./supabase";

// ── Row converters ───────────────────────────────────────────────────────────

function fromRow(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    token: row.token as string,
    clientName: row.client_name as string,
    clientEmail: row.client_email as string,
    projectTitle: row.project_title as string,
    stage: row.stage as Stage,
    projectType: (row.project_type ?? "one_time") as ProjectType,
    invoiceAmount: row.invoice_amount as number,
    invoicePaid: row.invoice_paid as boolean,
    assignedEditorId: (row.assigned_editor_id as string) ?? undefined,
    deliveryDate: (row.delivery_date as string) ?? undefined,
    notes: (row.notes as string) ?? "",
    thumbnail: (row.thumbnail as string) ?? undefined,
    tasks: (row.tasks as Project["tasks"]) ?? [],
    dailyTasks: (row.daily_tasks as Project["dailyTasks"]) ?? [],
    revisionRounds: (row.revision_rounds as Project["revisionRounds"]) ?? [],
    retainerPeriods: (row.retainer_periods as Project["retainerPeriods"]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toRow(p: Project): Record<string, unknown> {
  return {
    id: p.id,
    token: p.token,
    client_name: p.clientName,
    client_email: p.clientEmail,
    project_title: p.projectTitle,
    stage: p.stage,
    project_type: p.projectType ?? "one_time",
    invoice_amount: p.invoiceAmount,
    invoice_paid: p.invoicePaid,
    assigned_editor_id: p.assignedEditorId ?? null,
    delivery_date: p.deliveryDate ?? null,
    notes: p.notes ?? "",
    thumbnail: p.thumbnail ?? null,
    tasks: p.tasks ?? [],
    daily_tasks: p.dailyTasks ?? [],
    revision_rounds: p.revisionRounds ?? [],
    retainer_periods: p.retainerPeriods ?? [],
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

function partialToRow(updates: Partial<Project>): Record<string, unknown> {
  const map: [keyof Project, string][] = [
    ["clientName", "client_name"],
    ["clientEmail", "client_email"],
    ["projectTitle", "project_title"],
    ["stage", "stage"],
    ["projectType", "project_type"],
    ["invoiceAmount", "invoice_amount"],
    ["invoicePaid", "invoice_paid"],
    ["assignedEditorId", "assigned_editor_id"],
    ["deliveryDate", "delivery_date"],
    ["notes", "notes"],
    ["thumbnail", "thumbnail"],
    ["tasks", "tasks"],
    ["dailyTasks", "daily_tasks"],
    ["revisionRounds", "revision_rounds"],
    ["retainerPeriods", "retainer_periods"],
  ];
  const row: Record<string, unknown> = {};
  for (const [key, col] of map) {
    if (key in updates) {
      row[col] = updates[key] ?? null;
    }
  }
  return row;
}

// ── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(fromRow);
}

export async function saveProjects(projects: Project[]): Promise<void> {
  if (projects.length === 0) return;
  await supabase.from("projects").upsert(projects.map(toRow));
}

export async function getProject(id: string): Promise<Project | undefined> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return undefined;
  return fromRow(data);
}

export async function getProjectByToken(token: string): Promise<Project | undefined> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("token", token)
    .single();
  if (error || !data) return undefined;
  return fromRow(data);
}

export async function createProject(data: {
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  invoiceAmount: number;
  projectType?: ProjectType;
}): Promise<Project> {
  const project: Project = {
    id: nanoid(),
    token: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
    stage: "discovery",
    projectType: data.projectType ?? "one_time",
    invoicePaid: false,
    tasks: [],
    dailyTasks: [],
    revisionRounds: [],
    retainerPeriods: [],
    notes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  };
  await supabase.from("projects").insert(toRow(project));
  return project;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  const row = { ...partialToRow(updates), updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from("projects")
    .update(row)
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return null;
  return fromRow(data);
}

export async function deleteProject(id: string): Promise<void> {
  await supabase.from("projects").delete().eq("id", id);
}

// ── Team ─────────────────────────────────────────────────────────────────────

export async function getTeam(): Promise<TeamMember[]> {
  const { data, error } = await supabase.from("team_members").select("*");
  if (error || !data || data.length === 0) return seedDefaultTeam();
  return data as TeamMember[];
}

export async function saveTeam(team: TeamMember[]): Promise<void> {
  await supabase.from("team_members").delete().neq("id", "");
  if (team.length > 0) {
    await supabase.from("team_members").insert(team);
  }
}

export async function addTeamMember(data: { name: string; role: string }): Promise<TeamMember> {
  const colors = ["#7c5cfc", "#22d3a0", "#f59e0b", "#3b82f6", "#ec4899", "#ef4444", "#10b981"];
  const team = await getTeam();
  const member: TeamMember = {
    id: nanoid(),
    name: data.name,
    role: data.role,
    initials: data.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
    color: colors[team.length % colors.length],
  };
  await supabase.from("team_members").insert(member);
  return member;
}

export async function removeTeamMember(id: string): Promise<void> {
  await supabase.from("team_members").delete().eq("id", id);
}

async function seedDefaultTeam(): Promise<TeamMember[]> {
  const team: TeamMember[] = [
    { id: "tm-1", name: "Roger Rojas", role: "Owner / Director", initials: "RR", color: "#7c5cfc" },
    { id: "tm-2", name: "Alex Chen", role: "Lead Editor", initials: "AC", color: "#22d3a0" },
    { id: "tm-3", name: "Mia Torres", role: "Color Grading", initials: "MT", color: "#f59e0b" },
  ];
  await supabase.from("team_members").upsert(team);
  return team;
}
