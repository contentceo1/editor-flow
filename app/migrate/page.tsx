"use client";

import { useState } from "react";
import { saveProjects, saveTeam } from "@/lib/store";
import { Project, TeamMember } from "@/lib/types";

export default function MigratePage() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [log, setLog] = useState<string[]>([]);

  function readLocalStorage() {
    try {
      const rawProjects = localStorage.getItem("editorflow_projects");
      const rawTeam = localStorage.getItem("editorflow_team");
      const projects: Project[] = rawProjects ? JSON.parse(rawProjects) : [];
      const team: TeamMember[] = rawTeam ? JSON.parse(rawTeam) : [];
      return { projects, team };
    } catch {
      return { projects: [], team: [] };
    }
  }

  async function runMigration() {
    setStatus("running");
    setLog([]);

    try {
      const { projects, team } = readLocalStorage();

      if (projects.length === 0 && team.length === 0) {
        setLog(["Nothing found in localStorage — nothing to migrate."]);
        setStatus("done");
        return;
      }

      const lines: string[] = [];

      if (projects.length > 0) {
        lines.push(`Found ${projects.length} project(s) in localStorage — uploading...`);
        setLog([...lines]);
        await saveProjects(projects);
        lines.push(`✓ ${projects.length} project(s) saved to Supabase.`);
        setLog([...lines]);
      }

      if (team.length > 0) {
        lines.push(`Found ${team.length} team member(s) in localStorage — uploading...`);
        setLog([...lines]);
        await saveTeam(team);
        lines.push(`✓ ${team.length} team member(s) saved to Supabase.`);
        setLog([...lines]);
      }

      lines.push("Migration complete! You can now delete your localStorage data if you like.");
      lines.push("(Open DevTools → Application → Local Storage → delete editorflow_projects and editorflow_team)");
      setLog([...lines]);
      setStatus("done");
    } catch (err) {
      setLog((prev) => [...prev, `Error: ${err instanceof Error ? err.message : String(err)}`]);
      setStatus("error");
    }
  }

  const { projects, team } = typeof window !== "undefined" ? readLocalStorage() : { projects: [], team: [] };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", color: "#f0f0f5", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: 540, width: "100%" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>localStorage → Supabase Migration</h1>
        <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "2rem" }}>
          One-time migration of your existing data into the live Supabase database.
        </p>

        {/* What was found */}
        <div style={{ background: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: 12, padding: "1rem", marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", marginBottom: "0.75rem" }}>Found in localStorage</p>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#7c5cfc" }}>{projects.length}</div>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>projects</div>
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#22d3a0" }}>{team.length}</div>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>team members</div>
            </div>
          </div>
        </div>

        {/* Run button */}
        {status === "idle" && (
          <button
            onClick={runMigration}
            style={{ width: "100%", padding: "0.75rem", borderRadius: 12, background: "#7c5cfc", color: "#fff", border: "none", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" }}
          >
            Run Migration
          </button>
        )}

        {status === "running" && (
          <div style={{ textAlign: "center", color: "#9ca3af", fontSize: "0.875rem" }}>Running...</div>
        )}

        {/* Log output */}
        {log.length > 0 && (
          <div style={{ marginTop: "1.5rem", background: "#111118", border: "1px solid #2a2a3a", borderRadius: 12, padding: "1rem" }}>
            {log.map((line, i) => (
              <p key={i} style={{ fontSize: "0.8rem", color: line.startsWith("✓") ? "#22d3a0" : line.startsWith("Error") ? "#ef4444" : "#d1d5db", margin: "0.25rem 0" }}>
                {line}
              </p>
            ))}
          </div>
        )}

        {status === "done" && (
          <a href="/" style={{ display: "block", marginTop: "1rem", textAlign: "center", padding: "0.75rem", borderRadius: 12, background: "#22d3a0", color: "#000", fontWeight: 700, textDecoration: "none", fontSize: "0.9rem" }}>
            Go to Dashboard →
          </a>
        )}
      </div>
    </div>
  );
}
