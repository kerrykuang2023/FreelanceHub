import Logo from "@/components/core-ui/Logo";
import PublicLayout from "@/components/layouts/public/PublicLayout";
import LoginForm from "@/forms/auth/LoginForm";
import { Link } from "react-router-dom";

const LoginPage = () => {
  return (
    <PublicLayout title="登录">
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <Logo />
              </div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">
                欢迎回来
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                登录您的账户继续操作
              </p>
            </div>

            <LoginForm />

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                还没有账户？{" "}
                <Link
                  to="/register"
                  className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  立即注册
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              © 2024 JobPortal. 保留所有权利。
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default LoginPage;
