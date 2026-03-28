import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Formik, Form, FieldArray, Field } from "formik";
import * as Yup from "yup";
import {
  IInvoiceFormData,
  IInvoiceItem,
} from "@/interfaces/models/invoice";
import invoiceService from "@/services/invoices.service";
import configsService from "@/services/configs.service";
import { ISystemConfig } from "@/services/admin.service";

const validationSchema = Yup.object().shape({
  company_id: Yup.string().required("请选择公司"),
  affiliation_id: Yup.string().required("请选择关联关系"),
  invoice_type: Yup.string().required("请选择发票类型"),
  billing_period_start: Yup.date().required("请选择账单开始日期"),
  billing_period_end: Yup.date().required("请选择账单结束日期"),
  currency: Yup.string().required("请选择货币"),
  items: Yup.array().of(
    Yup.object().shape({
      description: Yup.string().required("请输入描述"),
      quantity: Yup.number().min(1).required("请输入数量"),
      unit: Yup.string().required("请选择单位"),
      unit_price: Yup.number().min(0).required("请输入单价"),
      amount: Yup.number().min(0).required("请输入金额"),
    })
  ).min(1, "请至少添加一个项目"),
  tax_calculation_mode: Yup.string().required("请选择税计算方式"),
  tax_rate: Yup.number().min(0).max(100).required("请输入税率"),
  billing_info: Yup.object().shape({
    billing_company_name: Yup.string().required("请输入开票公司名称"),
    billing_tax_id: Yup.string().required("请输入纳税人识别号"),
    billing_address: Yup.string().required("请输入开票地址"),
    billing_phone: Yup.string().required("请输入开票电话"),
    billing_bank_name: Yup.string().required("请输入开户银行"),
    billing_bank_account: Yup.string().required("请输入银行账号"),
  }),
});

const InvoiceEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoiceTypes, setInvoiceTypes] = useState<ISystemConfig[]>([]);
  const [taxRates, setTaxRates] = useState<ISystemConfig[]>([]);
  const [currencies, setCurrencies] = useState<ISystemConfig[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const [initialValues, setInitialValues] = useState<IInvoiceFormData | null>(null);

  useEffect(() => {
    if (id) {
      loadInvoice();
      loadConfigs();
    }
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoadingInvoice(true);
      const response = await invoiceService.getInvoiceById(id!);
      const invoice = response.invoice || response;
      
      setInitialValues({
        company_id: invoice.company_id?._id || "",
        affiliation_id: invoice.affiliation_id || "",
        project_requirement_id: invoice.project_requirement_id || "",
        work_log_batch_id: invoice.work_log_batch_id || "",
        invoice_type: invoice.invoice_type,
        billing_period_start: new Date(invoice.billing_period_start).toISOString().split("T")[0],
        billing_period_end: new Date(invoice.billing_period_end).toISOString().split("T")[0],
        currency: invoice.currency,
        items: invoice.items.map((item: IInvoiceItem) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          amount: item.amount,
        })),
        tax_calculation_mode: invoice.tax_calculation_mode,
        tax_rate: invoice.tax_rate,
        notes: invoice.notes || "",
        billing_info: {
          billing_company_name: invoice.billing_info?.billing_company_name || "",
          billing_tax_id: invoice.billing_info?.billing_tax_id || "",
          billing_address: invoice.billing_info?.billing_address || "",
          billing_phone: invoice.billing_info?.billing_phone || "",
          billing_bank_name: invoice.billing_info?.billing_bank_name || "",
          billing_bank_account: invoice.billing_info?.billing_bank_account || "",
        },
      });
    } catch (error) {
      console.error("Failed to load invoice:", error);
      alert("加载发票失败");
      navigate("/invoices");
    } finally {
      setLoadingInvoice(false);
    }
  };

  const loadConfigs = async () => {
    try {
      setLoadingConfigs(true);
      const [types, rates, currs] = await Promise.all([
        configsService.getInvoiceTypes(),
        configsService.getTaxRates(),
        configsService.getCurrencies(),
      ]);
      setInvoiceTypes(types.filter(t => t.is_active));
      setTaxRates(rates.filter(t => t.is_active));
      setCurrencies(currs.filter(t => t.is_active));
    } catch (error) {
      console.error("Failed to load configs:", error);
    } finally {
      setLoadingConfigs(false);
    }
  };

  const calculateAmount = (values: IInvoiceFormData) => {
    const subtotal = values.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = values.tax_calculation_mode === "不含税价"
      ? subtotal * (values.tax_rate / 100)
      : subtotal - (subtotal / (1 + values.tax_rate / 100));
    const total = values.tax_calculation_mode === "不含税价"
      ? subtotal + taxAmount
      : subtotal;

    return { subtotal, taxAmount, total };
  };

  const handleSubmit = async (values: IInvoiceFormData, { setSubmitting }: any) => {
    try {
      await invoiceService.updateInvoice(id!, values);
      navigate(`/invoices/${id}`);
    } catch (error) {
      console.error("Failed to update invoice:", error);
      setSubmitting(false);
    }
  };

  if (loadingInvoice || loadingConfigs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!initialValues) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">发票不存在或无法加载</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="invoice-edit-page">
      <div className="flex items-center">
        <button
          onClick={() => navigate(`/invoices/${id}`)}
          className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          data-testid="back-btn"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">编辑发票</h1>
          <p className="mt-1 text-sm text-gray-600">
            修改发票信息并保存
          </p>
        </div>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, setFieldValue, isSubmitting }) => {
          const { subtotal, taxAmount, total } = calculateAmount(values);

          return (
            <Form>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">基本信息</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      公司 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="company_id"
                      as="select"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="company-select"
                    >
                      <option value="">请选择公司</option>
                    </Field>
                    {errors.company_id && touched.company_id && (
                      <p className="mt-1 text-sm text-red-500">{errors.company_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      关联关系 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="affiliation_id"
                      as="select"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="affiliation-select"
                    >
                      <option value="">请选择关联关系</option>
                    </Field>
                    {errors.affiliation_id && touched.affiliation_id && (
                      <p className="mt-1 text-sm text-red-500">{errors.affiliation_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      发票类型 <span className="text-red-500">*</span>
                    </label>
                    {loadingConfigs ? (
                      <div className="animate-pulse h-10 bg-gray-100 rounded-lg"></div>
                    ) : invoiceTypes.length > 0 ? (
                      <Field
                        name="invoice_type"
                        as="select"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        data-testid="invoice-type-select"
                      >
                        <option value="">请选择发票类型</option>
                        {invoiceTypes.map((option) => (
                          <option key={option._id} value={option.config_value}>
                            {option.display_name}
                          </option>
                        ))}
                      </Field>
                    ) : (
                      <Field
                        name="invoice_type"
                        as="select"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        data-testid="invoice-type-select"
                      >
                        <option value="">请选择发票类型</option>
                        <option value="增值税专用发票">增值税专用发票</option>
                        <option value="增值税普通发票">增值税普通发票</option>
                        <option value="个人发票">个人发票</option>
                        <option value="服务费发票">服务费发票</option>
                      </Field>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      货币 <span className="text-red-500">*</span>
                    </label>
                    {loadingConfigs ? (
                      <div className="animate-pulse h-10 bg-gray-100 rounded-lg"></div>
                    ) : currencies.length > 0 ? (
                      <Field
                        name="currency"
                        as="select"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        data-testid="currency-select"
                      >
                        <option value="">请选择货币</option>
                        {currencies.map((option) => (
                          <option key={option._id} value={option.config_key}>
                            {option.display_name}
                          </option>
                        ))}
                      </Field>
                    ) : (
                      <Field
                        name="currency"
                        as="select"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        data-testid="currency-select"
                      >
                        <option value="CNY">CNY (人民币)</option>
                        <option value="USD">USD (美元)</option>
                        <option value="EUR">EUR (欧元)</option>
                        <option value="GBP">GBP (英镑)</option>
                        <option value="RUB">RUB (卢布)</option>
                      </Field>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      账单开始日期 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      type="date"
                      name="billing_period_start"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="billing-start-input"
                    />
                    {errors.billing_period_start && touched.billing_period_start && (
                      <p className="mt-1 text-sm text-red-500">{errors.billing_period_start as string}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      账单结束日期 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      type="date"
                      name="billing_period_end"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="billing-end-input"
                    />
                    {errors.billing_period_end && touched.billing_period_end && (
                      <p className="mt-1 text-sm text-red-500">{errors.billing_period_end as string}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">发票项目</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setFieldValue("items", [
                        ...values.items,
                        { description: "", quantity: 1, unit: "天", unit_price: 0, amount: 0 },
                      ]);
                    }}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    data-testid="add-item-btn"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    添加项目
                  </button>
                </div>

                <FieldArray name="items">
                  {({ remove, push }) => (
                    <div className="space-y-4">
                      {values.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 items-end" data-testid={`item-${index}`}>
                          <div className="col-span-4">
                            <label className="block text-xs text-gray-600 mb-1">描述</label>
                            <Field
                              name={`items.${index}.description`}
                              type="text"
                              placeholder="项目描述"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              data-testid={`item-${index}-description`}
                            />
                            {errors.items?.[index]?.description && touched.items?.[index]?.description && (
                              <p className="mt-1 text-xs text-red-500">{errors.items[index].description}</p>
                            )}
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-600 mb-1">数量</label>
                            <Field
                              name={`items.${index}.quantity`}
                              type="number"
                              min="1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              data-testid={`item-${index}-quantity`}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-600 mb-1">单位</label>
                            <Field
                              name={`items.${index}.unit`}
                              as="select"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              data-testid={`item-${index}-unit`}
                            >
                              <option value="天">天</option>
                              <option value="小时">小时</option>
                              <option value="月">月</option>
                              <option value="项目">项目</option>
                              <option value="次">次</option>
                            </Field>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-600 mb-1">单价</label>
                            <Field
                              name={`items.${index}.unit_price`}
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              data-testid={`item-${index}-unit-price`}
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="block text-xs text-gray-600 mb-1">金额</label>
                            <Field
                              name={`items.${index}.amount`}
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              data-testid={`item-${index}-amount`}
                            />
                          </div>
                          <div className="col-span-1">
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              disabled={values.items.length === 1}
                              data-testid={`item-${index}-remove-btn`}
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </FieldArray>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">税务计算</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      税计算方式 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="tax_calculation_mode"
                      as="select"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="tax-mode-select"
                    >
                      <option value="不含税价">不含税价 (顾问实得)</option>
                      <option value="含税价">含税价 (企业承担)</option>
                    </Field>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      税率 (%) <span className="text-red-500">*</span>
                    </label>
                    {loadingConfigs ? (
                      <div className="animate-pulse h-10 bg-gray-100 rounded-lg"></div>
                    ) : taxRates.length > 0 ? (
                      <Field
                        name="tax_rate"
                        as="select"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        data-testid="tax-rate-select"
                      >
                        {taxRates.map((rate) => (
                          <option key={rate._id} value={rate.config_value}>
                            {rate.display_name} ({rate.config_value}%)
                          </option>
                        ))}
                      </Field>
                    ) : (
                      <Field
                        name="tax_rate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        data-testid="tax-rate-input"
                      />
                    )}
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">小计金额</span>
                      <span className="text-sm font-medium text-gray-900" data-testid="subtotal-display">
                        ¥{subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">税额</span>
                      <span className="text-sm font-medium text-gray-900" data-testid="tax-display">
                        ¥{taxAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-base font-medium text-gray-900">价税合计</span>
                      <span className="text-lg font-bold text-blue-600" data-testid="total-display">
                        ¥{total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">开票信息</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      开票公司名称 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="billing_info.billing_company_name"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="billing-company-input"
                    />
                    {errors.billing_info?.billing_company_name && touched.billing_info?.billing_company_name && (
                      <p className="mt-1 text-sm text-red-500">{errors.billing_info.billing_company_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      纳税人识别号 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="billing_info.billing_tax_id"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="billing-tax-input"
                    />
                    {errors.billing_info?.billing_tax_id && touched.billing_info?.billing_tax_id && (
                      <p className="mt-1 text-sm text-red-500">{errors.billing_info.billing_tax_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      开票电话 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="billing_info.billing_phone"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="billing-phone-input"
                    />
                    {errors.billing_info?.billing_phone && touched.billing_info?.billing_phone && (
                      <p className="mt-1 text-sm text-red-500">{errors.billing_info.billing_phone}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      开票地址 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="billing_info.billing_address"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="billing-address-input"
                    />
                    {errors.billing_info?.billing_address && touched.billing_info?.billing_address && (
                      <p className="mt-1 text-sm text-red-500">{errors.billing_info.billing_address}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      开户银行 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="billing_info.billing_bank_name"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="billing-bank-input"
                    />
                    {errors.billing_info?.billing_bank_name && touched.billing_info?.billing_bank_name && (
                      <p className="mt-1 text-sm text-red-500">{errors.billing_info.billing_bank_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      银行账号 <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="billing_info.billing_bank_account"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="billing-account-input"
                    />
                    {errors.billing_info?.billing_bank_account && touched.billing_info?.billing_bank_account && (
                      <p className="mt-1 text-sm text-red-500">{errors.billing_info.billing_bank_account}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">备注</h2>
                <Field
                  name="notes"
                  as="textarea"
                  rows={4}
                  placeholder="添加备注信息（可选）..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  data-testid="notes-input"
                />
              </div>

              <div className="flex items-center justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => navigate(`/invoices/${id}`)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  data-testid="cancel-btn"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  data-testid="save-btn"
                >
                  保存修改
                </button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default InvoiceEditPage;
