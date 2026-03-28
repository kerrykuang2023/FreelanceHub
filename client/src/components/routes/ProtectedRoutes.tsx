import { Navigate, useLocation } from "react-router-dom";
import { usePermissions, RoleType } from "@/hooks/usePermissions";
import { ReactNode, useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: RoleType[];
  fallbackPath?: string;
}

interface RoleRouteProps {
  children: ReactNode;
  allowedRoles: RoleType[];
  fallbackPath?: string;
}

const ROLE_DELAY_MS = 100;

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  fallbackPath = "/login",
}) => {
  const { isAuthenticated, canAccess } = usePermissions();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, ROLE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  if (requiredRoles && !canAccess(requiredRoles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const HROrAdminRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isHROrAdmin, isAuthenticated } = usePermissions();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, ROLE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isHROrAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const AdminRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAdmin, isAuthenticated } = usePermissions();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, ROLE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const FreelancerRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isFreelancer, isAuthenticated } = usePermissions();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, ROLE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isFreelancer) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const RoleBasedRoute: React.FC<RoleRouteProps> = ({
  children,
  allowedRoles,
  fallbackPath = "/",
}) => {
  const { hasAnyRole, isAuthenticated } = usePermissions();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, ROLE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAnyRole(allowedRoles)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};
