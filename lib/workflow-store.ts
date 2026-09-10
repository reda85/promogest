import { WORKFLOW_TRANSITIONS } from "./constants";

export type WorkflowTransitions = Record<string, string[]>;

const STORAGE_KEY = "promogest_workflow";

/** Read the active workflow (localStorage override or built-in default). */
export function getWorkflow(): WorkflowTransitions {
  if (typeof window === "undefined") return { ...WORKFLOW_TRANSITIONS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as WorkflowTransitions;
  } catch {
    // corrupted storage — fall through to default
  }
  return { ...WORKFLOW_TRANSITIONS };
}

/** Persist a custom workflow to localStorage. */
export function saveWorkflow(transitions: WorkflowTransitions): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transitions));
  } catch {}
}

/** Remove the override and go back to the built-in default. */
export function resetWorkflow(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
