import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Role {
  id: string;
  role_type: string;
  is_active: boolean;
  status: string;
}

interface RoleSwitcherProps {
  roles: Role[];
  activeRole: Role | null;
  onSwitchRole: (roleType: string) => Promise<void>;
  className?: string;
}

const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  roles,
  activeRole,
  onSwitchRole,
  className = '',
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const approvedRoles = roles.filter((r) => r.status === 'approved');

  const getRoleLabel = (roleType: string) => {
    const labels: Record<string, string> = {
      job_seeker: '求职者',
      hr_recruiter: 'HR招聘官',
      admin: '管理员',
    };
    return labels[roleType] || roleType;
  };

  const getRoleColor = (roleType: string) => {
    const colors: Record<string, string> = {
      job_seeker: 'bg-blue-500',
      hr_recruiter: 'bg-green-500',
      admin: 'bg-purple-500',
    };
    return colors[roleType] || 'bg-gray-500';
  };

  const handleSwitchRole = async (roleType: string) => {
    if (isSwitching) return;
    setIsSwitching(true);
    try {
      await onSwitchRole(roleType);
      navigate(0);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch role:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  if (approvedRoles.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        <span className={`px-2 py-1 text-xs text-white rounded ${getRoleColor(activeRole?.role_type || 'job_seeker')}`}>
          {getRoleLabel(activeRole?.role_type || 'job_seeker')}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-2">
            {approvedRoles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleSwitchRole(role.role_type)}
                disabled={isSwitching || role.is_active}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                  role.is_active ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs text-white rounded ${getRoleColor(role.role_type)}`}>
                    {getRoleLabel(role.role_type)}
                  </span>
                  {role.is_active && (
                    <span className="text-xs text-blue-600 font-medium">当前</span>
                  )}
                </div>
                {!role.is_active && (
                  <span className="text-xs text-gray-500">切换</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSwitcher;
