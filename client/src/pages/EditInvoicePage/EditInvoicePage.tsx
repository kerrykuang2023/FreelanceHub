import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Formik, Form, FieldArray, Field } from "formik";
import * as Yup from "yup";
import {
  IInvoice,
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

const EditInvoicePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<IInvoice | null>(null);
  const [invoiceTypes, setInvoiceTypes] = useState<ISystemConfig[]>([]);
  const [taxRates, setTaxRates] = useState<ISystemConfig[]>([]);
  const [currencies, setCurrencies] = useState<ISystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  const [initialValues, setInitialValues] = useState<IInvoiceFormData | null>(null);

  useEffect(() => {
    loadConfigs();
    if (id) {
      loadInvoice();
    }
  }, [id]);

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

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoiceById(id!);
      const invoiceData = response.invoice || response;
      setInvoice(invoiceData);

      setInitialValues({
        company_id: invoiceData.company_id?._id || invoiceData.company_id || "",
        affiliation_id: invoiceData.affiliation_id || "",
        project_requirement_id: invoiceData.project_requirement_id?._id || invoiceData.project_requirement_id || "",
        work_log_batch_id: invoiceData.work_log_batch_id || "",
        invoice_type: invoiceData.invoice_type,
        billing_period_start: invoiceData.billing_period_start?.split("T")[0] || "",
        billing_period_end: invoiceData.billing_period_end?.split("T")[0] || "",
        currency: invoiceData.currency,
        items: invoiceData.items || [],
        tax_calculation_mode: invoiceData.tax_calculation_mode,
        tax_rate: invoiceData.tax_rate,
        notes: invoiceData.notes || "",
        billing_info: invoiceData.billing_info || {
          billing_company_name: "",
          billing_tax_id: "",
          billing_address: "",
          billing_phone: "",
          billing_bank_name: "",
          billing_bank_account: "",
        },
      });
    } catch (error) {
      console.error("Failed to load invoice:", error);
    } finally {
      setLoading(false);
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

  if (loading || !initialValues) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (invoice && invoice.status !== "draft") {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">只能编辑草稿状态的发票</p>
        <button
          onClick={() => navigate(`/invoices/${id}`)}
          className="text-blue-600 hover:text-blue-700"
        >
          返回发票详情
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="edit-invoice-page">
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
            发票号: {invoice?.invoice_number}
          </p>
        </div>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, setFieldValue, isSubmitting }) => (
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
                    <option value={(invoice?.company_id as any)?._id || (typeof invoice?.company_id === "string" ? invoice.company_id : "")}>
                      {invoice?.company_id?.company_name || "当前公司"}
                    </option>
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
                    data-testid="billing-start-date"
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
                    data-testid="billing-end-date"
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
                  className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  data-testid="add-item-btn"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  添加项目
                </button>
              </div>

              <FieldArray name="items">
                {({ remove }) => (
                  <div className="space-y-4">
                    {values.items.map((item, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg" data-testid={`invoice-item-${index}`}>
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">
                              描述
                            </label>
                            <Field
                              name={`items.${index}.description`}
                              placeholder="服务描述"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              data-testid={`item-description-${index}`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              数量
                            </label>
                            <Field
                              type="number"
                              name={`items.${index}.quantity`}
                              min="1"
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const qty = parseFloat(e.target.value) || 0;
                                const price = values.items[index].unit_price;
                                setFieldValue(`items.${index}.quantity`, qty);
                                setFieldValue(`items.${index}.amount`, qty * price);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              data-testid={`item-quantity-${index}`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              单位
                            </label>
                            <Field
                              as="select"
                              name={`items.${index}.unit`}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              data-testid={`item-unit-${index}`}
                            >
                              <option value="天">天</option>
                              <option value="月">月</option>
                              <option value="小时">小时</option>
                              <option value="项目">项目</option>
                              <option value="次">次</option>
                            </Field>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              单价
                            </label>
                            <Field
                              type="number"
                              name={`items.${index}.unit_price`}
                              min="0"
                              step="0.01"
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const price = parseFloat(e.target.value) || 0;
                                const qty = values.items[index].quantity;
                                setFieldValue(`items.${index}.unit_price`, price);
                                setFieldValue(`items.${index}.amount`, qty * price);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              data-testid={`item-unit-price-${index}`}
                            />
                          </div>
                          <div className="flex items-end">
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 mb-1">
                                金额
                              </label>
                              <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700">
                                {item.amount.toFixed(2)}
                              </div>
                            </div>
                            {values.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                data-testid={`remove-item-${index}`}
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </FieldArray>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between w-64">
                      <span className="text-gray-600">小计:</span>
                      <span className="font-medium">
                        {calculateAmount(values).subtotal.toFixed(2)} {values.currency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between w-64">
                      <span className="text-gray-600">税率 ({values.tax_rate}%):</span>
                      <span className="font-medium">
                        {calculateAmount(values).taxAmount.toFixed(2)} {values.currency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between w-64 border-t pt-2">
                      <span className="font-medium text-gray-900">总金额:</span>
                      <span className="text-xl font-bold text-blue-600">
                        {calculateAmount(values).total.toFixed(2)} {values.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">税务信息</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    税计算方式 <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="select"
                    name="tax_calculation_mode"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="tax-calculation-mode"
                  >
                    <option value="不含税价">不含税价</option>
                    <option value="含税价">含税价</option>
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
                      as="select"
                      name="tax_rate"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="tax-rate-select"
                    >
                      <option value="">请选择税率</option>
                      {taxRates.map((rate) => (
                        <option key={rate._id} value={rate.config_value}>
                          {rate.display_name}
                        </option>
                      ))}
                    </Field>
                  ) : (
                    <Field
                      type="number"
                      name="tax_rate"
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="tax-rate-input"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">开票信息</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开票公司名称 <span className="text-red-500">*</span>
                  </label>
                  <Field
                    name="billing_info.billing_company_name"
                    placeholder="公司全称"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="billing-company-name"
                  />
                  {errors.billing_info?.billing_company_name && touched.billing_info?.billing_company_name && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.billing_info.billing_company_name as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    纳税人识别号 <span className="text-red-500">*</span>
                  </label>
                  <Field
                    name="billing_info.billing_tax_id"
                    placeholder="统一社会信用代码"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="billing-tax-id"
                  />
                  {errors.billing_info?.billing_tax_id && touched.billing_info?.billing_tax_id && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.billing_info.billing_tax_id as string}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开票地址 <span className="text-red-500">*</span>
                  </label>
                  <Field
                    name="billing_info.billing_address"
                    placeholder="详细地址"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="billing-address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开票电话 <span className="text-red-500">*</span>
                  </label>
                  <Field
                    name="billing_info.billing_phone"
                    placeholder="联系电话"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="billing-phone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开户银行 <span className="text-red-500">*</span>
                  </label>
                  <Field
                    name="billing_info.billing_bank_name"
                    placeholder="银行名称"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="billing-bank-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    银行账号 <span className="text-red-500">*</span>
                  </label>
                  <Field
                    name="billing_info.billing_bank_account"
                    placeholder="银行账号"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="billing-bank-account"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    备注
                  </label>
                  <Field
                    as="textarea"
                    name="notes"
                    rows={3}
                    placeholder="可选备注信息"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="notes"
                  />
                </div>
              </div>
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
                disabled={isSubmitting || loadingConfigs}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                data-testid="save-btn"
              >
                {isSubmitting ? "保存中..." : "保存修改"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default EditInvoicePage;
