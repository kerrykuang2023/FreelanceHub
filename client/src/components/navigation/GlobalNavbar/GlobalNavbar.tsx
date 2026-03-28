import { Fragment, useMemo, useState } from "react";
import {
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  Cog8ToothIcon,
  ArrowLeftStartOnRectangleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Dialog, Menu, Transition } from "@headlessui/react";
import { useAuth } from "@/providers";
import { Link, useLocation } from "react-router-dom";
import Logo from "@/components/core-ui/Logo";
import RoleSwitcher from "@/components/user/RoleSwitcher";
import { usePermissions } from "@/hooks/usePermissions";
import { MENU_CONFIG, CTA_CONFIG, ROLE_LABELS, ROLE_COLORS, MenuItem } from "@/constants/menuConfig";

const GlobalNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, logout, user, roles, activeRole, switchRole } = useAuth();
  const { currentRole, hasPermission } = usePermissions();
  const location = useLocation();

  const navigation: MenuItem[] = useMemo(() => {
    if (!isAuthenticated) return [];

    const roleMenu = MENU_CONFIG[currentRole] || [];
    
    const filterMenuByPermission = (items: MenuItem[]): MenuItem[] => {
      return items
        .filter(item => {
          if (!item.permission) return true;
          return hasPermission(item.permission as any);
        })
        .map(item => ({
          ...item,
          children: item.children ? filterMenuByPermission(item.children) : undefined,
        }));
    };

    return filterMenuByPermission(roleMenu);
  }, [isAuthenticated, currentRole, hasPermission]);

  const isActiveHref = (href?: string) => {
    if (!href) return false;
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  const renderNavItem = (item: MenuItem, level: number = 0) => {
    if (item.children) {
      return (
        <div key={item.key} className="relative group" data-testid={`menu-item-${item.key}`}>
          <button
            className={`flex items-center gap-x-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActiveHref(item.path)
                ? "text-indigo-600 bg-indigo-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {item.icon && <item.icon className="h-5 w-5" />}
            <span>{item.label}</span>
            <ChevronDownIcon className="h-4 w-4 ml-0.5 transition-transform duration-200 group-hover:rotate-180" />
          </button>
          <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-lg ring-1 ring-black/5 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            {item.children.map((child) => (
              <div key={child.key} className="relative group/sub">
                {child.children ? (
                  <>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {child.icon && <child.icon className="h-4 w-4" />}
                        {child.label}
                      </span>
                      <ChevronDownIcon className="h-3 w-3 -rotate-90" />
                    </button>
                    <div className="absolute left-full top-0 ml-2 w-56 bg-white rounded-xl shadow-lg ring-1 ring-black/5 py-2 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200">
                      {child.children.map((subChild) => (
                        <Link
                          key={subChild.key}
                          to={subChild.path || "#"}
                          className={`block px-4 py-2.5 text-sm ${
                            isActiveHref(subChild.path)
                              ? "text-indigo-600 bg-indigo-50"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          }`}
                          data-testid={`menu-item-${subChild.key}`}
                        >
                          {subChild.label}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link
                    to={child.path || "#"}
                    className={`block px-4 py-2.5 text-sm ${
                      isActiveHref(child.path)
                        ? "text-indigo-600 bg-indigo-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    data-testid={`menu-item-${child.key}`}
                  >
                    <span className="flex items-center gap-2">
                      {child.icon && <child.icon className="h-4 w-4" />}
                      {child.label}
                    </span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <Link
        key={item.key}
        to={item.path || "#"}
        className={`flex items-center gap-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
          isActiveHref(item.path)
            ? "text-indigo-600 bg-indigo-50"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}
        data-testid={`menu-item-${item.key}`}
      >
        {item.icon && <item.icon className="h-5 w-5" />}
        {item.label}
      </Link>
    );
  };

  const ctaConfig = CTA_CONFIG[currentRole] || CTA_CONFIG.job_seeker;

  return (
    <header 
      className="shrink-0 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50" 
      data-testid="global-navbar"
    >
      <nav
        className="page-container flex items-center justify-between h-16"
        aria-label="Global"
      >
        <div className="flex lg:flex-1" data-testid="navbar-logo">
          <Logo />
        </div>
        
        <div className="flex lg:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
            onClick={() => setMobileMenuOpen(true)}
            data-testid="mobile-menu-button"
          >
            <span className="sr-only">打开主菜单</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="hidden lg:flex lg:gap-x-1" data-testid="navbar-menu">
          {navigation.map((item) => (
            <div key={item.key} className="relative group">
              {renderNavItem(item)}
            </div>
          ))}
        </div>

        {isAuthenticated ? (
          <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-x-3">
            <button
              type="button"
              className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              data-testid="notification-button"
            >
              <span className="sr-only">查看通知</span>
              <BellIcon className="h-5 w-5" aria-hidden="true" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {roles && roles.length > 1 && (
              <RoleSwitcher
                roles={roles}
                activeRole={activeRole}
                onSwitchRole={switchRole}
              />
            )}

            {roles && roles.length === 1 && (
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${ROLE_COLORS[currentRole]}`}>
                {ROLE_LABELS[currentRole]}
              </span>
            )}

            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button 
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200" 
                  data-testid="user-avatar-button"
                >
                  {user?.user_image ? (
                    <img
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-100"
                      src={user.user_image}
                      alt=""
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                      {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-xl shadow-lg ring-1 ring-black/5 focus:outline-none py-2">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.first_name || user?.email?.split('@')[0] || '用户'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/profile"
                          className={`${
                            active ? "bg-gray-50" : ""
                          } flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700`}
                          data-testid="menu-profile"
                        >
                          <UserIcon className="h-5 w-5 text-gray-400" />
                          个人档案
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/profile/switch-role"
                          className={`${
                            active ? "bg-gray-50" : ""
                          } flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700`}
                          data-testid="menu-switch-role"
                        >
                          <Cog8ToothIcon className="h-5 w-5 text-gray-400" />
                          切换角色
                        </Link>
                      )}
                    </Menu.Item>
                  </div>
                  
                  <div className="border-t border-gray-100 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`${
                            active ? "bg-gray-50" : ""
                          } flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600`}
                          onClick={logout}
                          data-testid="menu-logout"
                        >
                          <ArrowLeftStartOnRectangleIcon className="h-5 w-5" />
                          退出登录
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
            
            <Link
              to={ctaConfig.path}
              className="btn-primary"
              data-testid="cta-button"
            >
              {ctaConfig.label}
            </Link>
          </div>
        ) : (
          <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-x-4">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
              data-testid="login-link"
            >
              登录
            </Link>
            <Link
              to="/register"
              className="btn-primary"
              data-testid="register-link"
            >
              注册
            </Link>
          </div>
        )}
      </nav>

      <Dialog
        as="div"
        className="lg:hidden"
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
      >
        <div className="fixed inset-0 z-10 bg-black/20 backdrop-blur-sm" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <div className="-m-1.5 p-1.5">
              <Logo />
            </div>
            <button
              type="button"
              className="rounded-lg p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">关闭菜单</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          {isAuthenticated && roles && roles.length > 1 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-xs font-medium text-gray-500 mb-3">切换角色</p>
              <div className="flex flex-wrap gap-2">
                {roles.filter(r => r.status === 'approved').map((role) => (
                  <button
                    key={role.id}
                    onClick={async () => {
                      if (!role.is_active) {
                        await switchRole(role.role_type);
                        setMobileMenuOpen(false);
                      }
                    }}
                    disabled={role.is_active}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                      role.is_active
                        ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {ROLE_LABELS[role.role_type as keyof typeof ROLE_LABELS] || role.role_type}
                    {role.is_active && ' (当前)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-100">
              <div className="space-y-1 py-6">
                {navigation.map((item) => (
                  <div key={item.key}>
                    {item.children ? (
                      <div>
                        <h3 className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {item.label}
                        </h3>
                        <div className="mt-1 space-y-1">
                          {item.children.map((child) => (
                            <div key={child.key}>
                              {child.children ? (
                                <div className="pl-3">
                                  <h4 className="px-3 py-1 text-xs font-medium text-gray-400">
                                    {child.label}
                                  </h4>
                                  {child.children.map((subChild) => (
                                    <Link
                                      key={subChild.key}
                                      to={subChild.path || "#"}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className={`block rounded-lg px-3 py-2.5 text-base font-medium ${
                                        isActiveHref(subChild.path)
                                          ? "text-indigo-600 bg-indigo-50"
                                          : "text-gray-700 hover:bg-gray-50"
                                      }`}
                                    >
                                      {subChild.label}
                                    </Link>
                                  ))}
                                </div>
                              ) : (
                                <Link
                                  to={child.path || "#"}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className={`block rounded-lg px-3 py-2.5 text-base font-medium ${
                                    isActiveHref(child.path)
                                      ? "text-indigo-600 bg-indigo-50"
                                      : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  {child.label}
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link
                        to={item.path || "#"}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium ${
                          isActiveHref(item.path)
                            ? "text-indigo-600 bg-indigo-50"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {item.icon && <item.icon className="h-5 w-5" />}
                        {item.label}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
              <div className="py-6">
                {!isAuthenticated ? (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      className="block rounded-lg px-3 py-2.5 text-base font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      登录
                    </Link>
                    <Link
                      to="/register"
                      className="block rounded-lg px-3 py-2.5 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      注册
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      个人档案
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-base font-medium text-red-600 hover:bg-red-50"
                    >
                      <ArrowLeftStartOnRectangleIcon className="h-5 w-5" />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  );
};

export default GlobalNavbar;
