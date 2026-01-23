-- Ensure user_roles supports upsert by user_id and owners/admins can create role rows.

-- 1) Dedupe any existing duplicates (keep newest row per user_id)
with ranked as (
  select id, user_id,
         row_number() over (partition by user_id order by created_at desc, id desc) as rn
  from public.user_roles
)
delete from public.user_roles ur
using ranked r
where ur.id = r.id
  and r.rn > 1;

-- 2) Replace unique(user_id, role) with unique(user_id) so each user has exactly one role row
alter table public.user_roles drop constraint if exists user_roles_user_id_role_key;
alter table public.user_roles add constraint user_roles_user_id_key unique (user_id);

-- 3) Allow inserting role rows (needed for new users who don't yet have a row)
drop policy if exists "Owners can insert roles" on public.user_roles;
create policy "Owners can insert roles"
on public.user_roles
for insert
with check (
  is_owner(auth.uid())
  and role <> 'owner'::public.app_role
);

drop policy if exists "Admins can insert non-admin roles" on public.user_roles;
create policy "Admins can insert non-admin roles"
on public.user_roles
for insert
with check (
  has_role(auth.uid(), 'admin'::public.app_role)
  and role = any (array['user'::public.app_role, 'moderator'::public.app_role])
);
