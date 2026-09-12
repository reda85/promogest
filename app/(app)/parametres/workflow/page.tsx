"use client";
import { useState } from "react";
import { STATUTS_UNITE, WORKFLOW_TRANSITIONS } from "@/lib/constants";
import { getWorkflow, saveWorkflow, resetWorkflow, type WorkflowTransitions } from "@/lib/workflow-store";
import { Button } from "@/components/ui/button";
import { ArrowRight, RotateCcw, Check, GitBranch, Info } from "lucide-react";

const ALL_STATUTS = Object.keys(STATUTS_UNITE) as Array<keyof typeof STATUTS_UNITE>;

export default function WorkflowDesignerPage() {
  const [transitions, setTransitions] = useState<WorkflowTransitions>(getWorkflow);
  const [savedFlash, setSavedFlash] = useState(false);

  const flash = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const toggleTransition = (from: string, to: string) => {
    const current = transitions[from] || [];
    const updated: WorkflowTransitions = {
      ...transitions,
      [from]: current.includes(to)
        ? current.filter((s) => s !== to)
        : [...current, to],
    };
    setTransitions(updated);
    saveWorkflow(updated);
    flash();
  };

  const handleReset = () => {
    resetWorkflow();
    setTransitions({ ...WORKFLOW_TRANSITIONS });
    flash();
  };

  // Detect if the current workflow differs from the default
  const isModified = JSON.stringify(transitions) !== JSON.stringify(WORKFLOW_TRANSITIONS);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="h-5 w-5 text-[#c9773f]" />
            <h1 className="text-2xl font-bold">
              Designer de Workflow
            </h1>
            {isModified && (
              <span className="rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
                Modifié
              </span>
            )}
          </div>
          <p className="text-sm text-[#888888]">
            Cliquez sur un statut pour activer ou désactiver la transition. Les changements sont sauvegardés automatiquement.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {savedFlash && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <Check className="h-3.5 w-3.5" />
              Sauvegardé
            </span>
          )}
          {isModified && (
            <Button variant="ghost" onClick={handleReset} className="flex items-center gap-1.5 text-sm">
              <RotateCcw className="h-3.5 w-3.5" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
        <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
        <p>
          Les transitions définissent quels statuts sont accessibles depuis le pipeline (glisser-déposer) et depuis le bouton
          {" "}<strong>Passer à →</strong> sur les fiches de réservation.
        </p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {ALL_STATUTS.map((statut) => {
          const cfg = STATUTS_UNITE[statut];
          const currentTargets = transitions[statut] || [];
          const possibleTargets = ALL_STATUTS.filter((s) => s !== statut);

          return (
            <div
              key={statut}
              className="rounded-2xl border border-[#e8e6e1] bg-white p-4 flex flex-col gap-3"
            >
              {/* Status header */}
              <div
                className="rounded-xl px-4 py-2.5 flex items-center gap-2"
                style={{ backgroundColor: cfg.bg }}
              >
                <div
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cfg.color }}
                />
                <span className="font-bold text-sm" style={{ color: cfg.text }}>
                  {cfg.label}
                </span>
                <span className="ml-auto text-[11px] font-medium" style={{ color: cfg.color }}>
                  {currentTargets.length} →
                </span>
              </div>

              {/* Target toggles */}
              <div>
                <p className="text-[10px] text-[#aaaaaa] uppercase tracking-widest font-semibold mb-2">
                  Peut passer vers
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {possibleTargets.map((target) => {
                    const tCfg = STATUTS_UNITE[target];
                    const on = currentTargets.includes(target);
                    return (
                      <button
                        key={target}
                        onClick={() => toggleTransition(statut, target)}
                        title={on ? `Désactiver → ${tCfg.label}` : `Activer → ${tCfg.label}`}
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border-2 transition-all duration-150 ${
                          on
                            ? "opacity-100 scale-100 shadow-sm"
                            : "opacity-35 hover:opacity-60 scale-95 hover:scale-100"
                        }`}
                        style={
                          on
                            ? { backgroundColor: tCfg.bg, color: tCfg.text, borderColor: tCfg.color }
                            : { backgroundColor: "white", color: "#888888", borderColor: "#d1d5db" }
                        }
                      >
                        {on && <Check className="h-2.5 w-2.5 flex-shrink-0" />}
                        {tCfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {currentTargets.length === 0 && (
                <p className="text-[11px] text-[#cccccc] italic">Aucune transition — statut terminal</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Live preview */}
      <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
        <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-[#c9773f]" />
          Aperçu du flux complet
        </h3>
        <div className="space-y-2.5">
          {ALL_STATUTS.filter((s) => (transitions[s] || []).length > 0).map((from) => {
            const fromCfg = STATUTS_UNITE[from];
            const targets = transitions[from] || [];
            return (
              <div key={from} className="flex items-center gap-2 flex-wrap">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold inline-flex items-center gap-1"
                  style={{ backgroundColor: fromCfg.bg, color: fromCfg.text }}
                >
                  <span
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: fromCfg.color }}
                  />
                  {fromCfg.label}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-[#cccccc] flex-shrink-0" />
                <div className="flex flex-wrap gap-1.5">
                  {targets.map((to) => {
                    const toCfg = STATUTS_UNITE[to as keyof typeof STATUTS_UNITE];
                    if (!toCfg) return null;
                    return (
                      <span
                        key={to}
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ backgroundColor: toCfg.bg, color: toCfg.text }}
                      >
                        {toCfg.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {ALL_STATUTS.filter((s) => (transitions[s] || []).length === 0).length > 0 && (
            <div className="pt-2 border-t border-[#e8e6e1]">
              <p className="text-[11px] text-[#aaaaaa] mb-1.5">Statuts terminaux (aucune sortie)</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_STATUTS.filter((s) => (transitions[s] || []).length === 0).map((s) => {
                  const cfg = STATUTS_UNITE[s];
                  return (
                    <span
                      key={s}
                      className="rounded-full px-3 py-1 text-xs font-semibold opacity-50"
                      style={{ backgroundColor: cfg.bg, color: cfg.text }}
                    >
                      {cfg.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
