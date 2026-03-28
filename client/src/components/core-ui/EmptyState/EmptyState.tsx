import { FC, ReactNode } from "react";
import { FolderIcon, MagnifyingGlassIcon, DocumentTextIcon, BriefcaseIcon, CurrencyDollarIcon, StarIcon, InboxIcon } from "@heroicons/react/24/outline";

interface EmptyStateProps {
  icon?: "folder" | "search" | "document" | "briefcase" | "currency" | "star" | "inbox" | ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

type IconKey = "folder" | "search" | "document" | "briefcase" | "currency" | "star" | "inbox";

const iconMap: Record<IconKey, React.ComponentType<{ className?: string }>> = {
  folder: FolderIcon,
  search: MagnifyingGlassIcon,
  document: DocumentTextIcon,
  briefcase: BriefcaseIcon,
  currency: CurrencyDollarIcon,
  star: StarIcon,
  inbox: InboxIcon,
};

const iconColors: Record<IconKey, string> = {
  folder: "from-gray-400 to-gray-500",
  search: "from-blue-400 to-blue-500",
  document: "from-purple-400 to-purple-500",
  briefcase: "from-green-400 to-green-500",
  currency: "from-amber-400 to-amber-500",
  star: "from-yellow-400 to-yellow-500",
  inbox: "from-indigo-400 to-indigo-500",
};

const EmptyState: FC<EmptyStateProps> = ({
  icon = "folder",
  title,
  description,
  action,
}) => {
  const iconKey = (typeof icon === "string" ? icon : "folder") as IconKey;
  const IconComponent = typeof icon === "string" ? iconMap[iconKey] : null;
  const gradientClass = typeof icon === "string" ? iconColors[iconKey] : "from-gray-400 to-gray-500";

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center mb-6 shadow-lg`}>
        {IconComponent ? (
          <IconComponent className="h-10 w-10 text-white" />
        ) : (
          typeof icon !== "string" && icon
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
