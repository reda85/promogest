/**
 * lib/exception-store.ts
 * Exception request/approval store — backed by Supabase (exception_requests table).
 */
import { getDB, getOrgId } from "@/lib/supabase/db";

export type ExceptionType   = "PRIX" | "AVANCE";
export type ExceptionStatus = "EN_ATTENTE" | "APPROUVE" | "REJETE";

export interface ExceptionRequest {
  id:                 string;
  org_id:             string;
  reservation_id:     string;
  type:               ExceptionType;
  current_value:      number;
  requested_value:    number;
  justification:      string;
  requested_by_role:  string;
  requested_by_name:  string;
  status:             ExceptionStatus;
  admin_comment?:     string;
  created_at:         string;
  resolved_at?:       string;
}

/** All exception requests (admin view). */
export async function getExceptions(): Promise<ExceptionRequest[]> {
  const { data, error } = await getDB()
    .from("exception_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as unknown as ExceptionRequest[];
}

/** Requests for a single reservation. */
export async function getExceptionsForReservation(reservationId: string): Promise<ExceptionRequest[]> {
  const { data, error } = await getDB()
    .from("exception_requests")
    .select("*")
    .eq("reservation_id", reservationId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as unknown as ExceptionRequest[];
}

/** Count of pending requests (used for the admin sidebar badge). */
export async function getPendingCount(): Promise<number> {
  const { count, error } = await getDB()
    .from("exception_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "EN_ATTENTE");
  if (error) return 0;
  return count ?? 0;
}

/** Count of pending requests raised by a given role (non-admin sidebar badge). */
export async function getPendingCountForRole(role: string): Promise<number> {
  const { count, error } = await getDB()
    .from("exception_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "EN_ATTENTE")
    .eq("requested_by_role", role);
  if (error) return 0;
  return count ?? 0;
}

/** Create a new exception request. */
export async function createException(
  data: Omit<ExceptionRequest, "id" | "org_id" | "status" | "created_at">
): Promise<ExceptionRequest | null> {
  const org_id = await getOrgId();
  if (!org_id) return null;
  const { data: result, error } = await getDB()
    .from("exception_requests")
    .insert({ ...data, org_id, status: "EN_ATTENTE" })
    .select()
    .single();
  if (error) return null;
  return result as unknown as ExceptionRequest;
}

/** Approve a pending request (optionally add a comment). */
export async function approveException(id: string, adminComment?: string): Promise<void> {
  await getDB()
    .from("exception_requests")
    .update({
      status: "APPROUVE" as ExceptionStatus,
      admin_comment: adminComment ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);
}

/** Reject a pending request with a mandatory reason. */
export async function rejectException(id: string, adminComment: string): Promise<void> {
  await getDB()
    .from("exception_requests")
    .update({
      status: "REJETE" as ExceptionStatus,
      admin_comment: adminComment,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);
}

/** Withdraw / delete a pending request. */
export async function cancelException(id: string): Promise<void> {
  await getDB().from("exception_requests").delete().eq("id", id);
}
