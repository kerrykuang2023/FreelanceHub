import { Fragment, useMemo, useState } from "react";
import {
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  Cog8ToothIcon,
  ArrowLeftStartOnRectangleIcon,
  BookmarkIcon,
  ServerStackIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Dialog, Menu, Transition } from "@headlessui/react";
import { useAuth } from "@/providers";
import { Link, useLocation } from "react-router-dom";
import Logo from "@/components/core-ui/Logo";
import RoleSwitcher from "@/components/user/RoleSwitcher";

interface NavItem {
  name: string;
  href?: string;
  icon?: any;
  children?: NavItem[];
  roles?: string[];
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

const UnifiedHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, logout, user, roles, activeRole, switchRole } = useAuth();
  const location = useLocation();

  const currentRoleType = activeRole?.role_type || user?.user_type_name || 'job_seeker';
  const isAdmin = currentRoleType === 'admin';
  const isHR = currentRoleType === 'hr_recruiter';
  const isJobSeeker = currentRoleType === 'job_seeker';

  const allNavItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      { 
        name: "首页", 
        href: "/", 
        icon: HomeIcon,
        roles: ['job_seeker', 'hr_recruiter', 'admin']
      },
      { 
        name: "我的项目", 
        href: "/my-projects", 
        icon: BriefcaseIcon,
        roles: ['job_seeker', 'hr_recruiter', 'admin']
      },
      { 
        name: "浏览项目", 
        href: "/jobs", 
        icon: BriefcaseIcon,
        roles: ['job_seeker', 'freelancer']
      },
      { 
        name: "我的申请", 
        href: "/applications", 
        icon: DocumentTextIcon,
        roles: ['job_seeker', 'freelancer']
      },
      { 
        name: "收藏职位", 
        href: "/saved-jobs", 
        icon: BookmarkIcon,
        roles: ['job_seeker', 'freelancer']
      },
      { 
        name: "发布职位", 
        href: "/post-job", 
        icon: BriefcaseIcon,
        roles: ['hr_recruiter', 'admin']
      },
      { 
        name: "申请管理", 
        href: "/company/applications", 
        icon: UserGroupIcon,
        roles: ['hr_recruiter', 'admin']
      },
      { 
        name: "工时管理", 
        href: "/work-logs", 
        icon: ClipboardDocumentListIcon,
        roles: ['job_seeker', 'freelancer', 'hr_recruiter', 'admin']
      },
      { 
        name: "发票管理", 
        href: "/invoices", 
        icon: DocumentTextIcon,
        roles: ['job_seeker', 'freelancer', 'hr_recruiter', 'admin']
      },
      { 
        name: "消息", 
        href: "/messages", 
        icon: ChatBubbleLeftRightIcon,
        roles: ['job_seeker', 'hr_recruiter', 'admin']
      },
    ];

    return items;
  }, []);

  const adminNav: NavItem[] = useMemo(() => {
    if (!isAdmin) return [];
    
    return [
      { name: "管理后台", href: "/admin/dashboard" },
      { name: "用户管理", href: "/admin/users" },
      { name: "角色审批", href: "/admin/role-approvals" },
      { name: "企业审核", href: "/admin/companies" },
      { name: "工时管理", href: "/admin/worklogs" },
      { name: "发票管理", href: "/admin/invoices" },
      { name: "项目管理", href: "/admin/projects" },
      { name: "举报管理", href: "/admin/reports" },
    ];
  }, [isAdmin]);

  const configNav: NavItem[] = useMemo(() => {
    if (!isAdmin) return [];
    
    return [
      { name: "技能分类", href: "/admin/config/skill-categories" },
      { name: "工时类型", href: "/admin/config/work-types" },
      { name: "税率配置", href: "/admin/config/tax-rates" },
      { name: "货币配置", href: "/admin/config/currencies" },
      { name: "语言要求", href: "/admin/config/languages" },
      { name: "工作性质", href: "/admin/config/job-natures" },
      { name: "工作形式", href: "/admin/config/work-formats" },
      { name: "计费类型", href: "/admin/config/rate-types" },
      { name: "发票类型", href: "/admin/config/invoice-types" },
      { name: "付款方式", href: "/admin/config/payment-methods" },
    ];
  }, [isAdmin]);

  const navigation: NavItem[] = useMemo(() => {
    if (!isAuthenticated) return [];

    const filteredNav = allNavItems.filter(item => 
      !item.roles || item.roles.includes(currentRoleType)
    );

    if (isAdmin) {
      return [
        ...filteredNav,
        {
          name: "系统管理",
          href: "/admin/dashboard",
          icon: ServerStackIcon,
          children: [
            ...adminNav,
            { name: "系统配置", href: "/admin/configuration" },
            {
              name: "配置项管理",
              children: configNav,
            },
          ],
        },
      ];
    }

    return filteredNav;
  }, [isAuthenticated, currentRoleType, allNavItems, isAdmin, adminNav, configNav]);

  const isActiveHref = (href?: string) => {
    if (!href) return false;
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    
    if (pathSegments.length === 0) {
      return [{ label: "首页", href: "/", isCurrent: true }];
    }

    const breadcrumbs: BreadcrumbItem[] = [];
    
    breadcrumbs.push({ label: "首页", href: "/" });

    pathSegments.forEach((segment, index) => {
      const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
      let label = segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      
      const labelMap: Record<string, string> = {
        "jobs": "项目列表",
        "my-jobs": "我的项目",
        "my-projects": "我的项目",
        "applications": "我的申请",
        "post-job": "发布项目",
        "work-logs": "工时管理",
        "invoices": "发票管理",
        "profile": "个人资料",
        "admin": "管理后台",
        "users": "用户管理",
        "freelancers": "顾问管理",
        "companies": "公司管理",
        "dashboard": "控制台",
        "company": "公司",
        "pending": "待审核",
        "review": "审核",
        "new": "新建",
        "edit": "编辑",
      };
      
      label = labelMap[segment] || label;
      
      const isCurrent = index === pathSegments.length - 1;
      breadcrumbs.push({
        label,
        href: isCurrent ? undefined : path,
        isCurrent,
      });
    });

    return breadcrumbs;
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    if (item.children) {
      return (
        <div key={item.name} className="relative group">
          <button
            className={`flex items-center gap-x-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
              isActiveHref(item.href)
                ? "text-indigo-600 bg-indigo-50"
                : level === 0
                ? "text-gray-900 hover:text-indigo-600 hover:bg-gray-50"
                : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
            }`}
          >
            {item.icon && <item.icon className="h-5 w-5" />}
            <span>{item.name}</span>
            <ChevronDownIcon className="h-4 w-4" />
          </button>
          <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black/5 py-1 z-50 hidden group-hover:block">
            {item.children.map((child) => (
              <div key={child.name} className="relative group/sub">
                {child.children ? (
                  <>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50 flex items-center justify-between">
                      {child.icon && <child.icon className="h-4 w-4 mr-2" />}
                      {child.name}
                      <ChevronDownIcon className="h-3 w-3 rotate-90" />
                    </button>
                    <div className="absolute left-full top-0 ml-1 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black/5 py-1 hidden group-hover/sub:block">
                      {child.children.map((subChild) => (
                        <Link
                          key={subChild.name}
                          to={subChild.href || "#"}
                          className={`block px-4 py-2 text-sm ${
                            isActiveHref(subChild.href)
                              ? "text-indigo-600 bg-indigo-50"
                              : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                          }`}
                        >
                          {subChild.name}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link
                    to={child.href || "#"}
                    className={`block px-4 py-2 text-sm ${
                      isActiveHref(child.href)
                        ? "text-indigo-600 bg-indigo-50"
                        : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                    }`}
                  >
                    {child.icon && <child.icon className="h-4 w-4 mr-2 inline" />}
                    {child.name}
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
        key={item.name}
        to={item.href || "#"}
        className={`flex items-center gap-x-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
          isActiveHref(item.href)
            ? "text-indigo-600 bg-indigo-50"
            : "text-gray-900 hover:text-indigo-600 hover:bg-gray-50"
        }`}
      >
        {item.icon && <item.icon className="h-5 w-5" />}
        {item.name}
      </Link>
    );
  };

  const getRoleBadgeColor = () => {
    switch (currentRoleType) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'hr_recruiter':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getRoleLabel = () => {
    switch (currentRoleType) {
      case 'admin':
        return '管理员';
      case 'hr_recruiter':
        return 'HR 招聘官';
      default:
        return '求职者';
    }
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="shrink-0 border-b border-gray-200 bg-white sticky top-0 z-50">
      {/* Main Navigation Bar */}
      <nav
        className="mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3"
        aria-label="Global"
      >
        <div className="flex lg:flex-1">
          <Logo />
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-2">
          {navigation.map((item) => (
            <div key={item.name} className="relative group">
              {renderNavItem(item)}
            </div>
          ))}
        </div>
        {isAuthenticated ? (
          <div className="hidden lg:flex lg:flex-1 lg:justify-end flex items-center gap-x-4">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </button>

            {roles && roles.length > 1 && (
              <RoleSwitcher
                roles={roles}
                activeRole={activeRole}
                onSwitchRole={switchRole}
              />
            )}

            {roles && roles.length === 1 && (
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor()}`}>
                {getRoleLabel()}
              </span>
            )}

            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="flex items-center">
                  {user?.user_image ? (
                    <img
                      className="h-8 w-8 rounded-full bg-gray-800 object-cover"
                      src={user.user_image}
                      alt=""
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
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
                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                  <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/profile"
                          className={`${
                            active
                              ? "bg-indigo-500 text-white"
                              : "text-gray-900"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                          {active ? (
                            <UserIcon className="h-5 w-5 mr-2" />
                          ) : (
                            <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
                          )}
                          个人档案
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/profile?tab=settings"
                          className={`${
                            active
                              ? "bg-indigo-500 text-white"
                              : "text-gray-900"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                          {active ? (
                            <Cog8ToothIcon className="h-5 w-5 mr-2" />
                          ) : (
                            <Cog8ToothIcon className="h-5 w-5 mr-2 text-gray-400" />
                          )}
                          设置
                        </Link>
                      )}
                    </Menu.Item>
                  </div>
                  <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`${
                            active
                              ? "bg-indigo-500 text-white"
                              : "text-gray-900"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                          onClick={logout}
                        >
                          {active ? (
                            <ArrowLeftStartOnRectangleIcon className="h-5 w-5 mr-2" />
                          ) : (
                            <ArrowLeftStartOnRectangleIcon className="h-5 w-5 mr-2 text-gray-400" />
                          )}
                          退出登录
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
            <Link
              to={isHR ? "/post-job" : "/jobs"}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {isHR ? "发布职位" : "找工作"}
            </Link>
          </div>
        ) : (
          <div className="hidden lg:flex lg:flex-1 lg:justify-end flex items-center gap-x-8">
            <Link
              to="/login"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              登录
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              注册
            </Link>
          </div>
        )}
      </nav>

      {/* Breadcrumb Bar - Optimized spacing */}
      {breadcrumbs.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          <nav
            className="mx-auto flex items-center px-4 sm:px-6 lg:px-8 py-2"
            aria-label="Breadcrumb"
          >
            <ol className="flex items-center space-x-1.5">
              {breadcrumbs.map((breadcrumb, index) => (
                <li key={breadcrumb.label} className="flex items-center">
                  {index > 0 && (
                    <ChevronRightIcon 
                      className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" 
                      aria-hidden="true" 
                    />
                  )}
                  {index === 0 ? (
                    <Link 
                      to={breadcrumb.href || "#"} 
                      className={`ml-1.5 text-xs font-medium transition-colors ${
                        breadcrumb.isCurrent
                          ? "text-gray-900 font-semibold"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {breadcrumb.label}
                    </Link>
                  ) : (
                    <span className="ml-1.5">
                      {breadcrumb.isCurrent ? (
                        <span className="text-xs font-medium text-gray-900 font-semibold">
                          {breadcrumb.label}
                        </span>
                      ) : (
                        <Link
                          to={breadcrumb.href || "#"}
                          className="text-xs font-medium text-gray-500 hover:text-gray-700"
                        >
                          {breadcrumb.label}
                        </Link>
                      )}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      )}

      {/* Mobile Menu */}
      <Dialog
        as="div"
        className="lg:hidden"
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
      >
        <div className="fixed inset-0 z-10" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <div className="-m-1.5 p-1.5">
              <span className="sr-only">FreelanceHub</span>
              <Logo />
            </div>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          {isAuthenticated && roles && roles.length > 1 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">切换角色</p>
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
                    className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                      role.is_active
                        ? 'bg-indigo-100 text-indigo-800 ring-2 ring-indigo-500'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {role.role_type === 'admin' ? '管理员' : 
                     role.role_type === 'hr_recruiter' ? 'HR 招聘官' : '求职者'}
                    {role.is_active && ' (当前)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <div key={item.name}>
                    {item.children ? (
                      <div>
                        <h3 className="px-3 py-2 text-sm font-semibold text-gray-900">
                          {item.name}
                        </h3>
                        <div className="mt-1 space-y-1">
                          {item.children.map((child) => (
                            <div key={child.name}>
                              {child.children ? (
                                <div className="pl-4">
                                  <h4 className="px-3 py-1 text-xs font-medium text-gray-500">
                                    {child.name}
                                  </h4>
                                  {child.children.map((subChild) => (
                                    <Link
                                      key={subChild.name}
                                      to={subChild.href || "#"}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className={`block rounded-lg px-3 py-2 text-base font-semibold leading-7 ${
                                        isActiveHref(subChild.href)
                                          ? "text-indigo-600 bg-indigo-50"
                                          : "text-gray-900 hover:bg-gray-50"
                                      }`}
                                    >
                                      {subChild.name}
                                    </Link>
                                  ))}
                                </div>
                              ) : (
                                <Link
                                  to={child.href || "#"}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className={`block rounded-lg px-3 py-2 text-base font-semibold leading-7 ${
                                    isActiveHref(child.href)
                                      ? "text-indigo-600 bg-indigo-50"
                                      : "text-gray-900 hover:bg-gray-50"
                                  }`}
                                >
                                  {child.name}
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link
                        to={item.href || "#"}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-x-2 rounded-lg px-3 py-2 text-base font-semibold leading-7 ${
                          isActiveHref(item.href)
                            ? "text-indigo-600 bg-indigo-50"
                            : "text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        {item.icon && <item.icon className="h-5 w-5" />}
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
              <div className="py-6">
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/login"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      登录
                    </Link>
                    <Link
                      to="/register"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      注册
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/profile"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      个人档案
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 w-full text-left"
                    >
                      退出登录
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  );
};

export default UnifiedHeader;
