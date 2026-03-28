import { useAuth } from "@/providers";
import { useMemo } from "react";

export type RoleType = 'job_seeker' | 'freelancer' | 'hr_recruiter' | 'company_user' | 'admin';

export type PermissionKey = 
  | 'view_dashboard'
  | 'view_my_projects'
  | 'browse_projects'
  | 'view_applications'
  | 'view_saved_jobs'
  | 'manage_work_logs'
  | 'manage_invoices'
  | 'view_messages'
  | 'post_job'
  | 'manage_applications'
  | 'manage_company'
  | 'admin_access'
  | 'manage_users'
  | 'approve_roles'
  | 'review_companies'
  | 'manage_worklogs'
  | 'manage_projects'
  | 'manage_reports'
  | 'system_config';

export interface PermissionResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentRole: RoleType;
  isJobSeeker: boolean;
  isFreelancer: boolean;
  isHR: boolean;
  isCompanyUser: boolean;
  isAdmin: boolean;
  isHROrAdmin: boolean;
  hasRole: (role: RoleType) => boolean;
  hasAnyRole: (roles: RoleType[]) => boolean;
  canAccess: (requiredRole: RoleType | RoleType[]) => boolean;
  hasPermission: (permission: PermissionKey) => boolean;
}

export const usePermissions = (): PermissionResult => {
  const { isAuthenticated, activeRole, user, roles, isLoading } = useAuth();
  
  return useMemo(() => {
    const currentRole = (activeRole?.role_type || user?.user_type_name || 'job_seeker') as RoleType;
    
    console.log('[usePermissions] activeRole:', activeRole);
    console.log('[usePermissions] user:', user);
    console.log('[usePermissions] currentRole:', currentRole);
    
    const isJobSeeker = currentRole === 'job_seeker';
    const isFreelancer = currentRole === 'freelancer' || currentRole === 'job_seeker';
    const isHR = currentRole === 'hr_recruiter';
    const isCompanyUser = currentRole === 'company_user';
    const isAdmin = currentRole === 'admin';
    const isHROrAdmin = isHR || isAdmin;
    
    const hasRole = (role: RoleType): boolean => {
      if (!isAuthenticated) return false;
      return currentRole === role;
    };
    
    const hasAnyRole = (rolesToCheck: RoleType[]): boolean => {
      if (!isAuthenticated) return false;
      return rolesToCheck.includes(currentRole);
    };
    
    const canAccess = (requiredRole: RoleType | RoleType[]): boolean => {
      if (!isAuthenticated) return false;
      
      if (Array.isArray(requiredRole)) {
        return hasAnyRole(requiredRole);
      }
      
      return hasRole(requiredRole);
    };

    const hasPermission = (permission: PermissionKey): boolean => {
      if (!isAuthenticated) return false;

      const rolePermissions: Record<RoleType, PermissionKey[]> = {
        admin: [
          'view_dashboard', 'view_my_projects', 'manage_work_logs', 'manage_invoices',
          'view_messages', 'admin_access', 'manage_users', 'approve_roles',
          'review_companies', 'manage_worklogs', 'manage_projects', 'manage_reports',
          'system_config', 'browse_projects', 'view_applications', 'view_saved_jobs',
          'post_job', 'manage_applications', 'manage_company'
        ],
        hr_recruiter: [
          'view_dashboard', 'view_my_projects', 'manage_work_logs', 'manage_invoices',
          'view_messages', 'post_job', 'manage_applications', 'manage_company'
        ],
        freelancer: [
          'view_dashboard', 'view_my_projects', 'browse_projects', 'view_applications',
          'view_saved_jobs', 'manage_work_logs', 'manage_invoices', 'view_messages'
        ],
        job_seeker: [
          'view_dashboard', 'view_my_projects', 'browse_projects', 'view_applications',
          'view_saved_jobs', 'manage_work_logs', 'manage_invoices', 'view_messages'
        ],
        company_user: [
          'view_dashboard', 'view_my_projects', 'manage_work_logs', 'manage_invoices',
          'view_messages', 'post_job', 'manage_applications', 'manage_company'
        ],
      };

      const permissions = rolePermissions[currentRole] || [];
      return permissions.includes(permission);
    };
    
    return {
      isAuthenticated,
      isLoading,
      currentRole,
      isJobSeeker,
      isFreelancer,
      isHR,
      isCompanyUser,
      isAdmin,
      isHROrAdmin,
      hasRole,
      hasAnyRole,
      canAccess,
      hasPermission,
    };
  }, [isAuthenticated, activeRole, user, roles, isLoading]);
};
