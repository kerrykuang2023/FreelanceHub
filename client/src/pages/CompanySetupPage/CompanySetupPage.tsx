import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BuildingOfficeIcon, DocumentArrowUpIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import Alert from "@/components/core-ui/Alert";
import FieldError from "@/components/core-ui/FieldError";
import HttpService from "@/services/http.service";
import PageHeader from "@/components/core-ui/PageHeader";

interface ICompanySetupForm {
  company_name: string;
  company_type: string;
  business_license_number: string;
  legal_representative: string;
  registered_capital: string;
  establishment_date: string;
  company_address: string;
  contact_phone: string;
  company_website: string;
  business_scope: string;
}

const validationSchema = Yup.object({
  company_name: Yup.string().required("公司名称是必填项").max(100),
  company_type: Yup.string().required("公司类型是必填项"),
  business_license_number: Yup.string().required("营业执照号是必填项"),
  legal_representative: Yup.string().required("法定代表人是必填项"),
  registered_capital: Yup.string().required("注册资本是必填项"),
  establishment_date: Yup.date().required("成立日期是必填项"),
  company_address: Yup.string().required("公司地址是必填项"),
  contact_phone: Yup.string().required("联系电话是必填项"),
  company_website: Yup.string().url("无效的URL格式"),
  business_scope: Yup.string().required("经营范围是必填项").max(500),
});

const CompanySetupPage = () => {
  const navigate = useNavigate();
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const initialValues: ICompanySetupForm = {
    company_name: "",
    company_type: "",
    business_license_number: "",
    legal_representative: "",
    registered_capital: "",
    establishment_date: "",
    company_address: "",
    contact_phone: "",
    company_website: "",
    business_scope: "",
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError("文件大小不能超过5MB");
        return;
      }
      if (!["image/jpeg", "image/png", "image/jpg", "application/pdf"].includes(file.type)) {
        setError("仅支持JPG、PNG、PDF格式文件");
        return;
      }
      setLicenseFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (values: ICompanySetupForm) => {
    try {
      setSubmitting(true);
      setError(null);

      const formData = new FormData();
      Object.keys(values).forEach((key) => {
        formData.append(key, (values as any)[key]);
      });

      if (licenseFile) {
        formData.append("license_file", licenseFile);
      }

      await HttpService.post("/companies/setup", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "提交公司信息失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            公司信息已提交
          </h2>
          <p className="text-gray-600 mb-4">
            您的公司信息已提交审核，审核通过后您将收到通知。
          </p>
          <p className="text-sm text-gray-500">正在跳转到仪表盘...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <PageHeader
          title="公司注册"
          description="请完善您的公司信息，以便开始发布职位"
          breadcrumbs={[
            { label: "公司注册" },
          ]}
          showHome={false}
        />

        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} />
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className="space-y-6" data-testid="company-setup-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      公司名称 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="company_name"
                      type="text"
                      data-testid="company-name-input"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                      placeholder="请输入公司名称"
                    />
                    {errors.company_name && touched.company_name && (
                      <FieldError error={errors.company_name} />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      公司类型 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="select"
                      name="company_type"
                      data-testid="company-type-input"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 cursor-pointer"
                    >
                      <option value="">请选择公司类型</option>
                      <option value="limited_company">有限责任公司</option>
                      <option value="joint_stock">股份有限公司</option>
                      <option value="partnership">合伙企业</option>
                      <option value="sole_proprietorship">个人独资企业</option>
                      <option value="other">其他</option>
                    </Field>
                    {errors.company_type && touched.company_type && (
                      <FieldError error={errors.company_type} />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      营业执照号 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="business_license_number"
                      type="text"
                      data-testid="business-license-input"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                      placeholder="请输入营业执照号"
                    />
                    {errors.business_license_number && touched.business_license_number && (
                      <FieldError error={errors.business_license_number} />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      法定代表人 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="legal_representative"
                      type="text"
                      data-testid="legal-representative-input"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                      placeholder="请输入法定代表人姓名"
                    />
                    {errors.legal_representative && touched.legal_representative && (
                      <FieldError error={errors.legal_representative} />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      注册资本 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="registered_capital"
                      type="text"
                      data-testid="registered-capital-input"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                      placeholder="例如：1,000,000 人民币"
                    />
                    {errors.registered_capital && touched.registered_capital && (
                      <FieldError error={errors.registered_capital} />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      成立日期 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="establishment_date"
                      type="date"
                      data-testid="establishment-date-input"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    />
                    {errors.establishment_date && touched.establishment_date && (
                      <FieldError error={errors.establishment_date} />
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      公司地址 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="company_address"
                      type="text"
                      data-testid="company-address-input"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                      placeholder="请输入公司地址"
                    />
                    {errors.company_address && touched.company_address && (
                      <FieldError error={errors.company_address} />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      联系电话 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="contact_phone"
                      type="text"
                      data-testid="contact-phone-input"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                      placeholder="请输入联系电话"
                    />
                    {errors.contact_phone && touched.contact_phone && (
                      <FieldError error={errors.contact_phone} />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      公司网站
                    </label>
                    <Field
                      name="company_website"
                      type="text"
                      data-testid="company-website-input"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                      placeholder="https://www.example.com"
                    />
                    {errors.company_website && touched.company_website && (
                      <FieldError error={errors.company_website} />
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      经营范围 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="textarea"
                      name="business_scope"
                      rows={3}
                      data-testid="business-scope-input"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none"
                      placeholder="请描述您的经营范围"
                    />
                    {errors.business_scope && touched.business_scope && (
                      <FieldError error={errors.business_scope} />
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DocumentArrowUpIcon className="w-5 h-5 inline mr-2" />
                    营业执照上传 <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-500 transition-colors bg-gray-50">
                    <input
                      type="file"
                      id="license_file"
                      name="license_file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      data-testid="license-file-input"
                    />
                    <label htmlFor="license_file" className="cursor-pointer">
                      {licenseFile ? (
                        <div className="text-blue-600">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <CheckCircleIcon className="w-6 h-6" />
                          </div>
                          <p className="font-medium">{licenseFile.name}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            点击更换文件
                          </p>
                        </div>
                      ) : (
                        <div className="text-gray-500">
                          <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <DocumentArrowUpIcon className="w-6 h-6" />
                          </div>
                          <p className="font-medium">点击上传</p>
                          <p className="text-sm">支持JPG、PNG、PDF格式，最大5MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="px-6 py-3 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
                    data-testid="skip-btn"
                  >
                    暂时跳过
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    data-testid="submit-btn"
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:shadow-lg"
                  >
                    {submitting ? "提交中..." : "提交审核"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default CompanySetupPage;
