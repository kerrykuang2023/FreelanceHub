import { lazy, Suspense, useEffect, useState } from "react";
import HomePage from "@/pages/HomePage";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppWrapper from "./AppWrapper";
import { useAuth, ToastProvider } from "./providers";
import { usePermissions, RoleType } from "./hooks/usePermissions";
import PortalLayout from "@/components/layouts/portal/PortalLayout";

const LoginPage = lazy(() => import("@/pages/AuthPages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/AuthPages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/AuthPages/ForgotPasswordPage"));
const MyJobsPage = lazy(() => import("@/pages/MyJobsPage"));
const SavedJobsPage = lazy(() => import("@/pages/SavedJobsPage"));
const MessagesPage = lazy(() => import("@/pages/MessagesPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const JobDetailPage = lazy(() => import("@/pages/JobDetailPage"));
const PostJobPage = lazy(() => import("@/pages/PostJobPage"));
const FreelancerDashboardPage = lazy(() => import("@/pages/FreelancerDashboardPage"));
const WorkLogsPage = lazy(() => import("@/pages/WorkLogsPage"));
const CreateWorkLogPage = lazy(() => import("@/pages/CreateWorkLogPage"));
const HRDashboardPage = lazy(() => import("@/pages/HRDashboardPage"));
const HRWorkLogsPage = lazy(() => import("@/pages/HRWorkLogsPage"));
const AdminDashboardPage = lazy(() => import("@/pages/AdminDashboardPage"));
const AdminCompanyReviewPage = lazy(() => import("@/pages/AdminCompanyReviewPage"));
const AdminConfigPage = lazy(() => import("@/pages/AdminConfigPage"));
const SystemConfigurationPage = lazy(() => import("@/pages/SystemConfigurationPage"));
const InvoicesPage = lazy(() => import("@/pages/InvoicesPage"));
const CreateInvoicePage = lazy(() => import("@/pages/CreateInvoicePage"));
const MatchRecommendationsPage = lazy(() => import("@/pages/MatchRecommendationsPage/MatchRecommendationsPage"));
const ContractsPage = lazy(() => import("@/pages/ContractsPage/ContractsPage"));
const ProjectMilestonesPage = lazy(() => import("@/pages/ProjectMilestonesPage/ProjectMilestonesPage"));
const PaymentsPage = lazy(() => import("@/pages/PaymentsPage/PaymentsPage"));
const TicketsPage = lazy(() => import("@/pages/TicketsPage/TicketsPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage/ReportsPage"));
const CreateRatingPage = lazy(() => import("@/pages/RatingPage/CreateRatingPage"));
const RatingsPage = lazy(() => import("@/pages/RatingsPage"));
const ApplicationsManagementPage = lazy(() => import("@/pages/ApplicationsManagementPage/ApplicationsManagementPage"));
const AdminUsersPage = lazy(() => import("@/pages/AdminUsersPage/AdminUsersPage"));
const AdminFreelancersPage = lazy(() => import("@/pages/AdminFreelancersPage/AdminFreelancersPage"));
const InvoiceReviewPage = lazy(() => import("@/pages/InvoiceReviewPage/InvoiceReviewPage"));
const InvoiceDetailPage = lazy(() => import("@/pages/InvoiceDetailPage"));
const EditInvoicePage = lazy(() => import("@/pages/EditInvoicePage"));
const ProjectApplicationPage = lazy(() => import("@/pages/ProjectApplicationPage/ProjectApplicationPage"));
const EditJobPage = lazy(() => import("@/pages/EditJobPage/EditJobPage"));
const IdentityVerificationPage = lazy(() => import("@/pages/IdentityVerificationPage/IdentityVerificationPage"));
const RoleSwitchPage = lazy(() => import("@/pages/RoleSwitchPage/RoleSwitchPage"));
const RoleApprovalsPage = lazy(() => import("@/pages/RoleApprovalsPage"));
const MyRoleApprovalsPage = lazy(() => import("@/pages/MyRoleApprovalsPage"));
const CreditHistoryPage = lazy(() => import("@/pages/CreditHistoryPage"));
const ReportPage = lazy(() => import("@/pages/ReportPage"));
const AdminReportManagementPage = lazy(() => import("@/pages/AdminReportManagementPage"));
const HROnboardingPage = lazy(() => import("@/pages/HROnboardingPage"));
const CompanyManagementPage = lazy(() => import("@/pages/CompanyManagementPage"));

const JobsListPage = lazy(() => import("@/pages/JobsListPage"));

const PERMISSION_READY_DELAY = 500;

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: RoleType[];
}

const RoleRoute = ({ children, allowedRoles }: RoleRouteProps) => {
  const { hasAnyRole, isAuthenticated, isLoading } = usePermissions();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, PERMISSION_READY_DELAY);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading || !isReady) {
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
    console.log(`[RoleRoute] 权限不足，当前角色不在允许列表中: ${allowedRoles.join(', ')}`);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => (
  <RoleRoute allowedRoles={['admin']}>{children}</RoleRoute>
);

const AdminLayoutRoute = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <AdminRoute>
    <PortalLayout title={title}>{children}</PortalLayout>
  </AdminRoute>
);

const AuthenticatedLayoutRoute = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <PortalLayout title={title}>{children}</PortalLayout>
);

const HROrAdminRoute = ({ children }: { children: React.ReactNode }) => (
  <RoleRoute allowedRoles={['hr_recruiter', 'admin']}>{children}</RoleRoute>
);

const FreelancerRoute = ({ children }: { children: React.ReactNode }) => (
  <RoleRoute allowedRoles={['job_seeker', 'freelancer']}>{children}</RoleRoute>
);

function App() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isAdmin, isHR } = usePermissions();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, PERMISSION_READY_DELAY);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, authLoading]);

  const getDashboardPage = () => {
    console.log('[App] getDashboardPage - isAdmin:', isAdmin, 'isHR:', isHR);
    if (isAdmin) return <AdminDashboardPage />;
    if (isHR) return <HRDashboardPage />;
    return <FreelancerDashboardPage />;
  };

  if (authLoading || !isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
          {isAuthenticated ? (
            <Routes>
              <Route path="/" element={<AppWrapper />}>
                <Route index element={getDashboardPage()} />
                <Route path="/dashboard" element={getDashboardPage()} />
                <Route path="/jobs" element={<JobsListPage />} />
                <Route path="/my-projects" element={<MyJobsPage />} />
                <Route path="/applications" element={<MyJobsPage />} />
                <Route path="/my-jobs" element={<MyJobsPage />} />
                <Route path="/saved-jobs" element={<SavedJobsPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/hr/onboarding" element={<HROnboardingPage />} />
                <Route path="/company" element={<HROrAdminRoute><CompanyManagementPage /></HROrAdminRoute>} />
                <Route path="/profile/verification" element={<IdentityVerificationPage />} />
                <Route path="/profile/switch-role" element={<AuthenticatedLayoutRoute title="角色与切换"><RoleSwitchPage /></AuthenticatedLayoutRoute>} />
                <Route path="/profile/role-approvals" element={<AuthenticatedLayoutRoute title="我的角色申请"><MyRoleApprovalsPage /></AuthenticatedLayoutRoute>} />
                <Route path="/profile/credits" element={<CreditHistoryPage />} />
                <Route path="/report" element={<ReportPage />} />
                <Route path="/jobs/:id" element={<JobDetailPage />} />
                <Route path="/jobs/:id/apply" element={<FreelancerRoute><ProjectApplicationPage /></FreelancerRoute>} />
                <Route path="/jobs/:id/edit" element={<HROrAdminRoute><EditJobPage /></HROrAdminRoute>} />
                <Route path="/post-job" element={<HROrAdminRoute><PostJobPage /></HROrAdminRoute>} />
                <Route path="/work-logs" element={<WorkLogsPage />} />
                <Route path="/work-logs/new" element={<CreateWorkLogPage />} />
                <Route path="/hr/dashboard" element={<HROrAdminRoute><HRDashboardPage /></HROrAdminRoute>} />
                <Route path="/company/work-logs/pending" element={<HROrAdminRoute><HRWorkLogsPage /></HROrAdminRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
                <Route path="/admin/companies" element={<AdminRoute><Navigate to="/admin?tab=companies" replace /></AdminRoute>} />
                <Route path="/admin/projects" element={<AdminRoute><Navigate to="/admin?tab=projects" replace /></AdminRoute>} />
                <Route path="/admin/worklogs" element={<AdminRoute><Navigate to="/admin?tab=worklogs" replace /></AdminRoute>} />
                <Route path="/admin/invoices" element={<AdminRoute><Navigate to="/admin?tab=invoices" replace /></AdminRoute>} />
                <Route path="/admin/financial" element={<AdminRoute><Navigate to="/admin?tab=financial" replace /></AdminRoute>} />
                <Route path="/admin/config" element={<AdminRoute><Navigate to="/admin/configuration" replace /></AdminRoute>} />
                <Route path="/admin/role-approvals" element={<AdminLayoutRoute title="角色审批"><RoleApprovalsPage /></AdminLayoutRoute>} />
                <Route path="/admin/companies/:id" element={<AdminLayoutRoute title="企业详情"><AdminCompanyReviewPage /></AdminLayoutRoute>} />
                <Route path="/admin/configuration" element={<AdminLayoutRoute title="系统配置"><SystemConfigurationPage /></AdminLayoutRoute>} />
                <Route path="/admin/config/skill-categories" element={<AdminLayoutRoute title="技能分类"><AdminConfigPage /></AdminLayoutRoute>} />
                <Route path="/admin/config/work-types" element={<AdminLayoutRoute title="工时类型"><AdminConfigPage /></AdminLayoutRoute>} />
                <Route path="/admin/config/tax-rates" element={<AdminLayoutRoute title="税率配置"><AdminConfigPage /></AdminLayoutRoute>} />
                <Route path="/admin/config/currencies" element={<AdminLayoutRoute title="货币配置"><AdminConfigPage /></AdminLayoutRoute>} />
                <Route path="/admin/config/languages" element={<AdminLayoutRoute title="语言要求"><AdminConfigPage /></AdminLayoutRoute>} />
                <Route path="/admin/config/job-natures" element={<AdminLayoutRoute title="工作性质"><AdminConfigPage /></AdminLayoutRoute>} />
                <Route path="/admin/config/work-formats" element={<AdminLayoutRoute title="工作形式"><AdminConfigPage /></AdminLayoutRoute>} />
                <Route path="/admin/config/rate-types" element={<AdminLayoutRoute title="计费类型"><AdminConfigPage /></AdminLayoutRoute>} />
                <Route path="/admin/config/invoice-types" element={<AdminLayoutRoute title="发票类型"><AdminConfigPage /></AdminLayoutRoute>} />
                <Route path="/admin/config/payment-methods" element={<AdminLayoutRoute title="付款方式"><AdminConfigPage /></AdminLayoutRoute>} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/invoices/new" element={<CreateInvoicePage />} />
                <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
                <Route path="/invoices/:id/edit" element={<EditInvoicePage />} />
                <Route path="/match-recommendations" element={<MatchRecommendationsPage />} />
                <Route path="/contracts" element={<ContractsPage />} />
                <Route path="/milestones" element={<ProjectMilestonesPage />} />
                <Route path="/projects/:projectId/milestones" element={<ProjectMilestonesPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/tickets" element={<TicketsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/ratings" element={<RatingsPage />} />
                <Route path="/ratings/create" element={<CreateRatingPage />} />
                <Route path="/ratings/create/:projectId" element={<CreateRatingPage />} />
                <Route path="/company/applications" element={<HROrAdminRoute><ApplicationsManagementPage /></HROrAdminRoute>} />
                <Route path="/company/invoices/review" element={<HROrAdminRoute><InvoiceReviewPage /></HROrAdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
                <Route path="/admin/freelancers" element={<AdminRoute><AdminFreelancersPage /></AdminRoute>} />
                <Route path="/admin/reports" element={<AdminLayoutRoute title="举报管理"><AdminReportManagementPage /></AdminLayoutRoute>} />
                <Route path="/login" element={<Navigate to="/" />} />
                <Route path="/register" element={<Navigate to="/" />} />
                <Route path="/forgot-password" element={<Navigate to="/" />} />
                <Route path="/settings" element={<Navigate to="/profile?tab=settings" replace />} />
              </Route>
            </Routes>
          ) : (
            <Routes>
              <Route path="/" element={<AppWrapper />}>
                <Route index element={<HomePage />} />
                <Route path="/jobs/:id" element={<JobDetailPage />} />
                <Route path="/post-job" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="*" element={<Navigate to="/login" />} />
              </Route>
            </Routes>
          )}
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
