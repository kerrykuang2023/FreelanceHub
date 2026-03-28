import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon, TrashIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  IInvoiceFormData,
  IInvoiceItem,
} from "@/interfaces/models/invoice";
import invoiceService from "@/services/invoices.service";
import configsService from "@/services/configs.service";
import { ISystemConfig } from "@/services/admin.service";
import PageHeader from "@/components/core-ui/PageHeader";

interface IWorkLog {
  _id: string;
  work_date: string;
  hours_worked: number;
  work_description: string;
  work_type: string;
  project_requirement_id: {
    _id: string;
    project_title: string;
  };
  hourly_rate?: number;
}

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

const CreateInvoicePage = () => {
  const navigate = useNavigate();
  const [invoiceTypes, setInvoiceTypes] = useState<ISystemConfig[]>([]);
  const [taxRates, setTaxRates] = useState<ISystemConfig[]>([]);
  const [currencies, setCurrencies] = useState<ISystemConfig[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);
  const [availableWorkLogs, setAvailableWorkLogs] = useState<IWorkLog[]>([]);
  const [selectedWorkLogIds, setSelectedWorkLogIds] = useState<Set<string>>(new Set());
  const [loadingWorkLogs, setLoadingWorkLogs] = useState(false);
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [initialValues, setInitialValues] = useState<IInvoiceFormData>({
    company_id: "",
    affiliation_id: "",
    project_requirement_id: "",
    work_log_batch_id: "",
    invoice_type: "增值税普通发票" as any,
    billing_period_start: "",
    billing_period_end: "",
    currency: "CNY",
    items: [
      {
        description: "",
        quantity: 1,
        unit: "天",
        unit_price: 0,
        amount: 0,
      },
    ],
    tax_calculation_mode: "不含税价" as any,
    tax_rate: 6,
    notes: "",
    billing_info: {
      billing_company_name: "",
      billing_tax_id: "",
      billing_address: "",
      billing_phone: "",
      billing_bank_name: "",
      billing_bank_account: "",
    },
  });

  useEffect(() => {
    loadConfigs();
    loadAvailableWorkLogs();
  }, []);

  const loadAvailableWorkLogs = async () => {
    try {
      setLoadingWorkLogs(true);
      const response = await invoiceService.getAvailableWorkLogs();
      const workLogs = (response as any).work_logs || [];
      setAvailableWorkLogs(workLogs);
    } catch (error) {
      console.error("Failed to load work logs:", error);
    } finally {
      setLoadingWorkLogs(false);
    }
  };

  const handleWorkLogSelection = (workLogId: string, setFieldValue: any, values: IInvoiceFormData) => {
    const newSelectedIds = new Set(selectedWorkLogIds);
    
    if (newSelectedIds.has(workLogId)) {
      newSelectedIds.delete(workLogId);
    } else {
      newSelectedIds.add(workLogId);
    }
    
    setSelectedWorkLogIds(newSelectedIds);
    
    const selectedWorkLogs = availableWorkLogs.filter(wl => newSelectedIds.has(wl._id));
    
    const newItems: IInvoiceItem[] = selectedWorkLogs.map(wl => ({
      description: `${wl.project_requirement_id?.project_title || '项目'} - ${wl.work_description || wl.work_type}`,
      quantity: wl.hours_worked,
      unit: "小时",
      unit_price: hourlyRate || wl.hourly_rate || 0,
      amount: (wl.hours_worked) * (hourlyRate || wl.hourly_rate || 0),
      work_log_id: wl._id,
    }));
    
    if (newItems.length === 0) {
      newItems.push({
        description: "",
        quantity: 1,
        unit: "天",
        unit_price: 0,
        amount: 0,
      });
    }
    
    setFieldValue("items", newItems);
    setFieldValue("work_log_ids", Array.from(newSelectedIds));
  };

  const handleHourlyRateChange = (rate: number, setFieldValue: any, values: IInvoiceFormData) => {
    setHourlyRate(rate);
    
    const newItems = values.items.map(item => ({
      ...item,
      unit_price: rate,
      amount: item.quantity * rate,
    }));
    
    setFieldValue("items", newItems);
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

      if (types.length > 0) {
        setInitialValues(prev => ({ ...prev, invoice_type: types[0].config_value }));
      }
      if (rates.length > 0) {
        const defaultRate = rates.find(r => r.config_value === "6") || rates[0];
        setInitialValues(prev => ({ ...prev, tax_rate: parseFloat(defaultRate.config_value) || 6 }));
      }
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
      await invoiceService.createInvoice(values);
      navigate("/invoices");
    } catch (error) {
      console.error("Failed to create invoice:", error);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="创建发票"
        description="填写发票信息并提交审核"
        breadcrumbs={[
          { label: "首页", href: "/" },
          { label: "发票管理", href: "/invoices" },
          { label: "创建发票" },
        ]}
      />

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
                  />
                  {errors.billing_period_end && touched.billing_period_end && (
                    <p className="mt-1 text-sm text-red-500">{errors.billing_period_end as string}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">从工时记录生成</h2>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-600">时薪费率:</label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => handleHourlyRateChange(parseFloat(e.target.value) || 0, setFieldValue, values)}
                    className="w-32 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    placeholder="0.00"
                  />
                  <span className="text-sm text-gray-500">{values.currency}/小时</span>
                </div>
              </div>

              {loadingWorkLogs ? (
                <div className="text-center py-8 text-gray-500">加载工时记录中...</div>
              ) : availableWorkLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无已确认的工时记录可用于开票
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableWorkLogs.map((workLog) => (
                    <label
                      key={workLog._id}
                      className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedWorkLogIds.has(workLog._id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedWorkLogIds.has(workLog._id)}
                        onChange={() => handleWorkLogSelection(workLog._id, setFieldValue, values)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {workLog.project_requirement_id?.project_title || "未知项目"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(workLog.work_date).toLocaleDateString("zh-CN")}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {workLog.work_description || workLog.work_type}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {workLog.hours_worked} 小时
                        </div>
                        {hourlyRate > 0 && (
                          <div className="text-sm text-green-600">
                            ¥{(workLog.hours_worked * hourlyRate).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {selectedWorkLogIds.size > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                  已选择 {selectedWorkLogIds.size} 条工时记录，共 {values.items.reduce((sum, item) => sum + item.quantity, 0)} 小时
                </div>
              )}
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
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  添加项目
                </button>
              </div>

              <FieldArray name="items">
                {({ remove, push }) => (
                  <div className="space-y-4">
                    {values.items.map((item, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">
                              描述
                            </label>
                            <Field
                              name={`items.${index}.description`}
                              placeholder="服务描述"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => navigate("/invoices")}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loadingConfigs}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "提交中..." : "保存发票"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CreateInvoicePage;