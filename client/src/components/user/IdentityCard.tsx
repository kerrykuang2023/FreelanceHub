import React from 'react';
import { useAuth } from '@/providers/AuthProvider/AuthProvider';

interface RoleBadgeProps {
  roleType: string;
  isActive?: boolean;
  status?: string;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ roleType, isActive, status }) => {
  const getRoleLabel = (type: string) => {
    const labels: Record<string, string> = {
      job_seeker: '求职者',
      hr_recruiter: 'HR招聘官',
      admin: '管理员',
    };
    return labels[type] || type;
  };

  const getRoleColor = (type: string) => {
    const colors: Record<string, string> = {
      job_seeker: 'bg-blue-100 text-blue-800 border-blue-300',
      hr_recruiter: 'bg-green-100 text-green-800 border-green-300',
      admin: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusBadge = () => {
    if (status === 'pending') {
      return (
        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
          审批中
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
          已拒绝
        </span>
      );
    }
    if (isActive) {
      return (
        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
          当前
        </span>
      );
    }
    return null;
  };

  return (
    <div
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getRoleColor(
        roleType
      )} ${isActive ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
    >
      {getRoleLabel(roleType)}
      {getStatusBadge()}
    </div>
  );
};

interface IdentityCardProps {
  className?: string;
}

const IdentityCard: React.FC<IdentityCardProps> = ({ className = '' }) => {
  const { user, roles, activeRole, switchRole } = useAuth();

  if (!user) {
    return null;
  }

  const getRoleIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      job_seeker: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      hr_recruiter: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      admin: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    };
    return icons[type] || icons.job_seeker;
  };

  const handleSwitchRole = async (roleType: string) => {
    try {
      await switchRole(roleType);
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch role:', error);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="relative">
          {user.user_image ? (
            <img
              src={user.user_image}
              alt={`${user.first_name} ${user.last_name}`}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
              {user.first_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </div>
          )}
          {activeRole && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center">
              {getRoleIcon(activeRole.role_type)}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {user.first_name} {user.last_name}
          </h3>
          <p className="text-sm text-gray-500">{user.email}</p>
          
          {activeRole && (
            <div className="mt-2">
              <RoleBadge roleType={activeRole.role_type} isActive={true} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">已注册角色</h4>
        <div className="space-y-2">
          {roles && roles.length > 0 ? (
            roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center">
                    {getRoleIcon(role.role_type)}
                  </div>
                  <RoleBadge
                    roleType={role.role_type}
                    isActive={role.is_active}
                    status={role.status}
                  />
                </div>
                {role.status === 'approved' && !role.is_active && (
                  <button
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    onClick={() => handleSwitchRole(role.role_type)}
                  >
                    切换
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">暂无角色信息</p>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
          + 申请新角色
        </button>
      </div>
    </div>
  );
};

export { IdentityCard, RoleBadge };
export default IdentityCard;
