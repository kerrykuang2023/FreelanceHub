import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowPathIcon,
  DocumentTextIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { IInvoice, InvoiceStatus } from "@/interfaces/models/invoice";
import PageHeader from "@/components/core-ui/PageHeader";
import PortalLayout from "@/components/layouts/portal/PortalLayout";
import invoiceService from "@/services/invoices.service";

const invoiceStatusText: Record<string, string> = {
  draft: "草稿",
  submitted: "已提交",
  approved: "已通过",
  rejected: "已驳回",
  sent: "已发送",
  paid: "已付款",
  cancelled: "已取消",
};

const invoiceStatusClass: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  sent: "bg-purple-100 text-purple-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10,
  });

  useEffect(() => {
    loadInvoices();
  }, [statusFilter, pagination.current_page]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getMyInvoices({
        page: pagination.current_page,
        limit: pagination.items_per_page,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      const nextInvoices = response.invoices || response.data?.items || response.data || [];
      const nextPagination = response.pagination || response.data?.pagination || {};

      setInvoices(nextInvoices);
      setPagination({
        current_page: nextPagination.current_page ?? nextPagination.page ?? 1,
        total_pages: nextPagination.total_pages ?? nextPagination.pages ?? 1,
        total_items: nextPagination.total_items ?? nextPagination.total ?? nextInvoices.length,
        items_per_page: nextPagination.items_per_page ?? nextPagination.limit ?? pagination.items_per_page,
      });
    } catch (error) {
      console.error("Failed to load invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPagination((current) => ({ ...current, current_page: 1 }));
    loadInvoices();
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm("确定要删除此发票吗？")) return;

    try {
      await invoiceService.deleteInvoice(id);
      loadInvoices();
    } catch (error) {
      console.error("Failed to delete invoice:", error);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;

    return (
      invoice.invoice_number?.toLowerCase().includes(keyword) ||
      invoice.company_id?.company_name?.toLowerCase().includes(keyword)
    );
  });

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency,
    }).format(amount || 0);

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("zh-CN");
  };

  return (
    <PortalLayout title="我的发票">
      <div className="space-y-6">
        <PageHeader
          title="我的发票"
          description="查看和管理你的所有发票"
          breadcrumbs={[{ label: "发票管理" }]}
          actions={
            <Link
              to="/invoices/new"
              data-testid="create-invoice-btn"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              创建发票
            </Link>
          }
        />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索发票号或公司名称..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </form>

            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as InvoiceStatus | "all");
                  setPagination((current) => ({ ...current, current_page: 1 }));
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">全部状态</option>
                <option value="draft">草稿</option>
                <option value="submitted">已提交</option>
                <option value="approved">已通过</option>
                <option value="paid">已付款</option>
                <option value="rejected">已驳回</option>
                <option value="cancelled">已取消</option>
              </select>
              <button
                onClick={() => loadInvoices()}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                title="刷新"
                type="button"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : filteredInvoices.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {["发票号", "公司", "发票类型", "金额", "账单周期", "状态", "操作"].map((label) => (
                        <th
                          key={label}
                          className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                            label === "操作" ? "text-right" : "text-left"
                          }`}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200" data-testid="invoices-tbody">
                    {filteredInvoices.map((invoice) => (
                      <tr
                        key={invoice._id}
                        data-testid={`invoice-row-${invoice._id}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.invoice_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invoice.company_id?.company_name || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.invoice_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.total_amount, invoice.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invoice.billing_period_start)} - {formatDate(invoice.billing_period_end)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              invoiceStatusClass[invoice.status] || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {invoiceStatusText[invoice.status] || invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link to={`/invoices/${invoice._id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                            <EyeIcon className="w-5 h-5 inline" />
                          </Link>
                          {invoice.status === "draft" && (
                            <>
                              <Link
                                to={`/invoices/${invoice._id}/edit`}
                                className="text-gray-600 hover:text-gray-900 mr-3"
                              >
                                <PencilIcon className="w-5 h-5 inline" />
                              </Link>
                              <button
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleDeleteInvoice(invoice._id)}
                                type="button"
                              >
                                <TrashIcon className="w-5 h-5 inline" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    显示 {(pagination.current_page - 1) * pagination.items_per_page + 1} 到{" "}
                    {Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)} 条，
                    共 {pagination.total_items} 条
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPagination((current) => ({ ...current, current_page: current.current_page - 1 }))}
                      disabled={pagination.current_page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      type="button"
                    >
                      上一页
                    </button>
                    <button
                      onClick={() => setPagination((current) => ({ ...current, current_page: current.current_page + 1 }))}
                      disabled={pagination.current_page === pagination.total_pages}
                      className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      type="button"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">暂无发票记录</p>
              <Link to="/invoices/new" className="inline-flex items-center text-blue-600 hover:text-blue-700">
                <PlusIcon className="w-5 h-5 mr-1" />
                创建第一张发票
              </Link>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
};

export default InvoicesPage;
