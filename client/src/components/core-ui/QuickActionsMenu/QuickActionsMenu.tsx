import { Link } from "react-router-dom";
import {
  BanknotesIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ClockIcon,
  CogIcon,
  CurrencyDollarIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/providers";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  bgColor: string;
  hoverBgColor: string;
  roles: string[];
  description?: string;
}

const allMenuItems: MenuItem[] = [
  {
    id: "post-job",
    label: "发布项目",
    icon: <PlusCircleIcon className="w-8 h-8" />,
    href: "/post-job",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    hoverBgColor: "hover:bg-blue-100",
    roles: ["hr_recruiter", "admin"],
    description: "发布新的项目需求",
  },
  {
    id: "my-jobs",
    label: "我的项目",
    icon: <BriefcaseIcon className="w-8 h-8" />,
    href: "/my-jobs",
    color: "text-green-600",
    bgColor: "bg-green-50",
    hoverBgColor: "hover:bg-green-100",
    roles: ["hr_recruiter", "admin"],
    description: "管理已发布的项目",
  },
  {
    id: "review-worklogs",
    label: "审核工时",
    icon: <ClockIcon className="w-8 h-8" />,
    href: "/company/work-logs/pending",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    hoverBgColor: "hover:bg-orange-100",
    roles: ["hr_recruiter", "admin"],
    description: "审核顾问工时记录",
  },
  {
    id: "applications-received",
    label: "管理申请",
    icon: <UsersIcon className="w-8 h-8" />,
    href: "/company/applications",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    hoverBgColor: "hover:bg-purple-100",
    roles: ["hr_recruiter", "admin"],
    description: "查看和处理申请",
  },
  {
    id: "log-work",
    label: "填报工时",
    icon: <PlusCircleIcon className="w-8 h-8" />,
    href: "/work-logs/new",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    hoverBgColor: "hover:bg-blue-100",
    roles: ["job_seeker", "freelancer"],
    description: "记录工作时间",
  },
  {
    id: "my-worklogs",
    label: "我的工时",
    icon: <ClockIcon className="w-8 h-8" />,
    href: "/work-logs",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    hoverBgColor: "hover:bg-cyan-100",
    roles: ["job_seeker", "freelancer"],
    description: "查看工时记录",
  },
  {
    id: "browse-jobs",
    label: "浏览项目",
    icon: <BriefcaseIcon className="w-8 h-8" />,
    href: "/jobs",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    hoverBgColor: "hover:bg-purple-100",
    roles: ["job_seeker", "freelancer"],
    description: "发现新机会",
  },
  {
    id: "my-applications",
    label: "我的申请",
    icon: <DocumentTextIcon className="w-8 h-8" />,
    href: "/applications",
    color: "text-green-600",
    bgColor: "bg-green-50",
    hoverBgColor: "hover:bg-green-100",
    roles: ["job_seeker", "freelancer"],
    description: "查看申请状态",
  },
  {
    id: "invoices",
    label: "发票管理",
    icon: <CurrencyDollarIcon className="w-8 h-8" />,
    href: "/invoices",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    hoverBgColor: "hover:bg-amber-100",
    roles: ["job_seeker", "freelancer", "hr_recruiter", "admin"],
    description: "管理发票",
  },
  {
    id: "profile",
    label: "个人档案",
    icon: <DocumentDuplicateIcon className="w-8 h-8" />,
    href: "/profile",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    hoverBgColor: "hover:bg-indigo-100",
    roles: ["job_seeker", "freelancer"],
    description: "完善个人资料",
  },
  {
    id: "admin-users",
    label: "用户管理",
    icon: <UserGroupIcon className="w-8 h-8" />,
    href: "/admin/users",
    color: "text-red-600",
    bgColor: "bg-red-50",
    hoverBgColor: "hover:bg-red-100",
    roles: ["admin"],
    description: "管理系统用户",
  },
  {
    id: "admin-companies",
    label: "公司管理",
    icon: <BuildingOfficeIcon className="w-8 h-8" />,
    href: "/admin/companies",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    hoverBgColor: "hover:bg-teal-100",
    roles: ["admin"],
    description: "管理公司信息",
  },
  {
    id: "admin-reports",
    label: "数据报表",
    icon: <ChartBarIcon className="w-8 h-8" />,
    href: "/admin/reports",
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    hoverBgColor: "hover:bg-violet-100",
    roles: ["admin"],
    description: "查看统计数据",
  },
  {
    id: "admin-financial",
    label: "财务管理",
    icon: <BanknotesIcon className="w-8 h-8" />,
    href: "/admin?tab=financial",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    hoverBgColor: "hover:bg-emerald-100",
    roles: ["admin"],
    description: "管理财务数据",
  },
  {
    id: "company-setup",
    label: "公司设置",
    icon: <CogIcon className="w-8 h-8" />,
    href: "/company",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    hoverBgColor: "hover:bg-gray-100",
    roles: ["hr_recruiter"],
    description: "配置公司信息",
  },
];

interface QuickActionsMenuProps {
  title?: string;
  maxItems?: number;
  className?: string;
  showDescription?: boolean;
}

const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  title = "快捷操作",
  maxItems = 8,
  className = "",
  showDescription = false,
}) => {
  const { user, activeRole } = useAuth();
  const currentRoleType = activeRole?.role_type || user?.user_type_name || "job_seeker";
  const filteredMenuItems = allMenuItems
    .filter((item) => item.roles.includes(currentRoleType))
    .slice(0, maxItems);

  if (filteredMenuItems.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filteredMenuItems.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            data-testid={`quick-action-${item.id}`}
            className={`flex flex-col items-center p-4 ${item.bgColor} rounded-xl ${item.hoverBgColor} transition-all duration-200 hover:shadow-md group`}
          >
            <div className={`${item.color} mb-2 group-hover:scale-110 transition-transform duration-200`}>
              {item.icon}
            </div>
            <span className="text-sm font-medium text-gray-900">{item.label}</span>
            {showDescription && item.description && (
              <span className="text-xs text-gray-500 mt-1 text-center">{item.description}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsMenu;
