import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCircleIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  ArrowRightOnRectangleIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import httpService from '@/core/http.service';
import { useAuth } from '@/providers';

interface UserRole {
  _id: string;
  user_type_name: string;
  display_name: string;
  icon: React.ElementType;
  description: string;
}

const availableRoles: UserRole[] = [
  {
    _id: 'freelancer',
    user_type_name: 'freelancer',
    display_name: '顾问/自由职业者',
    icon: UserCircleIcon,
    description: '提供专业服务，寻找项目机会',
  },
  {
    _id: 'company',
    user_type_name: 'company_user',
    display_name: '企业/HR',
    icon: BuildingOfficeIcon,
    description: '发布项目需求，管理顾问资源',
  },
  {
    _id: 'admin',
    user_type_name: 'admin',
    display_name: '平台管理员',
    icon: ShieldCheckIcon,
    description: '管理平台运营，审核内容',
  },
];

const RoleSwitchPage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const userTypeName = typeof user.user_type_id === 'object' 
        ? user.user_type_id.user_type_name 
        : user.user_type_name || '';
      setCurrentRole(userTypeName);
    }
  }, [user]);

  const handleRoleSwitch = async (roleName: string) => {
    if (roleName === currentRole) return;

    try {
      setLoading(true);
      setError(null);

      const response = await httpService.post('/auth/switch-role', {
        role: roleName,
      });

      const updatedUser = (response as any).user;
      if (updatedUser && setUser) {
        setUser(updatedUser);
        const newUserTypeName = typeof updatedUser.user_type_id === 'object'
          ? updatedUser.user_type_id.user_type_name
          : updatedUser.user_type_name || '';
        setCurrentRole(newUserTypeName);
      }

      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err: any) {
      console.error('Failed to switch role:', err);
      setError(err.response?.data?.message || 'Failed to switch role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">切换角色</h1>
          <p className="mt-2 text-gray-600">选择您当前想要使用的角色身份</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {availableRoles.map((role) => {
            const IconComponent = role.icon;
            const isActive = currentRole === role.user_type_name;

            return (
              <button
                key={role._id}
                onClick={() => handleRoleSwitch(role.user_type_name)}
                disabled={loading || isActive}
                className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                  isActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`w-7 h-7 ${
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-lg font-semibold ${
                        isActive ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {role.display_name}
                      </h3>
                      {isActive && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          当前角色
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {role.description}
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
          })}
        </div>

        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>提示：</strong> 切换角色后，您将看到对应角色的专属功能和界面。您可以随时切换回其他角色。
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700"
          >
            返回上一页
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSwitchPage;
