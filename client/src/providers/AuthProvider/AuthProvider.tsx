import StorageService from "@/core/storage.service";
import { IUserAccount, IUserRole } from "@/interfaces/models/user-account/IUserAccount";
import AuthService from "@/services/auth.service";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

type AuthContextProps = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: IUserAccount | null;
  roles: IUserRole[];
  activeRole: IUserRole | null;
  login: (token: string, user: IUserAccount) => Promise<void>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<IUserAccount | null>>;
  switchRole: (roleType: string) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const normalizeUser = (userData: any): IUserAccount => {
  return {
    ...userData,
    user_type_name: userData.user_type || userData.user_type_name || 'job_seeker',
    _id: userData._id || userData.id,
  };
};

const normalizeRoles = (rolesData: any[]): IUserRole[] => {
  if (!rolesData) return [];
  return rolesData.map(role => ({
    id: role._id || role.id,
    role_type: role.role_type,
    status: role.status || 'approved',
    is_active: role.is_active || false,
    role_specific_data: role.role_specific_data,
  }));
};

const normalizeActiveRole = (activeRoleData: any): IUserRole | null => {
  if (!activeRoleData) return null;
  return {
    id: activeRoleData._id || activeRoleData.id,
    role_type: activeRoleData.role_type,
    status: activeRoleData.status || 'approved',
    is_active: activeRoleData.is_active !== undefined ? activeRoleData.is_active : true,
    role_specific_data: activeRoleData.role_specific_data,
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<IUserAccount | null>(null);
  const [roles, setRoles] = useState<IUserRole[]>([]);
  const [activeRole, setActiveRole] = useState<IUserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (token: string, userData: IUserAccount): Promise<void> => {
    return new Promise((resolve) => {
      StorageService.setItem("access_token", token);
      const normalizedUser = normalizeUser(userData);
      setUser(normalizedUser);
      setIsAuthenticated(true);
      
      if (userData.roles) {
        const normalizedRoles = normalizeRoles(userData.roles);
        setRoles(normalizedRoles);
        
        if (userData.active_role) {
          const activeRoleFromData = normalizeActiveRole(userData.active_role);
          setActiveRole(activeRoleFromData);
        } else {
          const currentActive = normalizedRoles.find(r => r.is_active) || normalizedRoles[0] || null;
          setActiveRole(currentActive);
        }
      }
      
      setTimeout(() => resolve(), 50);
    });
  };

  const logout = () => {
    StorageService.removeItem("access_token");
    setIsAuthenticated(false);
    setUser(null);
    setRoles([]);
    setActiveRole(null);
  };

  const refreshUser = useCallback(async () => {
    try {
      const authService = new AuthService();
      const response = await authService.getCurrentUser();
      console.log('[AuthProvider] refreshUser response:', response);
      
      const userData = response.data?.user || response.user || response;
      const rolesData = response.data?.roles || response.roles || [];
      const activeRoleData = response.data?.active_role || response.active_role || null;
      
      const normalizedUser = normalizeUser(userData);
      setUser(normalizedUser);
      
      if (rolesData && rolesData.length > 0) {
        const normalizedRoles = normalizeRoles(rolesData);
        setRoles(normalizedRoles);
        
        if (activeRoleData) {
          const activeRoleFromData = normalizeActiveRole(activeRoleData);
          setActiveRole(activeRoleFromData);
        } else {
          const currentActive = normalizedRoles.find(r => r.is_active) || normalizedRoles[0] || null;
          setActiveRole(currentActive);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const switchRole = useCallback(async (roleType: string) => {
    try {
      const authService = new AuthService();
      await authService.switchRole(roleType);
      await refreshUser();
    } catch (error) {
      console.error("Failed to switch role:", error);
      throw error;
    }
  }, [refreshUser]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = StorageService.getItem("access_token");
        if (token) {
          const authService = new AuthService();
          const response = await authService.getCurrentUser();
          console.log('[AuthProvider] getCurrentUser response:', response);
          
          const userData = response.data?.user || response.user || response;
          const rolesData = response.data?.roles || response.roles || [];
          const activeRoleData = response.data?.active_role || response.active_role || null;
          
          const normalizedUser = normalizeUser(userData);
          setUser(normalizedUser);
          setIsAuthenticated(true);
          
          if (rolesData && rolesData.length > 0) {
            const normalizedRoles = normalizeRoles(rolesData);
            setRoles(normalizedRoles);
            
            if (activeRoleData) {
              const activeRoleFromData = normalizeActiveRole(activeRoleData);
              setActiveRole(activeRoleFromData);
            } else {
              const currentActive = normalizedRoles.find(r => r.is_active) || normalizedRoles[0] || null;
              setActiveRole(currentActive);
            }
          }
        }
      } catch (error) {
        console.log(error);
        setIsAuthenticated(false);
        StorageService.removeItem("access_token");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading,
      user, 
      roles,
      activeRole,
      login, 
      logout, 
      setUser,
      switchRole,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
