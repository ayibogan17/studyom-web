-- Teacher dashboard stats: pending requests + active threads + last message timestamp
create or replace function public.get_teacher_dashboard_stats(p_teacher_user_id text)
returns jsonb
language sql
security definer
as $$
  select jsonb_build_object(
    'pending_requests', (
      select count(*)
      from "TeacherMessageRequest"
      where "teacherUserId" = p_teacher_user_id and "status" = 'pending'
    ),
    'active_threads', (
      select count(*)
      from "TeacherThread"
      where "teacherUserId" = p_teacher_user_id and "locked" = false
    ),
    'last_message_at', (
      select max(m."createdAt")
      from "TeacherMessage" m
      join "TeacherThread" t on t."id" = m."threadId"
      where t."teacherUserId" = p_teacher_user_id
    )
  );
$$;

-- Supporting indexes (safe if they already exist)
create index if not exists "TeacherMessage_teacherThreadCreatedAt_idx"
  on "TeacherMessage" ("threadId", "createdAt" desc);

create index if not exists "TeacherThread_teacherUserLocked_idx"
  on "TeacherThread" ("teacherUserId", "locked");

create index if not exists "TeacherMessageRequest_teacherUserStatus_idx"
  on "TeacherMessageRequest" ("teacherUserId", "status");
