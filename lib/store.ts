import { Project, Stage, TeamMember, ProjectType, RetainerPeriod, Production } from "./types";
import { nanoid } from "./nanoid";

const TEAM_KEY = "editorflow_team";

export function getTeam(): TeamMember[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEAM_KEY);
    return raw ? JSON.parse(raw) : getDefaultTeam();
  } catch {
    return getDefaultTeam();
  }
}

export function saveTeam(team: TeamMember[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TEAM_KEY, JSON.stringify(team));
}

export function addTeamMember(data: { name: string; role: string }): TeamMember {
  const colors = ["#7c5cfc","#22d3a0","#f59e0b","#3b82f6","#ec4899","#ef4444","#10b981"];
  const team = getTeam();
  const member: TeamMember = {
    id: nanoid(),
    name: data.name,
    role: data.role,
    initials: data.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
    color: colors[team.length % colors.length],
  };
  saveTeam([...team, member]);
  return member;
}

export function removeTeamMember(id: string): void {
  saveTeam(getTeam().filter((m) => m.id !== id));
}

function getDefaultTeam(): TeamMember[] {
  const team: TeamMember[] = [
    { id: "tm-1", name: "Roger Rojas", role: "Owner / Director", initials: "RR", color: "#7c5cfc" },
    { id: "tm-2", name: "Alex Chen", role: "Lead Editor", initials: "AC", color: "#22d3a0" },
    { id: "tm-3", name: "Mia Torres", role: "Color Grading", initials: "MT", color: "#f59e0b" },
  ];
  saveTeam(team);
  return team;
}

const STORAGE_KEY = "editorflow_projects";

function generateToken(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export function getProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getSeedProjects();
    const projects: Project[] = JSON.parse(raw);
    // Backfill dailyTasks for projects created before this field existed
    return projects.map((p) => ({
      ...p,
      projectType: p.projectType ?? "one_time",
      dailyTasks: p.dailyTasks ?? [],
      revisionRounds: p.revisionRounds ?? [],
      retainerPeriods: p.retainerPeriods ?? [],
    }));
  } catch {
    return getSeedProjects();
  }
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getProject(id: string): Project | undefined {
  return getProjects().find((p) => p.id === id);
}

export function getProjectByToken(token: string): Project | undefined {
  return getProjects().find((p) => p.token === token);
}

export function createProject(data: {
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  invoiceAmount: number;
  projectType?: ProjectType;
}): Project {
  const project: Project = {
    id: nanoid(),
    token: generateToken(),
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
  const projects = getProjects();
  projects.unshift(project);
  saveProjects(projects);
  return project;
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...updates, updatedAt: new Date().toISOString() };
  saveProjects(projects);
  return projects[idx];
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id);
  saveProjects(projects);
}

function getSeedProjects(): Project[] {
  const seeds: Project[] = [
    {
      id: "seed-1",
      clientName: "Alex Rivera",
      clientEmail: "alex@example.com",
      projectTitle: "Brand Launch Video",
      stage: "post_production",
      token: "demo-token-1",
      invoiceAmount: 2500,
      invoicePaid: true,
      notes: "Color grading in progress. Client requested warmer tones.",
      tasks: [
        { id: "t1", title: "Export raw footage", completed: true, assignee: "Roger" },
        { id: "t2", title: "First cut edit", completed: true, assignee: "Roger" },
        { id: "t3", title: "Color grading", completed: false, assignee: "Roger" },
        { id: "t4", title: "Sound design", completed: false, assignee: "Roger" },
      ],
      revisionRounds: [
        {
          id: "rr1",
          roundNumber: 1,
          label: "First Cut",
          dropboxUrl: "https://www.dropbox.com/s/example/brand-launch-v1.mp4",
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          status: "feedback_received",
          notes: [
            { id: "rn1", timecode: "0:12", note: "The opening feels too slow — can we cut to the product reveal sooner?", createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), resolved: true },
            { id: "rn2", timecode: "1:05", note: "Love this shot! Can we hold on it a bit longer?", createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), resolved: true },
            { id: "rn3", timecode: "2:30", note: "The music feels too intense here, can we lower it?", createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), resolved: false },
          ],
        },
        {
          id: "rr2",
          roundNumber: 2,
          label: "Color Pass",
          dropboxUrl: "https://www.dropbox.com/s/example/brand-launch-v2.mp4",
          createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
          status: "awaiting_feedback",
          notes: [],
        },
      ],
      dailyTasks: [
        { id: "dt1", date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10), title: "Synced and organized all raw footage", category: "editing", completed: true, visibleToClient: true },
        { id: "dt2", date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10), title: "Rough cut assembly (Act 1 & 2)", category: "editing", completed: true, visibleToClient: true },
        { id: "dt3", date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10), title: "Pacing review and cut refinements", category: "editing", completed: true, visibleToClient: true },
        { id: "dt4", date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10), title: "Music selection and sync", category: "audio", completed: true, visibleToClient: true },
        { id: "dt5", date: new Date().toISOString().slice(0, 10), title: "Color grading — warm tone pass", category: "color", completed: false, visibleToClient: true },
        { id: "dt6", date: new Date().toISOString().slice(0, 10), title: "Sound mix and level balancing", category: "audio", completed: false, visibleToClient: false },
      ],
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "seed-2",
      clientName: "Jordan Kim",
      clientEmail: "jordan@example.com",
      projectTitle: "Wedding Highlight Reel",
      stage: "invoice_paid",
      token: "demo-token-2",
      invoiceAmount: 1800,
      invoicePaid: true,
      notes: "Production day scheduled for next weekend.",
      tasks: [
        { id: "t5", title: "Scout venue", completed: true, assignee: "Roger" },
        { id: "t6", title: "Prep equipment", completed: false, assignee: "Roger" },
      ],
      revisionRounds: [],
      dailyTasks: [],
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "seed-4",
      clientName: "Sarah Park",
      clientEmail: "sarah@example.com",
      projectTitle: "Monthly Social Content",
      projectType: "retainer" as ProjectType,
      stage: "post_production",
      token: "demo-retainer-1",
      invoiceAmount: 0,
      invoicePaid: false,
      notes: "Monthly retainer — 4 productions per billing period.",
      tasks: [],
      revisionRounds: [],
      dailyTasks: [],
      retainerPeriods: [
        {
          id: "rp1",
          label: "February 2026",
          startDate: "2026-02-01",
          endDate: "2026-02-28",
          invoiceAmount: 1500,
          invoicePaid: true,
          productions: [
            { id: "p1-1", number: 1, scheduledDate: "2026-02-05", stage: "delivered", revisionRounds: [] },
            { id: "p1-2", number: 2, scheduledDate: "2026-02-12", stage: "delivered", revisionRounds: [] },
            { id: "p1-3", number: 3, scheduledDate: "2026-02-19", stage: "delivered", revisionRounds: [] },
            { id: "p1-4", number: 4, scheduledDate: "2026-02-26", stage: "delivered", revisionRounds: [] },
          ],
        },
        {
          id: "rp2",
          label: "March 2026",
          startDate: "2026-03-01",
          endDate: "2026-03-31",
          invoiceAmount: 1500,
          invoicePaid: false,
          productions: [
            { id: "p2-1", number: 1, scheduledDate: "2026-03-05", stage: "delivered", revisionRounds: [] },
            {
              id: "p2-2",
              number: 2,
              scheduledDate: "2026-03-12",
              stage: "revisions",
              revisionRounds: [
                {
                  id: "prr1",
                  roundNumber: 1,
                  label: "First Cut",
                  dropboxUrl: "https://www.dropbox.com/s/example/social-march-2.mp4",
                  createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
                  status: "feedback_received",
                  notes: [
                    { id: "prn1", timecode: "0:08", note: "Can we add captions here?", createdAt: new Date(Date.now() - 86400000).toISOString(), resolved: false },
                    { id: "prn2", timecode: "0:24", note: "Love this transition!", createdAt: new Date(Date.now() - 86400000).toISOString(), resolved: true },
                  ],
                },
              ],
            },
            { id: "p2-3", number: 3, scheduledDate: "2026-03-19", stage: "editing", revisionRounds: [] },
            { id: "p2-4", number: 4, scheduledDate: "2026-03-26", stage: "scheduled", revisionRounds: [] },
          ],
        },
      ] as RetainerPeriod[],
      createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "seed-3",
      clientName: "Morgan Lee",
      clientEmail: "morgan@example.com",
      projectTitle: "Product Ad Campaign",
      stage: "invoice_sent",
      token: "demo-token-3",
      invoiceAmount: 3200,
      invoicePaid: false,
      notes: "Waiting on payment before scheduling production.",
      tasks: [],
      revisionRounds: [],
      dailyTasks: [],
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  saveProjects(seeds);
  return seeds;
}
