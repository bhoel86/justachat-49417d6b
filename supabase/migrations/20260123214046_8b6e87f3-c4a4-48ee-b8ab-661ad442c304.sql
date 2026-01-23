-- Drop existing restrictive UPDATE policies
DROP POLICY IF EXISTS "Admins can update non-admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners can update all roles" ON public.user_roles;

-- Create PERMISSIVE UPDATE policies (OR logic - any matching policy allows access)
CREATE POLICY "Admins can update non-admin roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND role NOT IN ('owner', 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND role NOT IN ('owner', 'admin'));

CREATE POLICY "Owners can update all roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (is_owner(auth.uid()) AND role <> 'owner')
WITH CHECK (is_owner(auth.uid()) AND role <> 'owner');