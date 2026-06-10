import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export { adminDb as db, FieldValue, Timestamp };

export function toDate(val: unknown): Date {
  if (!val) return new Date();
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val as string);
}

export function nowIso() {
  return new Date().toISOString();
}

export function col(path: string) {
  return adminDb.collection(path);
}

export function doc(path: string, id: string) {
  return adminDb.collection(path).doc(id);
}
