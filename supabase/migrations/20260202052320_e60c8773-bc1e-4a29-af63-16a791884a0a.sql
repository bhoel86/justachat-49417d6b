-- Fix staff visibility: allow all authenticated users to see owner/admin/moderator roles
DROP POLICY IF EXISTS "Authenticated users can view staff roles" ON public.user_roles;

CREATE POLICY "Authenticated users can view staff roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (role IN ('owner'::public.app_role, 'admin'::public.app_role, 'moderator'::public.app_role));