import { FC, ReactNode } from "react";
import Breadcrumb from "../Breadcrumb";
import type { BreadcrumbItem } from "../Breadcrumb";

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  showHome?: boolean;
}

const PageHeader: FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  showHome = true,
}) => {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-3">
          <Breadcrumb items={breadcrumbs} showHome={showHome} />
        </div>
      )}
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1 min-w-0">
          <h1 
            className="text-2xl font-bold text-gray-950 tracking-tight" 
            data-testid="page-title"
          >
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 text-sm text-gray-600 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
