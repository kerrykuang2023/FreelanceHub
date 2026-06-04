import { IRegisterPayload } from "@/interfaces/models";
import { useAuth } from "@/providers";
import useAuthStore from "@/stores/auth.store";
import { useFormik } from "formik";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

const FORM_INITIAL_VALUES = {
  user_type_name: "job_seeker",
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  termsConditions: false,
};

const useRegisterForm = () => {
  const navigate = useNavigate();
  const { login: setLogin } = useAuth();
  const {
    registerSuccessMessage,
    registerErrorMessage,
    termsConditionsModalOpen,
    setTermsConditionsModalOpen,
    register,
    clearRegisterMessages,
  } = useAuthStore((state) => ({
    registerSuccessMessage: state.registerSuccessMessage,
    registerErrorMessage: state.registerErrorMessage,
    termsConditionsModalOpen: state.termsConditionsModalOpen,
    setTermsConditionsModalOpen: state.setTermsConditionsModalOpen,
    register: state.register,
    clearRegisterMessages: state.clearRegisterMessages,
  }));

  const validationSchema = Yup.object({
    user_type_name: Yup.string()
      .required("请选择注册角色")
      .oneOf(["job_seeker", "hr_recruiter"], "请选择有效的注册角色"),
    name: Yup.string()
      .required("请输入姓名")
      .min(2, "姓名至少需要 2 个字符")
      .max(50, "姓名最多 50 个字符"),
    email: Yup.string()
      .required("请输入邮箱")
      .email("请输入有效的邮箱地址"),
    password: Yup.string()
      .required("请输入密码")
      .min(8, "密码至少需要 8 个字符")
      .max(20, "密码最多 20 个字符"),
    confirmPassword: Yup.string()
      .required("请再次输入密码")
      .oneOf([Yup.ref("password")], "两次输入的密码不一致"),
    termsConditions: Yup.boolean().oneOf(
      [true],
      "请先同意服务条款"
    ),
  });

  const form = useFormik({
    initialValues: FORM_INITIAL_VALUES,
    validationSchema: validationSchema,
    validateOnChange: false,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setSubmitting(true);
        const payload: IRegisterPayload = {
          user_type_name: values.user_type_name,
          name: values.name,
          email: values.email,
          password: values.password,
        };
        const result = await register(payload);
        form.resetForm();

        const token = result?.data?.token || result?.token;
        const user = result?.data?.user || result?.user;
        const roles = result?.data?.roles || result?.roles || [];
        const activeRole = result?.data?.active_role || result?.active_role || null;

        if (token && user) {
          await setLogin(token, {
            ...user,
            roles,
            active_role: activeRole,
          });
          navigate("/");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleOnOpenTermsConditionsModal = () => {
    setTermsConditionsModalOpen(true);
  };

  const handleOnCloseTermsConditionsModal = () => {
    setTermsConditionsModalOpen(false);
  };

  useEffect(() => {
    return () => {
      clearRegisterMessages();
    };
  }, [clearRegisterMessages]);

  return {
    form,
    registerSuccessMessage,
    registerErrorMessage,
    termsConditionsModalOpen,
    handleOnOpenTermsConditionsModal,
    handleOnCloseTermsConditionsModal,
  };
};

export default useRegisterForm;
