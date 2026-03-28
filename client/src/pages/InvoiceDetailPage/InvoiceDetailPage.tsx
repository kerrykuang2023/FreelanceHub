import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  UserIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import {
  IInvoice,
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_TEXT,
} from "@/interfaces/models/invoice";
import invoiceService from "@/services/invoices.service";

const InvoiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<IInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    payment_method: "银行转账",
    payment_reference: "",
    paid_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoiceById(id!);
      setInvoice(response.invoice || response);
    } catch (error) {
      console.error("Failed to load invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice || invoice.status !== "draft") return;
    if (!confirm("确定要删除此发票吗？此操作不可撤销。")) return;

    try {
      setActionLoading(true);
      await invoiceService.deleteInvoice(invoice._id);
      navigate("/invoices");
    } catch (error) {
      console.error("Failed to delete invoice:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!invoice || invoice.status !== "draft") return;
    if (!confirm("确定要提交此发票进行审核吗？")) return;

    try {
      setActionLoading(true);
      await invoiceService.submitInvoice(invoice._id);
      loadInvoice();
    } catch (error) {
      console.error("Failed to submit invoice:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!invoice || invoice.status !== "submitted") return;
    if (!confirm("确定要审核通过此发票吗？")) return;

    try {
      setActionLoading(true);
      await invoiceService.approveInvoice(invoice._id);
      loadInvoice();
    } catch (error) {
      console.error("Failed to approve invoice:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!invoice || invoice.status !== "submitted") return;
    if (!rejectReason.trim()) {
      alert("请输入驳回原因");
      return;
    }

    try {
      setActionLoading(true);
      await invoiceService.rejectInvoice(invoice._id, rejectReason);
      setShowRejectModal(false);
      setRejectReason("");
      loadInvoice();
    } catch (error) {
      console.error("Failed to reject invoice:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice || invoice.status !== "approved") return;

    try {
      setActionLoading(true);
      await invoiceService.markAsPaid(invoice._id, paymentInfo);
      setShowPaymentModal(false);
      loadInvoice();
    } catch (error) {
      console.error("Failed to mark invoice as paid:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("zh-CN");
  };

  const numberToChinese = (num: number): string => {
    const digits = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
    const units = ["", "拾", "佰", "仟"];
    const bigUnits = ["", "万", "亿"];

    if (num === 0) return "零元整";

    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);

    let result = "";

    const intStr = integerPart.toString();
    let zeroFlag = false;
    let unitIndex = 0;

    for (let i = intStr.length - 1; i >= 0; i--) {
      const digit = parseInt(intStr[i]);
      const pos = intStr.length - 1 - i;

      if (digit === 0) {
        zeroFlag = true;
        if (pos % 4 === 0 && pos > 0) {
          const bigUnitIndex = Math.floor(pos / 4);
          if (bigUnitIndex <= 2) {
            result = bigUnits[bigUnitIndex] + result;
          }
        }
      } else {
        if (zeroFlag) {
          result = digits[0] + result;
          zeroFlag = false;
        }
        const unit = units[pos % 4];
        const bigUnitIndex = Math.floor(pos / 4);
        const bigUnit = bigUnitIndex > 0 && pos % 4 === 0 ? bigUnits[bigUnitIndex] : "";
        result = digits[digit] + unit + bigUnit + result;
      }
    }

    result += "元";

    if (decimalPart > 0) {
      const jiao = Math.floor(decimalPart / 10);
      const fen = decimalPart % 10;
      if (jiao > 0) result += digits[jiao] + "角";
      if (fen > 0) result += digits[fen] + "分";
    } else {
      result += "整";
    }

    return result;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">发票不存在</p>
        <Link to="/invoices" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
          返回发票列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="invoice-detail-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/invoices")}
            className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            data-testid="back-btn"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              发票详情
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              发票号: {invoice.invoice_number}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              INVOICE_STATUS_COLORS[invoice.status]
            }`}
            data-testid="invoice-status"
          >
            {INVOICE_STATUS_TEXT[invoice.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <ClipboardDocumentListIcon className="w-5 h-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">发票号</p>
                <p className="text-sm font-medium text-gray-900" data-testid="invoice-number">
                  {invoice.invoice_number}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">发票类型</p>
                <p className="text-sm font-medium text-gray-900" data-testid="invoice-type">
                  {invoice.invoice_type}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">货币</p>
                <p className="text-sm font-medium text-gray-900">{invoice.currency}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">账单周期</p>
                <p className="text-sm font-medium text-gray-900" data-testid="billing-period">
                  {formatDate(invoice.billing_period_start)} - {formatDate(invoice.billing_period_end)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">创建时间</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(invoice.created_at)}
                </p>
              </div>
              {invoice.issued_date && (
                <div>
                  <p className="text-xs text-gray-500">开票日期</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(invoice.issued_date)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">关联信息</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">顾问</p>
                <p className="text-sm font-medium text-gray-900" data-testid="freelancer-name">
                  {invoice.freelancer_id?.display_name || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">公司</p>
                <p className="text-sm font-medium text-gray-900" data-testid="company-name">
                  {invoice.company_id?.company_name || "-"}
                </p>
              </div>
              {invoice.project_requirement_id && (
                <div>
                  <p className="text-xs text-gray-500">项目</p>
                  <Link
                    to={`/jobs/${invoice.project_requirement_id._id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {invoice.project_requirement_id.project_title}
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">发票明细</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      描述
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      数量
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      单位
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      单价
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      金额
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatCurrency(item.unit_price, invoice.currency)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(item.amount, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <CurrencyDollarIcon className="w-5 h-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">税务计算</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">小计金额</span>
                <span className="text-sm font-medium text-gray-900" data-testid="subtotal-amount">
                  {formatCurrency(invoice.subtotal_amount, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">
                  税计算方式: <span className="font-medium">{invoice.tax_calculation_mode}</span>
                </span>
                <span className="text-sm text-gray-600">
                  税率: <span className="font-medium">{invoice.tax_rate}%</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">税额</span>
                <span className="text-sm font-medium text-gray-900" data-testid="tax-amount">
                  {formatCurrency(invoice.tax_amount, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-4">
                <span className="text-base font-medium text-gray-900">价税合计</span>
                <span className="text-xl font-bold text-blue-600" data-testid="total-amount">
                  {formatCurrency(invoice.total_amount, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 text-gray-500">
                <span className="text-sm">大写金额</span>
                <span className="text-sm" data-testid="amount-in-words">
                  {invoice.amount_in_words || numberToChinese(invoice.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {invoice.billing_info && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">开票信息</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">开票公司名称</p>
                  <p className="text-sm font-medium text-gray-900">
                    {invoice.billing_info.billing_company_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">纳税人识别号</p>
                  <p className="text-sm font-medium text-gray-900">
                    {invoice.billing_info.billing_tax_id}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">开票地址</p>
                  <p className="text-sm font-medium text-gray-900">
                    {invoice.billing_info.billing_address}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">开票电话</p>
                  <p className="text-sm font-medium text-gray-900">
                    {invoice.billing_info.billing_phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">开户银行</p>
                  <p className="text-sm font-medium text-gray-900">
                    {invoice.billing_info.billing_bank_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">银行账号</p>
                  <p className="text-sm font-medium text-gray-900">
                    {invoice.billing_info.billing_bank_account}
                  </p>
                </div>
              </div>
            </div>
          )}

          {invoice.notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">备注</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">操作</h2>
            <div className="space-y-3">
              {invoice.status === "draft" && (
                <>
                  <Link
                    to={`/invoices/${invoice._id}/edit`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    data-testid="edit-btn"
                  >
                    <PencilIcon className="w-5 h-5 mr-2" />
                    编辑发票
                  </Link>
                  <button
                    onClick={handleSubmit}
                    disabled={actionLoading}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    data-testid="submit-btn"
                  >
                    <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                    提交审核
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    data-testid="delete-btn"
                  >
                    <TrashIcon className="w-5 h-5 mr-2" />
                    删除发票
                  </button>
                </>
              )}

              {invoice.status === "submitted" && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    data-testid="approve-btn"
                  >
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    审核通过
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    data-testid="reject-btn"
                  >
                    <XCircleIcon className="w-5 h-5 mr-2" />
                    驳回发票
                  </button>
                </>
              )}

              {invoice.status === "approved" && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  disabled={actionLoading}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  data-testid="mark-paid-btn"
                >
                  <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                  确认付款
                </button>
              )}
            </div>
          </div>

          {invoice.status === "paid" && invoice.paid_date && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">付款信息</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">付款日期</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(invoice.paid_date)}
                  </p>
                </div>
                {invoice.payment_method && (
                  <div>
                    <p className="text-xs text-gray-500">付款方式</p>
                    <p className="text-sm font-medium text-gray-900">
                      {invoice.payment_method}
                    </p>
                  </div>
                )}
                {invoice.payment_reference && (
                  <div>
                    <p className="text-xs text-gray-500">付款参考号</p>
                    <p className="text-sm font-medium text-gray-900">
                      {invoice.payment_reference}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {invoice.attachments && invoice.attachments.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">附件</h2>
              <div className="space-y-2">
                {invoice.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-700">{attachment.file_name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">驳回发票</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入驳回原因..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              rows={4}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">确认付款</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  付款方式
                </label>
                <select
                  value={paymentInfo.payment_method}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, payment_method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="银行转账">银行转账</option>
                  <option value="支付宝">支付宝</option>
                  <option value="微信支付">微信支付</option>
                  <option value="支票">支票</option>
                  <option value="现金">现金</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  付款日期
                </label>
                <input
                  type="date"
                  value={paymentInfo.paid_date}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, paid_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  付款参考号（可选）
                </label>
                <input
                  type="text"
                  value={paymentInfo.payment_reference}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, payment_reference: e.target.value })}
                  placeholder="如银行流水号等"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                确认付款
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetailPage;
