-- Drop existing policies
DROP POLICY IF EXISTS "Admins can update non-admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners can update all roles" ON public.user_roles;

-- Owners can update any non-owner user to any role except owner
CREATE POLICY "Owners can update all roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (is_owner(auth.uid()) AND role <> 'owner')
WITH CHECK (is_owner(auth.uid()) AND role <> 'owner');

-- Admins can update users/moderators to user or moderator only (not to admin or owner)
CREATE POLICY "Admins can update non-admin roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND role IN ('user', 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND role IN ('user', 'moderator'));