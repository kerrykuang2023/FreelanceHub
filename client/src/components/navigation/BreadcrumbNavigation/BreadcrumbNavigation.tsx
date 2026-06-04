import { Link, useLocation } from "react-router-dom";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

const labelMap: Record<string, string> = {
  jobs: "项目列表",
  "my-jobs": "我的项目",
  "my-projects": "我的项目",
  applications: "我的申请",
  "post-job": "发布项目",
  "work-logs": "工时管理",
  invoices: "发票管理",
  profile: "个人资料",
  admin: "系统管理",
  users: "用户管理",
  freelancers: "顾问管理",
  companies: "企业审核",
  dashboard: "管理后台",
  company: "公司",
  pending: "待审核",
  review: "审核",
  new: "新建",
  edit: "编辑",
  verification: "身份验证",
  "switch-role": "切换角色",
  "role-approvals": "角色审批",
  credits: "积分记录",
  report: "举报",
  reports: "举报管理",
  configuration: "系统配置",
  config: "配置项管理",
  "skill-categories": "技能分类",
  "work-types": "工时类型",
  "tax-rates": "税率配置",
  currencies: "货币配置",
  languages: "语言要求",
  "job-natures": "工作性质",
  "work-formats": "工作形式",
  "rate-types": "计费类型",
  "invoice-types": "发票类型",
  "payment-methods": "付款方式",
  "saved-jobs": "收藏职位",
  messages: "消息",
  contracts: "合同管理",
  milestones: "里程碑",
  payments: "支付管理",
  tickets: "工单",
  ratings: "评价管理",
  "match-recommendations": "匹配推荐",
};

const hiddenPathSegments = new Set(["hr"]);

const pathLabelMap: Record<string, string> = {
  "/profile/switch-role": "角色与切换",
  "/profile/role-approvals": "我的角色申请",
  "/admin/role-approvals": "角色审批",
};

const BreadcrumbNavigation = () => {
  const location = useLocation();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split("/").filter(Boolean);

    if (pathSegments.length === 0) {
      return [{ label: "首页", href: "/", isCurrent: true }];
    }

    const breadcrumbs: BreadcrumbItem[] = [{ label: "首页", href: "/" }];

    pathSegments.forEach((segment, index) => {
      if (hiddenPathSegments.has(segment)) {
        return;
      }

      const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
      const fallbackLabel = segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
      const isCurrent = index === pathSegments.length - 1;

      breadcrumbs.push({
        label: pathLabelMap[path] || labelMap[segment] || fallbackLabel,
        href: isCurrent ? undefined : path,
        isCurrent,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav
      className="border-t border-gray-100 bg-gray-50/50"
      aria-label="Breadcrumb"
      data-testid="breadcrumb-navigation"
    >
      <ol className="mx-auto flex items-center px-4 sm:px-6 lg:px-8 py-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={`${breadcrumb.label}-${index}`} className="flex items-center" data-testid={`breadcrumb-item-${index}`}>
            {index > 0 && (
              <ChevronRightIcon
                className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mx-1.5"
                aria-hidden="true"
              />
            )}
            {index === 0 ? (
              <Link
                to={breadcrumb.href || "#"}
                className={`flex items-center ml-1.5 text-xs font-medium transition-colors ${
                  breadcrumb.isCurrent
                    ? "text-gray-900 font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                data-testid="breadcrumb-home"
              >
                <HomeIcon className="h-3.5 w-3.5 mr-1" />
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
  );
};

export default BreadcrumbNavigation;
