"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { DailyTask, DailyTaskCategory, DAILY_TASK_CATEGORIES } from "@/lib/types";
import { nanoid } from "@/lib/nanoid";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const yest = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
  if (iso === todayStr) return "Today";
  if (iso === yest) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function CategoryBadge({ category }: { category: DailyTaskCategory }) {
  const cat = DAILY_TASK_CATEGORIES.find((c) => c.id === category)!;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cat.color}`}>
      {cat.icon} {cat.label}
    </span>
  );
}

interface Props {
  tasks: DailyTask[];
  onChange: (tasks: DailyTask[]) => void;
}

export function DailyTasks({ tasks, onChange }: Props) {
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<DailyTaskCategory>("editing");
  const [newVisible, setNewVisible] = useState(true);
  const [newDate, setNewDate] = useState(today());
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});

  function addTask() {
    if (!newTitle.trim()) return;
    const task: DailyTask = {
      id: nanoid(),
      date: newDate,
      title: newTitle.trim(),
      category: newCategory,
      completed: false,
      visibleToClient: newVisible,
    };
    onChange([...tasks, task]);
    setNewTitle("");
  }

  function toggleCompleted(id: string) {
    onChange(tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  function toggleVisible(id: string) {
    onChange(tasks.map((t) => t.id === id ? { ...t, visibleToClient: !t.visibleToClient } : t));
  }

  function deleteTask(id: string) {
    onChange(tasks.filter((t) => t.id !== id));
  }

  function toggleDay(date: string) {
    setCollapsedDays((prev) => ({ ...prev, [date]: !prev[date] }));
  }

  // Group by date, sorted newest first
  const grouped = tasks.reduce<Record<string, DailyTask[]>>((acc, t) => {
    (acc[t.date] = acc[t.date] || []).push(t);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const totalCompleted = tasks.filter((t) => t.completed).length;
  const clientVisible = tasks.filter((t) => t.visibleToClient && t.completed).length;

  return (
    <div className="rounded-2xl border p-6" style={{ background: "var(--card)", borderColor: "var(--card-border)" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="font-semibold text-base">Daily Production Tasks</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            {totalCompleted}/{tasks.length} completed · {clientVisible} visible to client
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border"
          style={{ borderColor: "var(--card-border)", color: "var(--muted)", background: "var(--background)" }}>
          <Eye size={12} />
          Client sees {clientVisible} update{clientVisible !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Overall progress bar */}
      {tasks.length > 0 && (
        <div className="mt-3 mb-5">
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--card-border)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, var(--accent), var(--success))" }}
              animate={{ width: `${tasks.length ? (totalCompleted / tasks.length) * 100 : 0}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Add task form */}
      <div className="rounded-xl border p-4 mb-5" style={{ background: "var(--background)", borderColor: "var(--card-border)" }}>
        <p className="text-xs font-medium mb-3" style={{ color: "var(--muted)" }}>Add Task</p>
        <div className="flex flex-col gap-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="What needs to be done today?"
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ background: "var(--card)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--card-border)")}
          />
          <div className="flex gap-2 flex-wrap">
            {/* Date picker */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs"
              style={{ background: "var(--card)", borderColor: "var(--card-border)", color: "var(--muted)" }}>
              <Calendar size={12} />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="outline-none bg-transparent text-xs"
                style={{ color: "var(--foreground)" }}
              />
            </div>

            {/* Category selector */}
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as DailyTaskCategory)}
              className="px-3 py-2 rounded-xl border text-xs outline-none flex-1"
              style={{ background: "var(--card)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
            >
              {DAILY_TASK_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>

            {/* Client visibility toggle */}
            <button
              onClick={() => setNewVisible(!newVisible)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all"
              style={
                newVisible
                  ? { background: "rgba(124,92,252,0.1)", borderColor: "var(--accent)", color: "var(--accent)" }
                  : { background: "var(--card)", borderColor: "var(--card-border)", color: "var(--muted)" }
              }
              title={newVisible ? "Visible to client" : "Hidden from client"}
            >
              {newVisible ? <Eye size={12} /> : <EyeOff size={12} />}
              {newVisible ? "Client sees this" : "Internal only"}
            </button>

            <button
              onClick={addTask}
              disabled={!newTitle.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Task list grouped by day */}
      {sortedDates.length === 0 ? (
        <div className="text-center py-8" style={{ color: "var(--muted)" }}>
          <p className="text-sm">No tasks yet. Add your first daily task above.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedDates.map((date) => {
            const dayTasks = grouped[date];
            const dayCompleted = dayTasks.filter((t) => t.completed).length;
            const isCollapsed = collapsedDays[date];
            const isToday = date === today();

            return (
              <div key={date}>
                {/* Day header */}
                <button
                  onClick={() => toggleDay(date)}
                  className="w-full flex items-center justify-between mb-2 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: isToday ? "var(--accent)" : "var(--foreground)" }}>
                      {formatDate(date)}
                    </span>
                    {isToday && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: "var(--accent)", color: "#fff" }}>
                        Today
                      </span>
                    )}
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {dayCompleted}/{dayTasks.length}
                    </span>
                    {/* Mini progress */}
                    <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: "var(--card-border)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${dayTasks.length ? (dayCompleted / dayTasks.length) * 100 : 0}%`,
                          background: dayCompleted === dayTasks.length ? "var(--success)" : "var(--accent)",
                        }}
                      />
                    </div>
                  </div>
                  {isCollapsed ? <ChevronDown size={14} style={{ color: "var(--muted)" }} /> : <ChevronUp size={14} style={{ color: "var(--muted)" }} />}
                </button>

                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-col gap-2 overflow-hidden"
                    >
                      {dayTasks.map((task) => (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-3 rounded-xl border group"
                          style={{
                            background: task.completed ? "rgba(34,211,160,0.04)" : "var(--background)",
                            borderColor: task.completed ? "rgba(34,211,160,0.15)" : "var(--card-border)",
                          }}
                        >
                          {/* Complete checkbox */}
                          <button
                            onClick={() => toggleCompleted(task.id)}
                            className="w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all"
                            style={
                              task.completed
                                ? { background: "var(--success)", borderColor: "var(--success)" }
                                : { borderColor: "var(--card-border)" }
                            }
                          >
                            {task.completed && <Check size={12} color="#fff" />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <span
                              className="text-sm block"
                              style={task.completed ? { color: "var(--muted)", textDecoration: "line-through" } : {}}
                            >
                              {task.title}
                            </span>
                            <div className="mt-1">
                              <CategoryBadge category={task.category} />
                            </div>
                          </div>

                          {/* Client visibility toggle */}
                          <button
                            onClick={() => toggleVisible(task.id)}
                            className="p-1.5 rounded-lg transition-all opacity-60 hover:opacity-100"
                            title={task.visibleToClient ? "Visible to client — click to hide" : "Hidden from client — click to show"}
                            style={task.visibleToClient ? { color: "var(--accent)" } : { color: "var(--muted)" }}
                          >
                            {task.visibleToClient ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10"
                          >
                            <Trash2 size={13} style={{ color: "var(--muted)" }} />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
