import { FC, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";
import { statCardColors } from "@/styles/design-tokens";

type StatCardColor = keyof typeof statCardColors;

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: StatCardColor;
  trend?: {
    value: number;
    label: string;
  };
  link?: string;
  onClick?: () => void;
}

const StatCard: FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = "blue",
  trend,
  link,
  onClick,
}) => {
  const colorConfig = statCardColors[color];

  const content = (
    <div
      data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className={`
        card group relative overflow-hidden
        ${link || onClick ? "cursor-pointer hover:scale-[1.02]" : ""}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="kpi-label truncate">{title}</p>
          <p className="kpi-value mt-2 animate-fade-in">{value}</p>
          
          {trend && (
            <div className="mt-4 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 text-sm font-medium ${
                  trend.value >= 0 ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {trend.value >= 0 ? (
                  <ArrowUpIcon className="w-4 h-4" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4" />
                )}
                <span>{Math.abs(trend.value)}%</span>
              </span>
              <span className="text-sm text-gray-500">{trend.label}</span>
            </div>
          )}
        </div>
        
        <div
          className={`
            flex-shrink-0 w-14 h-14 rounded-xl
            ${colorConfig.bg}
            flex items-center justify-center
            transition-transform duration-300 group-hover:scale-110
          `}
          style={{ opacity: 0.9 }}
        >
          <div className="w-7 h-7 text-white">
            {icon}
          </div>
        </div>
      </div>
      
      {(link || onClick) && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-50/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}
    </div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return content;
};

export default StatCard;
