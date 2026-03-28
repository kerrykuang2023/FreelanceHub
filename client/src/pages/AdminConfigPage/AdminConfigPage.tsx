import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import adminService, { ISystemConfig, IConfigType } from "@/services/admin.service";
import PageHeader from "@/components/core-ui/PageHeader";

interface ConfigPageConfig {
  title: string;
  configType: string;
  description: string;
  columns: { key: string; label: string; render?: (value: any, config: ISystemConfig) => React.ReactNode }[];
}

const AdminConfigPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<ISystemConfig[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ISystemConfig | null>(null);
  const [formData, setFormData] = useState({
    config_key: "",
    config_value: "",
    display_name: "",
    description: "",
    display_order: 0,
    is_active: true,
  });

  const pageConfig: ConfigPageConfig = useMemo(() => {
    const path = location.pathname;
    if (path.includes("skill-categories")) {
      return {
        title: "技能分类",
        configType: "skill_category",
        description: "管理系统技能分类，如SAP、ERP、CRM、JAVA等技能体系",
        columns: [
          { key: "category_name", label: "分类名称" },
          { key: "category_code", label: "分类代码" },
          { key: "display_order", label: "排序" },
        ],
      };
    } else if (path.includes("work-types")) {
      return {
        title: "工时类型",
        configType: "work_type",
        description: "管理工时记录的工作类型，如远程工作、现场开发、会议等",
        columns: [
          { key: "display_name", label: "类型名称" },
          { key: "config_key", label: "类型Key" },
          { key: "description", label: "描述" },
          { key: "display_order", label: "排序" },
        ],
      };
    } else if (path.includes("tax-rates")) {
      return {
        title: "税率配置",
        configType: "tax_rate",
        description: "管理系统税率配置，如增值税、个人所得税等",
        columns: [
          { key: "display_name", label: "税率名称" },
          { key: "config_value", label: "税率值(%)" },
          { key: "description", label: "描述" },
          { key: "display_order", label: "排序" },
        ],
      };
    } else if (path.includes("currencies")) {
      return {
        title: "货币配置",
        configType: "currency",
        description: "管理系统支持的货币类型，如人民币、美元、欧元等",
        columns: [
          { key: "display_name", label: "货币名称" },
          { key: "config_key", label: "货币代码" },
          { key: "description", label: "描述" },
          { key: "display_order", label: "排序" },
        ],
      };
    } else if (path.includes("languages")) {
      return {
        title: "语言要求",
        configType: "language",
        description: "管理系统支持的语言要求，如中文、英语、俄语等",
        columns: [
          { key: "display_name", label: "语言名称" },
          { key: "config_key", label: "语言代码" },
          { key: "description", label: "描述" },
          { key: "display_order", label: "排序" },
        ],
      };
    } else if (path.includes("job-natures")) {
      return {
        title: "工作性质",
        configType: "job_nature",
        description: "管理工作性质类型，如全职、兼职、自由顾问、实习等",
        columns: [
          { key: "display_name", label: "性质名称" },
          { key: "config_key", label: "性质Key" },
          { key: "description", label: "描述" },
          { key: "display_order", label: "排序" },
        ],
      };
    } else if (path.includes("work-formats")) {
      return {
        title: "工作形式",
        configType: "work_format",
        description: "管理工作形式类型，如远程、现场、混合等",
        columns: [
          { key: "display_name", label: "形式名称" },
          { key: "config_key", label: "形式Key" },
          { key: "description", label: "描述" },
          { key: "display_order", label: "排序" },
        ],
      };
    } else if (path.includes("rate-types")) {
      return {
        title: "Rate类型",
        configType: "rate_type",
        description: "管理薪资Rate类型，如日薪、月薪、年薪、项目总价等",
        columns: [
          { key: "display_name", label: "类型名称" },
          { key: "config_key", label: "类型Key" },
          { key: "config_value", label: "默认值" },
          { key: "description", label: "描述" },
          { key: "display_order", label: "排序" },
        ],
      };
    } else if (path.includes("invoice-types")) {
      return {
        title: "发票类型",
        configType: "invoice_type",
        description: "管理系统支持的发票类型，如增值税专用、普通发票等",
        columns: [
          { key: "display_name", label: "类型名称" },
          { key: "config_key", label: "类型Key" },
          { key: "description", label: "描述" },
          { key: "display_order", label: "排序" },
        ],
      };
    } else if (path.includes("payment-methods")) {
      return {
        title: "付款方式",
        configType: "payment_method",
        description: "管理系统支持的付款方式，如银行转账、支付宝、微信等",
        columns: [
          { key: "display_name", label: "方式名称" },
          { key: "config_key", label: "方式Key" },
          { key: "description", label: "描述" },
          { key: "display_order", label: "排序" },
        ],
      };
    }
    return {
      title: "系统配置",
      configType: "",
      description: "系统配置管理",
      columns: [],
    };
  }, [location.pathname]);

  useEffect(() => {
    if (pageConfig.configType) {
      loadConfigs();
    }
  }, [pageConfig.configType]);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSystemConfigs(pageConfig.configType);
      setConfigs(response.data.data || []);
    } catch (error) {
      console.error("Failed to load configs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.display_name.trim()) {
      alert("显示名称不能为空");
      return;
    }
    if (!formData.config_key.trim() && !editingConfig) {
      alert("配置Key不能为空");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        config_type: pageConfig.configType,
        config_key: formData.config_key,
        config_value: formData.config_value || formData.display_name,
        display_name: formData.display_name,
        description: formData.description,
        display_order: formData.display_order,
        is_active: formData.is_active,
      };

      if (editingConfig?._id) {
        await adminService.updateSystemConfig(editingConfig._id, payload);
      } else {
        await adminService.createSystemConfig(payload);
      }

      setShowModal(false);
      setEditingConfig(null);
      setFormData({ config_key: "", config_value: "", display_name: "", description: "", display_order: 0, is_active: true });
      loadConfigs();
    } catch (error: any) {
      console.error("Failed to save:", error);
      alert(error?.response?.data?.error || "保存失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除吗？")) return;

    try {
      setLoading(true);
      await adminService.deleteSystemConfig(id);
      loadConfigs();
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("删除失败");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (config: ISystemConfig) => {
    try {
      await adminService.updateSystemConfig(config._id!, { is_active: !config.is_active });
      loadConfigs();
    } catch (error) {
      console.error("Failed to toggle active:", error);
    }
  };

  const openEditModal = (config?: ISystemConfig) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        config_key: config.config_key,
        config_value: config.config_value,
        display_name: config.display_name,
        description: config.description || "",
        display_order: config.display_order,
        is_active: config.is_active,
      });
    } else {
      setEditingConfig(null);
      setFormData({ config_key: "", config_value: "", display_name: "", description: "", display_order: configs.length + 1, is_active: true });
    }
    setShowModal(true);
  };

  const handleInitializeDefaults = async () => {
    if (!confirm("确定要初始化默认配置吗？这将添加系统所需的默认配置项。")) {
      return;
    }

    try {
      setLoading(true);
      await adminService.initializeDefaultConfigs();
      alert("默认配置初始化成功！");
      loadConfigs();
    } catch (error) {
      console.error("Failed to initialize defaults:", error);
      alert("初始化失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageConfig.title}
        description={pageConfig.description}
        breadcrumbs={[
          { label: "首页", href: "/" },
          { label: "系统管理", href: "/admin/dashboard" },
          { label: pageConfig.title },
        ]}
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleInitializeDefaults}
              className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              初始化默认
            </button>
            <button
              onClick={() => openEditModal()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              添加{pageConfig.title}
            </button>
          </div>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          {loading && configs.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无配置数据</p>
              <button
                onClick={handleInitializeDefaults}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                初始化默认配置
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">状态</th>
                      {pageConfig.columns.map((col) => (
                        <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {col.label}
                        </th>
                      ))}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {configs.map((config) => (
                      <tr key={config._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleActive(config)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${
                              config.is_active ? "bg-green-500" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`block w-4 h-4 bg-white rounded-full shadow transform transition-transform absolute top-1 ${
                                config.is_active ? "translate-x-7" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </td>
                        {pageConfig.columns.map((col) => (
                          <td key={col.key} className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {col.render
                                ? col.render((config as any)[col.key], config)
                                : (config as any)[col.key] || "-"}
                            </div>
                          </td>
                        ))}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openEditModal(config)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <PencilIcon className="w-5 h-5 inline" />
                          </button>
                          <button
                            onClick={() => handleDelete(config._id!)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="w-5 h-5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                共 {configs.length} 条配置
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingConfig ? "编辑" : "添加"}{pageConfig.title}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  显示名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`例如：${pageConfig.title}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  配置Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.config_key}
                  onChange={(e) => setFormData({ ...formData, config_key: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例如：remote"
                  disabled={!!editingConfig}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  配置值
                </label>
                <input
                  type="text"
                  value={formData.config_value}
                  onChange={(e) => setFormData({ ...formData, config_value: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="配置值"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="请输入描述"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  排序
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  启用此配置
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingConfig(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConfigPage;