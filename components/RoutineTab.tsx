"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RoutineForm from "./RoutineForm";
import Clock from "./clock";

type RoutineTabProps = {
  initialRoutine?: {
    morning: string[];
    evening: string[];
    note: string;
  };
  onProgressChangeAction?: (stats: {
    morningCompleted: number;
    morningTotal: number;
    eveningCompleted: number;
    eveningTotal: number;
  }) => void;
};

export default function RoutineTab({ initialRoutine, onProgressChangeAction }: RoutineTabProps) {
  const [morningRoutine, setMorningRoutine] = useState<string[]>(initialRoutine?.morning || []);
  const [eveningRoutine, setEveningRoutine] = useState<string[]>(initialRoutine?.evening || []);
  const [motivationalNote, setMotivationalNote] = useState<string>(initialRoutine?.note || "");
  const [showForm, setShowForm] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  // Manual step inputs
  const [newMorningStep, setNewMorningStep] = useState<string>("");
  const [newEveningStep, setNewEveningStep] = useState<string>("");

  // Completion tracking for today
  const [morningCompleted, setMorningCompleted] = useState<Set<number>>(new Set());
  const [eveningCompleted, setEveningCompleted] = useState<Set<number>>(new Set());

  // Streak and completions
  const [streak, setStreak] = useState<number>(0);
  const [completions, setCompletions] = useState<Array<{ date: string; completed: boolean }>>([]);

  // Countdown to end of day
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [currentDayKey, setCurrentDayKey] = useState<string>(new Date().toISOString().split("T")[0]);

  const getEndOfDay = () => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const formatDuration = (ms: number) => {
    if (ms <= 0) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  // Show form if no routine yet; otherwise fetch stored template
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const res = await fetch("/api/dashboard/routines/template");
        if (res.ok) {
          const data = await res.json();
          const tpl = data.template;
          if (tpl) {
            setMorningRoutine((tpl.morning || []).map((s: any) => (typeof s === "string" ? s : s.step)).filter(Boolean));
            setEveningRoutine((tpl.evening || []).map((s: any) => (typeof s === "string" ? s : s.step)).filter(Boolean));
            setMotivationalNote(tpl.note || "");
            setShowForm(false);
          } else if (!initialRoutine) {
            setShowForm(true);
          }
        } else if (!initialRoutine) {
          setShowForm(true);
        }
      } catch {
        if (!initialRoutine) setShowForm(true);
      }
    };

    const loadCompletions = async () => {
      try {
        const res = await fetch("/api/dashboard/routines");
        if (res.ok) {
          const data = await res.json();
          const list = (data?.completions || []).map((c: any) => ({
            date: new Date(c.date).toISOString().split("T")[0],
            completed: !!c.completed,
          }));
          setCompletions(list);
        }
      } catch {
        // ignore
      }
    };

    loadTemplate();
    loadCompletions();
  }, [initialRoutine]);

  // Compute streak based on completions
  const computedStreak = useMemo(() => {
    // Count consecutive days up to today where completed == true
    const datesSet = new Set<string>(completions.filter(c => c.completed).map(c => c.date));
    let count = 0;
    const d = new Date();
    for (;;) {
      const key = d.toISOString().split("T")[0];
      if (datesSet.has(key)) {
        count += 1;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [completions]);

  useEffect(() => {
    setStreak(computedStreak);
  }, [computedStreak]);

  // Notify parent of progress changes
  useEffect(() => {
    onProgressChangeAction?.({
      morningCompleted: morningCompleted.size,
      morningTotal: morningRoutine.length,
      eveningCompleted: eveningCompleted.size,
      eveningTotal: eveningRoutine.length,
    });
  }, [onProgressChangeAction, morningCompleted, eveningCompleted, morningRoutine.length, eveningRoutine.length]);

  // Tick countdown and rollover at midnight
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const now = new Date();
      const end = getEndOfDay();
      const diff = end.getTime() - now.getTime();
      if (!cancelled) setTimeLeft(formatDuration(diff));

      const dayKey = now.toISOString().split("T")[0];
      if (dayKey !== currentDayKey || diff <= 0) {
        // Day changed or passed midnight: refresh completions to update streak immediately
        setCurrentDayKey(dayKey);
        try {
          const res = await fetch("/api/dashboard/routines");
          if (res.ok) {
            const data = await res.json();
            const list = (data?.completions || []).map((c: any) => ({
              date: new Date(c.date).toISOString().split("T")[0],
              completed: !!c.completed,
            }));
            if (!cancelled) setCompletions(list);
          }
        } catch {
          // ignore
        }
        // Also reset local checkboxes for the new day
        if (!cancelled) {
          setMorningCompleted(new Set());
          setEveningCompleted(new Set());
        }
      }
    };

    // Initial tick and interval
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [currentDayKey]);

  const generateRoutine = async (formData: any) => {
    setLoading(true);
    try {
      const res = await fetch("/api/skincare-routine", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" },
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        console.error("Failed to parse JSON response");
        data = { error: "Invalid JSON response from server" };
      }

      if (!res.ok) {
        alert(data.error || "Failed to generate routine");
        return;
      }

      setMorningRoutine(data.morningRoutine || []);
      setEveningRoutine(data.eveningRoutine || []);
      setMotivationalNote(data.motivationalNote || "");
      setShowForm(false);

      // Save generated routine as template
      try {
        await fetch("/api/dashboard/routines/template", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            morning: data.morningRoutine || [],
            evening: data.eveningRoutine || [],
            note: data.motivationalNote || "",
          }),
        });
      } catch {
        // ignore template save failure
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Network error while generating routine");
    } finally {
      setLoading(false);
    }
  };

  const toggleMorningCompleted = (index: number) => {
    setMorningCompleted(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const toggleEveningCompleted = (index: number) => {
    setEveningCompleted(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const persistTodayPartial = async () => {
    // Save current checked steps for today with completed=false
    const todayStr = new Date().toISOString().split("T")[0];
    try {
      await fetch("/api/dashboard/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: todayStr,
          morningSteps: Array.from(morningCompleted).map(i => morningRoutine[i]).filter(Boolean),
          eveningSteps: Array.from(eveningCompleted).map(i => eveningRoutine[i]).filter(Boolean),
          score: 0,
          completed: false,
        }),
      });
    } catch {
      // ignore transient failures; user sees state after refresh from DB
    }
  };

  // Persist whenever the checked sets change (captures the latest state)
  useEffect(() => {
    // Avoid persisting before routines load
    if (!morningRoutine.length && !eveningRoutine.length) return;
    persistTodayPartial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [morningCompleted, eveningCompleted]);

  const saveTemplate = async () => {
    try {
      await fetch("/api/dashboard/routines/template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          morning: morningRoutine,
          evening: eveningRoutine,
          note: motivationalNote,
        }),
      });
      alert("Routine template saved");
    } catch (e) {
      alert("Failed to save template");
    }
  };

  const completeRoutineForStreak = async () => {
    const totalSteps = morningRoutine.length + eveningRoutine.length;
    const completedSteps = morningCompleted.size + eveningCompleted.size;
    const score = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    // Use YYYY-MM-DD format to anchor date at midnight
    const todayStr = new Date().toISOString().split("T")[0];
    try {
      const res = await fetch("/api/dashboard/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: todayStr,
          morningSteps: Array.from(morningCompleted).map(i => morningRoutine[i]).filter(Boolean),
          eveningSteps: Array.from(eveningCompleted).map(i => eveningRoutine[i]).filter(Boolean),
          score,
          completed: true,
        }),
      });
      if (res.ok) {
        alert("Routine completed! Keep your streak alive! 🌟");
        // Refresh completions
        try {
          const r = await fetch("/api/dashboard/routines");
          if (r.ok) {
            const data = await r.json();
            const list = (data?.completions || []).map((c: any) => ({
              date: new Date(c.date).toISOString().split("T")[0],
              completed: !!c.completed,
            }));
            setCompletions(list);
          }
        } catch {}
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to save completion");
      }
    } catch (e) {
      alert("Failed to save completion");
    }
  };

  const addMorning = () => {
    if (!newMorningStep.trim()) return;
    setMorningRoutine(prev => [...prev, newMorningStep.trim()]);
    setNewMorningStep("");
  };

  const addEvening = () => {
    if (!newEveningStep.trim()) return;
    setEveningRoutine(prev => [...prev, newEveningStep.trim()]);
    setNewEveningStep("");
  };

  const removeMorning = (index: number) => {
    setMorningRoutine(prev => prev.filter((_, i) => i !== index));
    setMorningCompleted(prev => {
      const next = new Set<number>();
      Array.from(prev).forEach(i => { if (i !== index) next.add(i > index ? i - 1 : i); });
      return next;
    });
  };

  // When loading, bring back today's partial checks from DB
  useEffect(() => {
    const restoreToday = async () => {
      try {
        const res = await fetch("/api/dashboard/routines");
        if (!res.ok) return;
        const data = await res.json();
        const todayKey = new Date().toISOString().split("T")[0];
        const comps = data?.completions || [];
        const todayComp = comps.find((c: any) => {
          const d = new Date(c.date)
          const key = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0]
          return key === todayKey
        });
        if (todayComp) {
          const normalize = (x: string) => x.replace(/\s+/g, " ").trim().toLowerCase();
          if (Array.isArray(todayComp.morningSteps)) {
            const saved = todayComp.morningSteps.map((s: string) => normalize(String(s)));
            const set = new Set<number>();
            morningRoutine.forEach((step, i) => {
              if (saved.includes(normalize(String(step)))) set.add(i);
            });
            setMorningCompleted(set);
          }
          if (Array.isArray(todayComp.eveningSteps)) {
            const saved = todayComp.eveningSteps.map((s: string) => normalize(String(s)));
            const set = new Set<number>();
            eveningRoutine.forEach((step, i) => {
              if (saved.includes(normalize(String(step)))) set.add(i);
            });
            setEveningCompleted(set);
          }
        }
      } catch {
        // ignore
      }
    };
    // Only attempt after routines are loaded
    if (morningRoutine.length || eveningRoutine.length) {
      restoreToday();
    }
  }, [morningRoutine, eveningRoutine]);

  const removeEvening = (index: number) => {
    setEveningRoutine(prev => prev.filter((_, i) => i !== index));
    setEveningCompleted(prev => {
      const next = new Set<number>();
      Array.from(prev).forEach(i => { if (i !== index) next.add(i > index ? i - 1 : i); });
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {showForm ? (
        <RoutineForm onSubmitAction={generateRoutine} loading={loading} />
      ) : (
        <>
<div className="flex flex-col items-center space-y-4">
  {/* Clock + Streak */}
  <div className="flex justify-between items-center w-full px-4 py-2">
  <Clock />
  <div className="flex items-center gap-3">
    <span className="text-sm text-gray-600 font-medium">⏳ Reset in: {timeLeft || "--:--:--"}</span>
    <span className="text-sm text-gray-600 font-medium">🔥 Streak: {streak} days</span>
  </div>
</div>

        </div>


          <div className="grid lg:grid-cols-2 gap-6">
            {/* Morning Routine */}
            <Card className="border-green-100">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800">🌞 Morning Routine</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3">
                  <Input placeholder="Add morning step" value={newMorningStep} onChange={(e) => setNewMorningStep(e.target.value)} />
                  <Button variant="outline" onClick={addMorning}>Add</Button>
                </div>
                <ul className="space-y-2">
                  {morningRoutine.length ? (
                    morningRoutine.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={morningCompleted.has(index)}
                          onChange={() => toggleMorningCompleted(index)}
                        />
                        <span className="flex-1">{step}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeMorning(index)}>Remove</Button>
                      </li>
                    ))
                  ) : (
                    <p className="text-gray-500">No morning routine generated yet.</p>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Evening Routine */}
            <Card className="border-purple-100">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800">🌙 Evening Routine</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3">
                  <Input placeholder="Add evening step" value={newEveningStep} onChange={(e) => setNewEveningStep(e.target.value)} />
                  <Button variant="outline" onClick={addEvening}>Add</Button>
                </div>
                <ul className="space-y-2">
                  {eveningRoutine.length ? (
                    eveningRoutine.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={eveningCompleted.has(index)}
                          onChange={() => toggleEveningCompleted(index)}
                        />
                        <span className="flex-1">{step}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeEvening(index)}>Remove</Button>
                      </li>
                    ))
                  ) : (
                    <p className="text-gray-500">No evening routine generated yet.</p>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {motivationalNote && (
            <Card className="col-span-2 border-yellow-100 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">💡 Motivational Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{motivationalNote}</p>
              </CardContent>
            </Card>
          )}

          {/* Complete Routine for Streak */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={completeRoutineForStreak}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              ✅ Complete Today's Routine
            </button>
            <button
              onClick={saveTemplate}
              className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
            >
              💾 Save Template
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              🔄 Regenerate Routine
            </button>
          </div>

        </>
      )}
    </div>
  );
}
