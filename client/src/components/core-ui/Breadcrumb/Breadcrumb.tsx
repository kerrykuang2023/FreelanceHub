import { FC } from "react";
import { Link } from "react-router-dom";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

const Breadcrumb: FC<BreadcrumbProps> = ({ items, showHome = true }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
      {showHome && (
        <>
          <Link
            to="/dashboard"
            className="hover:text-gray-700 transition-colors"
          >
            <HomeIcon className="w-4 h-4" />
          </Link>
          <ChevronRightIcon className="w-4 h-4 text-gray-300" />
        </>
      )}
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          {item.href && index < items.length - 1 ? (
            <Link
              to={item.href}
              className="hover:text-gray-700 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
          {index < items.length - 1 && (
            <ChevronRightIcon className="w-4 h-4 text-gray-300" />
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb;
