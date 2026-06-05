import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon,
  BuildingOfficeIcon,
  CheckIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/providers';
import AuthService from '@/services/auth.service';
import { IUserRole } from '@/interfaces/models/user-account/IUserAccount';
import PageHeader from '@/components/core-ui/PageHeader';

type RoleType = 'job_seeker' | 'hr_recruiter' | 'admin';
type RoleStatus = 'pending' | 'approved' | 'rejected' | 'frozen';

interface RoleApproval {
  id?: string;
  _id?: string;
  role_type: RoleType;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  rejection_reason?: string;
  review_notes?: string;
  created_at?: string;
  createdAt?: string;
  reviewed_at?: string;
}

interface RoleApplicationForm {
  application_reason: string;
  skills_text: string;
  professional_summary: string;
  company_name: string;
  position: string;
}

const roleMeta: Record<RoleType, { display_name: string; short_name: string; icon: React.ElementType; description: string }> = {
  job_seeker: {
    display_name: '顾问/求职者',
    short_name: '顾问',
    icon: UserCircleIcon,
    description: '寻找项目机会，填报工时和管理发票',
  },
  hr_recruiter: {
    display_name: '企业/HR',
    short_name: '企业/HR',
    icon: BuildingOfficeIcon,
    description: '发布项目需求，管理申请、工时和发票审核',
  },
  admin: {
    display_name: '平台管理员',
    short_name: '管理员',
    icon: ShieldCheckIcon,
    description: '管理平台运营、审批角色和系统配置',
  },
};

const applicantRoles: RoleType[] = ['job_seeker', 'hr_recruiter'];

const getRoleMeta = (roleType: string) =>
  roleMeta[roleType as RoleType] || {
    display_name: roleType,
    short_name: roleType,
    icon: UserCircleIcon,
    description: '使用该角色访问对应功能',
  };

const getBackendMessage = (err: any) => {
  const data = err?.response?.data;
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.error === 'string') return data.error;
  if (typeof data?.error?.message === 'string') return data.error.message;
  return undefined;
};

const RoleSwitchPage = () => {
  const navigate = useNavigate();
  const { user, roles, activeRole, switchRole, refreshUser } = useAuth();
  const [allRoles, setAllRoles] = useState<IUserRole[]>(roles);
  const [approvals, setApprovals] = useState<RoleApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [applicationRole, setApplicationRole] = useState<RoleType | null>(null);
  const [applicationForm, setApplicationForm] = useState<RoleApplicationForm>({
    application_reason: '',
    skills_text: '',
    professional_summary: '',
    company_name: '',
    position: '',
  });

  useEffect(() => {
    setCurrentRole(activeRole?.role_type || user?.user_type_name || '');
  }, [activeRole, user]);

  useEffect(() => {
    const loadRoleState = async () => {
      try {
        setPageLoading(true);
        const authService = new AuthService();
        const [roleResponse, approvalResponse] = await Promise.all([
          authService.getMyRoles(),
          authService.getMyRoleApprovals(),
        ]);

        setAllRoles(roleResponse?.data?.roles || roleResponse?.roles || roles);
        setApprovals(approvalResponse?.data || approvalResponse || []);
      } catch (err) {
        console.error('Failed to load role state:', err);
        setAllRoles(roles);
      } finally {
        setPageLoading(false);
      }
    };

    loadRoleState();
  }, [roles]);

  const approvedRoles = useMemo(
    () => allRoles.filter((role) => role.status === 'approved'),
    [allRoles]
  );

  const actionableRoles = approvedRoles.filter((role) => role.role_type !== currentRole && !role.is_active);
  const currentRoleMeta = getRoleMeta(currentRole);
  const CurrentRoleIcon = currentRoleMeta.icon;

  const latestApprovalByRole = useMemo(() => {
    const next: Partial<Record<RoleType, RoleApproval>> = {};
    approvals.forEach((approval) => {
      const existing = next[approval.role_type];
      const existingCreatedAt = existing?.created_at || existing?.createdAt;
      const approvalCreatedAt = approval.created_at || approval.createdAt;
      const existingTime = existingCreatedAt ? new Date(existingCreatedAt).getTime() : 0;
      const nextTime = approvalCreatedAt ? new Date(approvalCreatedAt).getTime() : 0;
      if (!existing || nextTime >= existingTime) {
        next[approval.role_type] = approval;
      }
    });
    return next;
  }, [approvals]);

  const applicationTargets = applicantRoles.filter((roleType) => {
    const role = allRoles.find((item) => item.role_type === roleType);
    return !role || role.status === 'pending' || role.status === 'rejected';
  });

  const getErrorMessage = (err: any) => {
    const backendMessage = getBackendMessage(err);
    if (backendMessage?.includes('approved role')) {
      return '该角色尚未审批通过，暂时不能切换。请先提交角色申请并等待管理员审批。';
    }
    if (backendMessage?.includes('pending approval')) {
      return '该角色已经提交申请，正在等待管理员审批。';
    }
    if (backendMessage?.includes('already have this role')) {
      return '您已经拥有该角色，请查看申请状态或刷新页面后重试。';
    }
    return backendMessage || '操作失败，请稍后重试';
  };

  const openApplicationModal = (roleType: RoleType) => {
    setApplicationRole(roleType);
    setApplicationError(null);
    setError(null);
    setSuccess(null);
    setApplicationForm({
      application_reason: '',
      skills_text: '',
      professional_summary: '',
      company_name: '',
      position: '',
    });
  };

  const validateApplicationForm = (roleType: RoleType) => {
    if (applicationForm.application_reason.trim().length < 10) {
      return '请填写至少 10 个字的申请原因。';
    }

    if (
      roleType === 'job_seeker' &&
      applicationForm.skills_text.trim().length === 0 &&
      applicationForm.professional_summary.trim().length < 10
    ) {
      return '申请顾问/求职者角色时，请填写至少 1 项技能或 10 个字以上的经验说明。';
    }

    if (
      roleType === 'hr_recruiter' &&
      (applicationForm.company_name.trim().length < 2 || applicationForm.position.trim().length < 2)
    ) {
      return '申请企业/HR角色时，请填写公司名称和岗位/职能。';
    }

    return null;
  };

  const buildSubmittedData = (roleType: RoleType) => {
    const base = {
      requested_from: 'role_switch_page',
      current_role: currentRole,
      application_reason: applicationForm.application_reason.trim(),
    };

    if (roleType === 'job_seeker') {
      return {
        ...base,
        skills: applicationForm.skills_text
          .split(/[,，\n]/)
          .map((skill) => skill.trim())
          .filter(Boolean),
        professional_summary: applicationForm.professional_summary.trim(),
      };
    }

    if (roleType === 'hr_recruiter') {
      return {
        ...base,
        company_name: applicationForm.company_name.trim(),
        position: applicationForm.position.trim(),
      };
    }

    return base;
  };

  const handleRoleSwitch = async (roleType: string) => {
    if (roleType === currentRole) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await switchRole(roleType);
      setCurrentRole(roleType);
      navigate('/');
    } catch (err: any) {
      console.error('Failed to switch role:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyForRole = async (roleType: RoleType) => {
    const validationError = validateApplicationForm(roleType);
    if (validationError) {
      setApplicationError(validationError);
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setApplicationError(null);
      setSuccess(null);
      const authService = new AuthService();
      await authService.applyForRole({
        role_type: roleType,
        submitted_data: buildSubmittedData(roleType),
      });
      await refreshUser();

      const [roleResponse, approvalResponse] = await Promise.all([
        authService.getMyRoles(),
        authService.getMyRoleApprovals(),
      ]);
      setAllRoles(roleResponse?.data?.roles || roleResponse?.roles || []);
      setApprovals(approvalResponse?.data || approvalResponse || []);
      setApplicationRole(null);
      setSuccess(`${getRoleMeta(roleType).display_name}角色申请已提交，请等待管理员审批。`);
    } catch (err: any) {
      console.error('Failed to apply for role:', err);
      const message = getErrorMessage(err);
      setApplicationError(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const renderRoleCard = (role: IUserRole) => {
    const meta = getRoleMeta(role.role_type);
    const IconComponent = meta.icon;
    const isActive = currentRole === role.role_type || role.is_active;

    return (
      <button
        key={role.id}
        onClick={() => handleRoleSwitch(role.role_type)}
        disabled={loading || isActive}
        className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
          isActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
        } ${loading || isActive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
            isActive ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <IconComponent className={`w-7 h-7 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={`text-lg font-semibold ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                {meta.display_name}
              </h3>
              {isActive && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  当前角色
                </span>
              )}
            </div>
            <p className={`text-sm ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
              {meta.description}
            </p>
          </div>
          {isActive ? (
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <CheckIcon className="w-6 h-6 text-white" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>
      </button>
    );
  };

  const renderApplicationCard = (roleType: RoleType) => {
    const meta = getRoleMeta(roleType);
    const IconComponent = meta.icon;
    const role = allRoles.find((item) => item.role_type === roleType);
    const approval = latestApprovalByRole[roleType];
    const isPending = role?.status === 'pending' || approval?.status === 'pending';
    const isRejected = role?.status === 'rejected' || approval?.status === 'rejected';

    return (
      <div
        key={roleType}
        className="rounded-xl border border-gray-200 bg-white p-5"
        data-testid={`role-application-card-${roleType}`}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
            <IconComponent className="w-6 h-6 text-gray-600" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">{meta.display_name}</h3>
              {isPending && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800"
                  data-testid={`role-application-status-${roleType}`}
                >
                  <ClockIcon className="h-3.5 w-3.5" />
                  审批中
                </span>
              )}
              {isRejected && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"
                  data-testid={`role-application-status-${roleType}`}
                >
                  <ExclamationCircleIcon className="h-3.5 w-3.5" />
                  已驳回
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">{meta.description}</p>

            {isPending && (
              <p className="mt-3 text-sm text-yellow-700">
                您已经提交了该角色申请，管理员审批通过后即可在这里切换。
              </p>
            )}

            {isRejected && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <p className="font-medium">上次申请未通过</p>
                <p className="mt-1">{approval?.rejection_reason || role?.role_specific_data?.['rejection_reason'] || '请补充资料后重新提交。'}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {isPending ? (
            <button
              type="button"
              onClick={() => navigate('/profile/role-approvals')}
              data-testid={`view-role-approval-${roleType}`}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              查看申请记录
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openApplicationModal(roleType)}
              disabled={loading}
              data-testid={`apply-role-${roleType}`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isRejected ? '重新提交申请' : `申请${meta.short_name}角色`}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (pageLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          正在加载角色信息...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="角色与切换"
        description="管理您已审批通过的身份，并申请新的角色权限。"
        breadcrumbs={[
          { label: "首页", href: "/" },
          { label: "个人中心" },
          { label: "角色与切换" },
        ]}
      />
      <div className="max-w-2xl">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            返回上一页
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-700">
            {success}
          </div>
        )}

        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-5" data-testid="current-role-panel">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
              <CurrentRoleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-700">当前角色</p>
              <p className="text-lg font-semibold text-blue-950">{currentRoleMeta.display_name}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {approvedRoles.map(renderRoleCard)}
        </div>

        {approvedRoles.length <= 1 && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6" data-testid="single-role-empty-state">
            <h2 className="text-lg font-semibold text-gray-900">暂无其他可切换角色</h2>
            <p className="mt-2 text-sm text-gray-500">
              您目前只有 1 个已审批角色。提交新角色申请并通过管理员审批后，就可以在这里切换身份。
            </p>
          </div>
        )}

        {actionableRoles.length > 0 && (
          <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              切换角色后，您将看到对应角色的专属功能和界面。
            </p>
          </div>
        )}

        {currentRole === 'admin' && applicationTargets.length > 0 && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4" data-testid="admin-role-approval-warning">
            <p className="text-sm font-medium text-amber-900">管理员申请业务角色后，需要由其他平台管理员审批。</p>
            <p className="mt-1 text-sm text-amber-800">
              为避免审批冲突，系统不允许管理员审批自己的角色申请。
            </p>
          </div>
        )}

        {applicationTargets.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">申请其他角色</h2>
            <div className="mt-4 space-y-4">
              {applicationTargets.map(renderApplicationCard)}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => navigate('/profile/role-approvals')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            查看我的角色申请记录
          </button>
        </div>
      </div>

      {applicationRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                申请{getRoleMeta(applicationRole).display_name}角色
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                请补充申请资料，管理员会基于这些信息进行审批。
              </p>
            </div>

            <div className="space-y-4">
              {applicationError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" data-testid="role-application-error">
                  {applicationError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  申请原因 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={applicationForm.application_reason}
                  onChange={(event) => setApplicationForm((prev) => ({ ...prev, application_reason: event.target.value }))}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="说明为什么需要这个角色权限，至少 10 个字"
                  data-testid="role-application-reason"
                />
              </div>

              {applicationRole === 'job_seeker' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">技能</label>
                    <input
                      value={applicationForm.skills_text}
                      onChange={(event) => setApplicationForm((prev) => ({ ...prev, skills_text: event.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="例如：React、Node.js、项目管理"
                      data-testid="role-application-skills"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">经验说明</label>
                    <textarea
                      value={applicationForm.professional_summary}
                      onChange={(event) => setApplicationForm((prev) => ({ ...prev, professional_summary: event.target.value }))}
                      rows={3}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="如果不填写技能，请用至少 10 个字说明相关经验"
                      data-testid="role-application-summary"
                    />
                  </div>
                </>
              )}

              {applicationRole === 'hr_recruiter' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      公司名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={applicationForm.company_name}
                      onChange={(event) => setApplicationForm((prev) => ({ ...prev, company_name: event.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="请输入公司名称"
                      data-testid="role-application-company"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      岗位/职能 <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={applicationForm.position}
                      onChange={(event) => setApplicationForm((prev) => ({ ...prev, position: event.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="例如：招聘经理、项目负责人"
                      data-testid="role-application-position"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setApplicationRole(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleApplyForRole(applicationRole)}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                data-testid="submit-role-application"
              >
                {loading ? '提交中...' : '提交申请'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSwitchPage;
