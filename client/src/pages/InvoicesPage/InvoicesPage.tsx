import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  IInvoice,
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_TEXT,
  InvoiceStatus,
} from "@/interfaces/models/invoice";
import invoiceService from "@/services/invoices.service";
import PageHeader from "@/components/core-ui/PageHeader";

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

      if (response.invoices) {
        setInvoices(response.invoices);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Failed to load invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, current_page: 1 });
    loadInvoices();
  };

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.company_id?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm("确定要删除此发票吗？")) return;
    try {
      await invoiceService.deleteInvoice(id);
      loadInvoices();
    } catch (error) {
      console.error("Failed to delete invoice:", error);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("zh-CN");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="我的发票"
        description="查看和管理你的所有发票"
        breadcrumbs={[
          { label: "发票管理" },
        ]}
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
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索发票号或公司名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </form>

          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as InvoiceStatus | "all");
                setPagination({ ...pagination, current_page: 1 });
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
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredInvoices.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      发票号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      公司
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      发票类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      金额
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      账单周期
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200" data-testid="invoices-tbody">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice._id} data-testid={`invoice-row-${invoice._id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.invoice_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {invoice.company_id?.company_name || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {invoice.invoice_type}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.total_amount, invoice.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(invoice.billing_period_start)} - {formatDate(invoice.billing_period_end)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            INVOICE_STATUS_COLORS[invoice.status]
                          }`}
                        >
                          {INVOICE_STATUS_TEXT[invoice.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/invoices/${invoice._id}`}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
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
                    onClick={() => setPagination({ ...pagination, current_page: pagination.current_page - 1 })}
                    disabled={pagination.current_page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, current_page: pagination.current_page + 1 })}
                    disabled={pagination.current_page === pagination.total_pages}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
            <Link
              to="/invoices/new"
              className="inline-flex items-center text-blue-600 hover:text-blue-700"
            >
              <PlusIcon className="w-5 h-5 mr-1" />
              创建第一个发票
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesPage;
