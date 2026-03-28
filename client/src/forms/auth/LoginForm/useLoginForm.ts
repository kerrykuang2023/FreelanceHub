import { ILoginPayload } from "@/interfaces/models";
import { useAuth } from "@/providers";
import useAuthStore from "@/stores/auth.store";
import { useFormik } from "formik";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

const FORM_INITIAL_VALUES = {
  email: "",
  password: "",
};

const useLoginForm = () => {
  const { login: setLogin } = useAuth();
  const navigate = useNavigate();
  const { loginError, login, clearLoginError } = useAuthStore((state) => ({
    login: state.login,
    loginError: state.loginError,
    clearLoginError: state.clearLoginError,
  }));

  const validationSchema = Yup.object({
    email: Yup.string()
      .required("Email is required")
      .email("Invalid email address"),
    password: Yup.string()
      .required("Password is required")
      .min(8, "Password must be at least 8 characters")
      .max(20, "Password must be at most 20 characters"),
  });

  const form = useFormik({
    initialValues: FORM_INITIAL_VALUES,
    validationSchema: validationSchema,
    validateOnChange: false,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setSubmitting(true);
        const payload: ILoginPayload = {
          email: values.email,
          password: values.password,
        };
        const response = await login(payload);
        const token = response?.data?.token || response?.token;
        const user = response?.data?.user || response?.user;
        const roles = response?.data?.roles || response?.roles || [];
        const activeRole = response?.data?.active_role || response?.active_role || null;
        
        if (token && user) {
          const userWithRoles = {
            ...user,
            roles: roles,
            active_role: activeRole,
          };
          await setLogin(token, userWithRoles);
          form.resetForm();
          setTimeout(() => {
            navigate("/");
          }, 150);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    return () => {
      clearLoginError();
    };
  }, [clearLoginError]);

  return {
    form,
    loginError,
  };
};

export default useLoginForm;
