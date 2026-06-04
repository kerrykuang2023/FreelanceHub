import { EyeIcon } from "@heroicons/react/24/outline";
import useRegisterForm from "./useRegisterForm";
import TermsAndConditionsDialog from "@/components/dialogs/TermsAndConditionsDialog";
import FieldError from "@/components/core-ui/FieldError";
import Alert from "@/components/core-ui/Alert";

const RegisterForm = () => {
  const {
    form,
    registerSuccessMessage,
    registerErrorMessage,
    termsConditionsModalOpen,
    handleOnOpenTermsConditionsModal,
    handleOnCloseTermsConditionsModal,
  } = useRegisterForm();
  const validationErrors = Object.values(form.errors).filter(Boolean);

  return (
    <>
      {registerSuccessMessage && (
        <div className="mb-4">
          <Alert type="success" message={registerSuccessMessage} />
        </div>
      )}
      {registerErrorMessage && (
        <div className="mb-4">
          <Alert type="error" message={registerErrorMessage} />
        </div>
      )}
      {form.submitCount > 0 && validationErrors.length > 0 && (
        <div className="mb-4" data-testid="register-validation-summary">
          <Alert
            type="error"
            message={`请先修正以下信息：${validationErrors.join("；")}`}
          />
        </div>
      )}
      <form onSubmit={form.handleSubmit} className="space-y-6" noValidate>
        <div>
          <label
            htmlFor="user_type_name"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            注册身份
            <span className="text-red-500">*</span>
          </label>
          <select
            id="user_type_name"
            name="user_type_name"
            data-testid="role-select"
            className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            disabled={form.isSubmitting}
            value={form.values.user_type_name}
            onChange={(e) =>
              form.setFieldValue("user_type_name", e.target.value)
            }
          >
            <option value="job_seeker">顾问/求职者</option>
            <option value="hr_recruiter">企业/HR</option>
          </select>
          {form.errors.user_type_name && (
            <FieldError error={form.errors.user_type_name} />
          )}
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            姓名
            <span className="text-red-500">*</span>
          </label>
          <div className="mt-2">
            <input
              id="name"
              name="name"
              type="text"
              data-testid="name-input"
              autoComplete="name"
              required
              className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              value={form.values.name || ""}
              disabled={form.isSubmitting}
              onChange={form.handleChange}
            />
            {form.errors.name && <FieldError error={form.errors.name} />}
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            邮箱地址
            <span className="text-red-500">*</span>
          </label>
          <div className="mt-2">
            <input
              id="email"
              name="email"
              type="email"
              data-testid="email-input"
              autoComplete="email"
              required
              className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              value={form.values.email}
              disabled={form.isSubmitting}
              onChange={form.handleChange}
            />
            {form.errors.email && <FieldError error={form.errors.email} />}
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            密码
            <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-2 rounded-md shadow-sm">
            <input
              id="password"
              name="password"
              type="password"
              data-testid="password-input"
              className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              value={form.values.password}
              onChange={form.handleChange}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <EyeIcon className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          {form.errors.password && <FieldError error={form.errors.password} />}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            确认密码
            <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-2 rounded-md shadow-sm">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              data-testid="confirm-password-input"
              className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              value={form.values.confirmPassword}
              disabled={form.isSubmitting}
              onChange={form.handleChange}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <EyeIcon className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          {form.errors.confirmPassword && (
            <FieldError error={form.errors.confirmPassword} />
          )}
        </div>

        <div className="flex justify-between flex-col">
          <div className="flex items-center">
            <input
              id="termsConditions"
              name="termsConditions"
              type="checkbox"
              data-testid="terms-checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              checked={form.values.termsConditions}
              onChange={(e) =>
                form.setFieldValue("termsConditions", e.target.checked)
              }
            />
            <label
              htmlFor="termsConditions"
              className="ml-3 block text-sm leading-6 text-gray-700"
            >
              我已阅读并同意{" "}
              <a
                href="#"
                className="font-semibold text-indigo-600 hover:text-indigo-500"
                onClick={handleOnOpenTermsConditionsModal}
              >
                服务条款
              </a>
            </label>
          </div>
          {form.errors.termsConditions && (
            <FieldError error={form.errors.termsConditions} />
          )}
        </div>

        <div>
          <button
            type="submit"
            data-testid="register-submit-btn"
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            disabled={form.isSubmitting}
          >
            {form.isSubmitting ? "正在注册..." : "注册"}
          </button>
        </div>
      </form>
      <TermsAndConditionsDialog
        open={termsConditionsModalOpen}
        onClose={handleOnCloseTermsConditionsModal}
      />
    </>
  );
};

export default RegisterForm;
