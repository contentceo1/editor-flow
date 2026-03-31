"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, ChevronRight, X } from "lucide-react";
import {
  Project, RetainerPeriod, Production, ProductionStage,
  PRODUCTION_STAGES, PRODUCTION_STAGE_ORDER, RevisionRound,
} from "@/lib/types";
import { nanoid } from "@/lib/nanoid";
import { RevisionRounds } from "./RevisionRounds";

interface Props {
  project: Project;
  onChange: (updates: Partial<Project>) => void;
}

export function RetainerAdmin({ project, onChange }: Props) {
  const periods = project.retainerPeriods || [];
  const [activePeriodId, setActivePeriodId] = useState<string>(
    periods.length > 0 ? periods[periods.length - 1].id : ""
  );
  const [showAddPeriod, setShowAddPeriod] = useState(false);
  const [periodForm, setPeriodForm] = useState({ label: "", startDate: "", endDate: "", invoiceAmount: "" });
  const [showAddProd, setShowAddProd] = useState(false);
  const [prodDate, setProdDate] = useState("");

  const activePeriod = periods.find((p) => p.id === activePeriodId) ?? periods[periods.length - 1];

  function updatePeriods(updated: RetainerPeriod[]) {
    onChange({ retainerPeriods: updated });
  }

  function addPeriod() {
    if (!periodForm.label.trim() || !periodForm.startDate || !periodForm.endDate) return;
    const period: RetainerPeriod = {
      id: nanoid(),
      label: periodForm.label.trim(),
      startDate: periodForm.startDate,
      endDate: periodForm.endDate,
      invoiceAmount: parseFloat(periodForm.invoiceAmount) || 0,
      invoicePaid: false,
      productions: [],
    };
    const updated = [...periods, period];
    updatePeriods(updated);
    setActivePeriodId(period.id);
    setShowAddPeriod(false);
    setPeriodForm({ label: "", startDate: "", endDate: "", invoiceAmount: "" });
  }

  function toggleInvoice() {
    if (!activePeriod) return;
    updatePeriods(periods.map((p) =>
      p.id !== activePeriod.id ? p : { ...p, invoicePaid: !p.invoicePaid }
    ));
  }

  function addProduction() {
    if (!activePeriod || !prodDate) return;
    const prod: Production = {
      id: nanoid(),
      number: activePeriod.productions.length + 1,
      scheduledDate: prodDate,
      stage: "scheduled",
      revisionRounds: [],
    };
    updatePeriods(periods.map((p) =>
      p.id !== activePeriod.id ? p : { ...p, productions: [...p.productions, prod] }
    ));
    setProdDate("");
    setShowAddProd(false);
  }

  function setProductionStage(prodId: string, stage: ProductionStage) {
    if (!activePeriod) return;
    updatePeriods(periods.map((p) =>
      p.id !== activePeriod.id ? p : {
        ...p,
        productions: p.productions.map((prod) =>
          prod.id !== prodId ? prod : { ...prod, stage }
        ),
      }
    ));
  }

  function updateProductionRevisions(prodId: string, revisionRounds: RevisionRound[]) {
    if (!activePeriod) return;
    updatePeriods(periods.map((p) =>
      p.id !== activePeriod.id ? p : {
        ...p,
        productions: p.productions.map((prod) =>
          prod.id !== prodId ? prod : { ...prod, revisionRounds }
        ),
      }
    ));
  }

  function deleteProduction(prodId: string) {
    if (!activePeriod) return;
    updatePeriods(periods.map((p) =>
      p.id !== activePeriod.id ? p : {
        ...p,
        productions: p.productions
          .filter((prod) => prod.id !== prodId)
          .map((prod, i) => ({ ...prod, number: i + 1 })),
      }
    ));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Billing Periods */}
      <div className="rounded-2xl border p-6" style={{ background: "var(--card)", borderColor: "var(--card-border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Billing Periods</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Manage monthly or recurring billing cycles</p>
          </div>
          <button
            onClick={() => setShowAddPeriod(!showAddPeriod)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <Plus size={13} /> New Period
          </button>
        </div>

        <AnimatePresence>
          {showAddPeriod && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="rounded-xl border p-4" style={{ background: "var(--background)", borderColor: "var(--accent)" }}>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="col-span-2">
                    <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>Period Label</label>
                    <input
                      value={periodForm.label}
                      onChange={(e) => setPeriodForm({ ...periodForm, label: e.target.value })}
                      placeholder="e.g. April 2026"
                      className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                      style={{ background: "var(--card)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--card-border)")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>Start Date</label>
                    <input type="date" value={periodForm.startDate}
                      onChange={(e) => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                      style={{ background: "var(--card)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>End Date</label>
                    <input type="date" value={periodForm.endDate}
                      onChange={(e) => setPeriodForm({ ...periodForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                      style={{ background: "var(--card)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>Invoice Amount ($)</label>
                    <input type="number" value={periodForm.invoiceAmount}
                      onChange={(e) => setPeriodForm({ ...periodForm, invoiceAmount: e.target.value })}
                      placeholder="1500"
                      className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                      style={{ background: "var(--card)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddPeriod(false)}
                    className="flex-1 py-2 rounded-xl text-xs font-medium border"
                    style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}>
                    Cancel
                  </button>
                  <button onClick={addPeriod}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: "var(--accent)", color: "#fff" }}>
                    Add Period
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {periods.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>
            No billing periods yet. Add your first one.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePeriodId(p.id)}
                className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
                style={activePeriodId === p.id
                  ? { background: "var(--accent)", color: "#fff", borderColor: "transparent" }
                  : { background: "var(--background)", color: "var(--foreground)", borderColor: "var(--card-border)" }}
              >
                {p.label}
                {!p.invoicePaid && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#fde68a", color: "#92400e" }}>
                    Unpaid
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Productions for active period */}
      {activePeriod && (
        <div className="rounded-2xl border p-6" style={{ background: "var(--card)", borderColor: "var(--card-border)" }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="font-semibold">{activePeriod.label}</h2>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                {activePeriod.productions.length} production{activePeriod.productions.length !== 1 ? "s" : ""} ·{" "}
                <span style={{ color: activePeriod.invoicePaid ? "var(--success)" : "var(--warning)" }}>
                  {activePeriod.invoicePaid ? "✓ Invoice paid" : "⏳ Invoice unpaid"} · ${activePeriod.invoiceAmount.toLocaleString()}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleInvoice}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                style={activePeriod.invoicePaid
                  ? { borderColor: "var(--card-border)", color: "var(--muted)" }
                  : { background: "var(--success)", color: "#fff", borderColor: "transparent" }}
              >
                {activePeriod.invoicePaid ? "Mark Unpaid" : "Mark Paid"}
              </button>
              <button
                onClick={() => setShowAddProd(!showAddProd)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                <Plus size={13} /> Add
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showAddProd && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="rounded-xl border p-4 flex gap-3 items-end"
                  style={{ background: "var(--background)", borderColor: "var(--accent)" }}>
                  <div className="flex-1">
                    <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>Production Date</label>
                    <input type="date" value={prodDate}
                      onChange={(e) => setProdDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                      style={{ background: "var(--card)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                    />
                  </div>
                  <button onClick={() => setShowAddProd(false)}
                    className="py-2 px-4 rounded-xl text-xs font-medium border"
                    style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}>
                    Cancel
                  </button>
                  <button onClick={addProduction} disabled={!prodDate}
                    className="py-2 px-4 rounded-xl text-xs font-semibold disabled:opacity-40"
                    style={{ background: "var(--accent)", color: "#fff" }}>
                    Add
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {activePeriod.productions.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>
              No productions yet. Add one above.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {activePeriod.productions.map((prod) => {
                const prodStageIdx = PRODUCTION_STAGE_ORDER.indexOf(prod.stage);
                const showRevisions = prod.stage === "revisions" || prod.revisionRounds.length > 0;
                return (
                  <div key={prod.id} className="rounded-xl border overflow-hidden"
                    style={{ borderColor: "var(--card-border)" }}>
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{ background: "var(--accent-glow)", color: "var(--accent)" }}>
                        #{prod.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">Production #{prod.number}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          {new Date(prod.scheduledDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <button onClick={() => deleteProduction(prod.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                        <X size={13} style={{ color: "var(--muted)" }} />
                      </button>
                    </div>

                    {/* Stage pipeline */}
                    <div className="px-4 pb-4 flex items-center gap-1 overflow-x-auto">
                      {PRODUCTION_STAGES.map((s, idx) => {
                        const isPast = idx < prodStageIdx;
                        const isActive = s.id === prod.stage;
                        return (
                          <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => setProductionStage(prod.id, s.id)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all"
                              style={isActive
                                ? { background: "var(--accent)", color: "#fff", borderColor: "transparent" }
                                : isPast
                                ? { background: "rgba(34,211,160,0.08)", color: "var(--success)", borderColor: "rgba(34,211,160,0.2)" }
                                : { background: "var(--background)", color: "var(--muted)", borderColor: "var(--card-border)" }}
                            >
                              {isPast ? <Check size={10} /> : <span style={{ fontSize: "11px" }}>{s.icon}</span>}
                              {s.label}
                            </button>
                            {idx < PRODUCTION_STAGES.length - 1 && (
                              <ChevronRight size={10} style={{ color: "var(--muted)", flexShrink: 0 }} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {showRevisions && (
                      <div className="px-4 pb-5 border-t pt-4" style={{ borderColor: "var(--card-border)" }}>
                        <RevisionRounds
                          rounds={prod.revisionRounds}
                          onChange={(revisionRounds) => updateProductionRevisions(prod.id, revisionRounds)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
