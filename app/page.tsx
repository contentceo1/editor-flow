"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Video, DollarSign, Clock, CheckCircle, Users, Copy, ExternalLink, Trash2, UserPlus, X } from "lucide-react";
import { Project, TeamMember, STAGES, STAGE_ORDER, ProjectType } from "@/lib/types";
import { getProjects, createProject, updateProject, deleteProject, getTeam, addTeamMember, removeTeamMember } from "@/lib/store";
import Link from "next/link";

function stageIndex(stage: string) {
  return STAGE_ORDER.indexOf(stage as any);
}

function getStageInfo(stage: string) {
  return STAGES.find((s) => s.id === stage) || STAGES[0];
}

function StageBadge({ stage }: { stage: string }) {
  const info = getStageInfo(stage);
  const idx = stageIndex(stage);
  const colors = [
    "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    "bg-green-500/10 text-green-400 border-green-500/20",
    "bg-orange-500/10 text-orange-400 border-orange-500/20",
    "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[idx]}`}>
      <span>{info.icon}</span>
      {info.label}
    </span>
  );
}

function ProgressBar({ stage }: { stage: string }) {
  const idx = stageIndex(stage);
  const pct = Math.round(((idx + 1) / STAGES.length) * 100);
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--card-border)" }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: "linear-gradient(90deg, #7c5cfc, #22d3a0)" }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl p-5 border"
      style={{ background: "var(--card)", borderColor: "var(--card-border)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="text-2xl font-bold mb-0.5">{value}</div>
      <div className="text-sm font-medium mb-0.5" style={{ color: "var(--foreground)" }}>{label}</div>
      {sub && <div className="text-xs" style={{ color: "var(--muted)" }}>{sub}</div>}
    </motion.div>
  );
}

function NewProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (p: Project) => void }) {
  const [form, setForm] = useState({ clientName: "", clientEmail: "", projectTitle: "", invoiceAmount: "" });
  const [projectType, setProjectType] = useState<ProjectType>("one_time");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const p = createProject({
      clientName: form.clientName,
      clientEmail: form.clientEmail,
      projectTitle: form.projectTitle,
      invoiceAmount: parseFloat(form.invoiceAmount) || 0,
      projectType,
    });
    setTimeout(() => {
      onCreate(p);
      onClose();
    }, 400);
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md rounded-2xl p-6 border"
        style={{ background: "var(--card)", borderColor: "var(--card-border)" }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-1">New Project</h2>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Start a new client video project</p>
        {/* Project type toggle */}
        <div className="flex gap-2 mb-3">
          {(["one_time", "retainer"] as ProjectType[]).map((type) => (
            <button key={type} type="button" onClick={() => setProjectType(type)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all"
              style={projectType === type
                ? { background: "var(--accent)", color: "#fff", borderColor: "transparent" }
                : { background: "var(--background)", color: "var(--muted)", borderColor: "var(--card-border)" }}>
              {type === "one_time" ? "🎬 One-Time Project" : "🔄 Monthly Retainer"}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { key: "clientName", label: "Client Name", placeholder: "Alex Rivera", type: "text" },
            { key: "clientEmail", label: "Client Email", placeholder: "alex@example.com", type: "email" },
            { key: "projectTitle", label: "Project Title", placeholder: "Brand Launch Video", type: "text" },
            { key: "invoiceAmount", label: "Invoice Amount ($)", placeholder: "2500", type: "number" },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted)" }}>{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                style={{
                  background: "var(--background)",
                  borderColor: "var(--card-border)",
                  color: "var(--foreground)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--card-border)")}
              />
            </div>
          ))}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:opacity-80"
              style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [editorFilter, setEditorFilter] = useState<string>("all");

  useEffect(() => {
    setProjects(getProjects());
    setTeam(getTeam());
  }, []);

  function refresh() {
    setProjects(getProjects());
    setTeam(getTeam());
  }

  function handleAddMember() {
    if (!newMemberName.trim()) return;
    addTeamMember({ name: newMemberName.trim(), role: newMemberRole.trim() || "Editor" });
    setNewMemberName("");
    setNewMemberRole("");
    setShowAddMember(false);
    refresh();
  }

  function handleRemoveMember(id: string) {
    removeTeamMember(id);
    refresh();
  }

  function handleDelete(id: string) {
    if (confirm("Delete this project?")) {
      deleteProject(id);
      refresh();
    }
  }

  function copyClientLink(token: string, id: string) {
    const url = `${window.location.origin}/client/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filtered = projects
    .filter((p) => filter === "all" || p.stage === filter)
    .filter((p) => editorFilter === "all" || p.assignedEditorId === editorFilter);

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.stage !== "delivered").length,
    revenue: projects.filter((p) => p.invoicePaid).reduce((sum, p) => sum + p.invoiceAmount, 0),
    delivered: projects.filter((p) => p.stage === "delivered").length,
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: "var(--card-border)" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: "var(--accent-glow)" }}>
              <Video size={20} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">EditorFlow</h1>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Video Production Dashboard</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <Plus size={16} />
            New Project
          </motion.button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Total Projects" value={stats.total} sub="All time" color="bg-blue-500/10 text-blue-400" />
          <StatCard icon={Clock} label="Active" value={stats.active} sub="In progress" color="bg-orange-500/10 text-orange-400" />
          <StatCard icon={DollarSign} label="Revenue" value={`$${stats.revenue.toLocaleString()}`} sub="Paid invoices" color="bg-green-500/10 text-green-400" />
          <StatCard icon={CheckCircle} label="Delivered" value={stats.delivered} sub="Completed" color="bg-purple-500/10 text-purple-400" />
        </div>

        {/* Sidebar + content layout */}
        <div className="flex gap-6 items-start">

          {/* Sidebar filter */}
          <div className="w-56 flex-shrink-0 sticky top-6">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: "var(--muted)" }}>
              Filter by Stage
            </p>
            <div className="flex flex-col gap-1">
              {/* All */}
              <motion.button
                whileHover={{ x: 3 }}
                onClick={() => setFilter("all")}
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-left transition-all border"
                style={
                  filter === "all"
                    ? { background: "var(--accent)", color: "#fff", borderColor: "transparent" }
                    : { background: "var(--card)", color: "var(--foreground)", borderColor: "var(--card-border)" }
                }
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">📋</span>
                  <span className="text-sm font-semibold">All Projects</span>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={filter === "all" ? { background: "rgba(255,255,255,0.2)", color: "#fff" } : { background: "var(--background)", color: "var(--muted)" }}
                >
                  {projects.length}
                </span>
              </motion.button>

              {/* Divider */}
              <div className="my-1 mx-1 h-px" style={{ background: "var(--card-border)" }} />

              {STAGES.map((s) => {
                const count = projects.filter((p) => p.stage === s.id).length;
                const isActive = filter === s.id;
                return (
                  <motion.button
                    key={s.id}
                    whileHover={{ x: 3 }}
                    onClick={() => setFilter(s.id)}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-left transition-all border"
                    style={
                      isActive
                        ? { background: "var(--accent)", color: "#fff", borderColor: "transparent" }
                        : { background: "var(--card)", color: "var(--foreground)", borderColor: "var(--card-border)" }
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{s.icon}</span>
                      <span className="text-sm font-semibold">{s.label}</span>
                    </div>
                    {count > 0 && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={isActive ? { background: "rgba(255,255,255,0.2)", color: "#fff" } : { background: "var(--background)", color: "var(--muted)" }}
                      >
                        {count}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Team section */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Team</p>
                <button onClick={() => setShowAddMember(!showAddMember)}
                  className="p-1 rounded-lg hover:bg-black/5 transition-colors">
                  <UserPlus size={13} style={{ color: "var(--muted)" }} />
                </button>
              </div>

              {/* Add member form */}
              <AnimatePresence>
                {showAddMember && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-2"
                  >
                    <div className="rounded-xl border p-3 flex flex-col gap-2"
                      style={{ background: "var(--card)", borderColor: "var(--accent)" }}>
                      <input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="Name" className="w-full px-3 py-1.5 rounded-lg border text-xs outline-none"
                        style={{ background: "var(--background)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                        onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                        onBlur={(e) => (e.target.style.borderColor = "var(--card-border)")} />
                      <input value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)}
                        placeholder="Role (e.g. Editor)" className="w-full px-3 py-1.5 rounded-lg border text-xs outline-none"
                        style={{ background: "var(--background)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                        onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                        onBlur={(e) => (e.target.style.borderColor = "var(--card-border)")} />
                      <button onClick={handleAddMember}
                        className="w-full py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: "var(--accent)", color: "#fff" }}>
                        Add Member
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Filter: all editors */}
              <button
                onClick={() => setEditorFilter("all")}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-xs font-medium mb-1 transition-all"
                style={editorFilter === "all"
                  ? { background: "var(--accent)", color: "#fff", borderColor: "transparent" }
                  : { background: "var(--card)", color: "var(--foreground)", borderColor: "var(--card-border)" }}>
                <Users size={13} />
                All Editors
              </button>

              {team.map((member) => (
                <div key={member.id} className="group flex items-center gap-2 px-3 py-2 rounded-xl border mb-1 cursor-pointer transition-all"
                  onClick={() => setEditorFilter(editorFilter === member.id ? "all" : member.id)}
                  style={editorFilter === member.id
                    ? { background: "var(--accent)", color: "#fff", borderColor: "transparent" }
                    : { background: "var(--card)", borderColor: "var(--card-border)" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: member.color }}>
                    {member.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: editorFilter === member.id ? "#fff" : "var(--foreground)" }}>
                      {member.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: editorFilter === member.id ? "rgba(255,255,255,0.7)" : "var(--muted)" }}>
                      {member.role}
                    </p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleRemoveMember(member.id); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/10 transition-all flex-shrink-0">
                    <X size={11} style={{ color: editorFilter === member.id ? "#fff" : "var(--muted)" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Project grid */}
          <div className="flex-1 min-w-0">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
              style={{ color: "var(--muted)" }}
            >
              <Video size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No projects yet. Create your first one.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((project, i) => {
                const idx = stageIndex(project.stage);
                const pct = Math.round(((idx + 1) / STAGES.length) * 100);
                const completedTasks = project.tasks.filter((t) => t.completed).length;
                return (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -3 }}
                    className="rounded-2xl border p-5 group cursor-pointer relative overflow-hidden"
                    style={{ background: "var(--card)", borderColor: "var(--card-border)" }}
                  >
                    {/* Glow effect on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: "radial-gradient(circle at 50% 0%, var(--accent-glow), transparent 70%)" }}
                    />

                    <div className="relative">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm truncate">{project.projectTitle}</h3>
                            {project.projectType === "retainer" && (
                              <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium border"
                                style={{ background: "rgba(124,92,252,0.1)", color: "var(--accent)", borderColor: "rgba(124,92,252,0.2)" }}>
                                Retainer
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>{project.clientName}</p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => copyClientLink(project.token, project.id)}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
                            title="Copy client link"
                          >
                            {copiedId === project.id
                              ? <CheckCircle size={14} style={{ color: "var(--success)" }} />
                              : <Copy size={14} style={{ color: "var(--muted)" }} />}
                          </button>
                          <Link href={`/project/${project.id}`}>
                            <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10">
                              <ExternalLink size={14} style={{ color: "var(--muted)" }} />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10"
                          >
                            <Trash2 size={14} style={{ color: "var(--muted)" }} />
                          </button>
                        </div>
                      </div>

                      <StageBadge stage={project.stage} />

                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--muted)" }}>
                          <span>Progress</span>
                          <span style={{ color: "var(--accent)" }}>{pct}%</span>
                        </div>
                        <ProgressBar stage={project.stage} />
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs" style={{ color: "var(--muted)" }}>
                        <span
                          className="font-semibold"
                          style={{ color: project.invoicePaid ? "var(--success)" : "var(--warning)" }}
                        >
                          {project.invoicePaid ? "✓ Paid" : "⏳ Unpaid"} · ${project.invoiceAmount.toLocaleString()}
                        </span>
                        {(() => {
                          const editor = team.find((m) => m.id === project.assignedEditorId);
                          return editor ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                style={{ background: editor.color, fontSize: "9px" }}>
                                {editor.initials}
                              </div>
                              <span style={{ color: "var(--muted)" }}>{editor.name.split(" ")[0]}</span>
                            </div>
                          ) : (
                            <span style={{ color: "var(--muted)" }}>Unassigned</span>
                          );
                        })()}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showNew && (
          <NewProjectModal
            onClose={() => setShowNew(false)}
            onCreate={(p) => {
              setProjects(getProjects());
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
