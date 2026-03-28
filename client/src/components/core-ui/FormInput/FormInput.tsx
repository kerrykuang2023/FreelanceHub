import { InputHTMLAttributes, ReactNode, forwardRef } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, required, error, hint, icon, className = "", ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full
              px-4 py-3
              ${icon ? "pl-12" : ""}
              bg-gray-50
              border border-gray-200
              rounded-xl
              text-gray-900
              placeholder-gray-400
              focus:outline-none
              focus:ring-4 focus:ring-blue-500/20
              focus:border-blue-500
              ${error ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : ""}
              transition-all duration-200
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-sm text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

export default FormInput;
