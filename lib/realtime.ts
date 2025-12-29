import "server-only";

import { createHmac } from "crypto";

const realtimeSecret =
  process.env.REALTIME_SECRET ||
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "";

export function getTeacherThreadChannel(threadId: string) {
  if (!realtimeSecret) {
    return `teacher-thread:${threadId}`;
  }
  const hash = createHmac("sha256", realtimeSecret).update(threadId).digest("hex").slice(0, 32);
  return `teacher-thread:${hash}`;
}

export function getProducerThreadChannel(threadId: string) {
  if (!realtimeSecret) {
    return `producer-thread:${threadId}`;
  }
  const hash = createHmac("sha256", realtimeSecret).update(threadId).digest("hex").slice(0, 32);
  return `producer-thread:${hash}`;
}
