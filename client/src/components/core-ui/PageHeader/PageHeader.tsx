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
    <div className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-4">
          <Breadcrumb items={breadcrumbs} showHome={showHome} />
        </div>
      )}
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 
            className="text-2xl font-bold text-gray-900 tracking-tight" 
            data-testid="page-title"
          >
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-gray-600 leading-relaxed max-w-2xl">
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
