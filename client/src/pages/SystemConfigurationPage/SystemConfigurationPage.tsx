import { useState, useEffect } from "react";
import {
  CpuChipIcon,
  ClockIcon,
  CurrencyDollarIcon,
  LanguageIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  TruckIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  RefreshIcon,
} from "@heroicons/react/24/outline";
import adminService, { ISystemConfig, IConfigType } from "@/services/admin.service";

type ConfigTab = "skills" | "worktypes" | "tax" | "currency" | "languages" | "jobnature" | "workformat" | "ratetypes" | "invoicetypes" | "paymentmethods";

const SystemConfigurationPage = () => {
  const [activeTab, setActiveTab] = useState<ConfigTab>("skills");
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<ISystemConfig[]>([]);
  const [configTypes, setConfigTypes] = useState<IConfigType[]>([]);
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

  useEffect(() => {
    loadConfigTypes();
  }, []);

  useEffect(() => {
    if (activeTab === "skills") {
      loadSkillCategories();
    } else {
      loadConfigsByType();
    }
  }, [activeTab]);

  const loadConfigTypes = async () => {
    try {
      const response = await adminService.getConfigTypes();
      setConfigTypes(response.data.data || []);
    } catch (error) {
      console.error("Failed to load config types:", error);
    }
  };

  const loadConfigsByType = async () => {
    try {
      setLoading(true);
      const configType = getConfigTypeFromTab(activeTab);
      const response = await adminService.getSystemConfigs(configType);
      setConfigs(response.data.data || []);
    } catch (error) {
      console.error("Failed to load configs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSkillCategories = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSkillCategories();
      setConfigs(response.data.data || []);
    } catch (error) {
      console.error("Failed to load skill categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const getConfigTypeFromTab = (tab: ConfigTab): string => {
    const mapping: Record<ConfigTab, string> = {
      skills: "skill_category",
      worktypes: "work_type",
      tax: "tax_rate",
      currency: "currency",
      languages: "language",
      jobnature: "job_nature",
      workformat: "work_format",
      ratetypes: "rate_type",
      invoicetypes: "invoice_type",
      paymentmethods: "payment_method",
    };
    return mapping[tab];
  };

  const getTabConfig = (tab: ConfigTab) => {
    const configs: Record<ConfigTab, { label: string; icon: any }> = {
      skills: { label: "技能分类", icon: CpuChipIcon },
      worktypes: { label: "工时类型", icon: ClockIcon },
      tax: { label: "税率配置", icon: CurrencyDollarIcon },
      currency: { label: "货币配置", icon: CurrencyDollarIcon },
      languages: { label: "语言要求", icon: LanguageIcon },
      jobnature: { label: "工作性质", icon: BriefcaseIcon },
      workformat: { label: "工作形式", icon: TruckIcon },
      ratetypes: { label: "Rate类型", icon: DocumentTextIcon },
      invoicetypes: { label: "发票类型", icon: ReceiptPercentIcon },
      paymentmethods: { label: "付款方式", icon: TruckIcon },
    };
    return configs[tab];
  };

  const handleInitializeDefaults = async () => {
    if (!confirm("确定要初始化默认配置吗？这将添加系统所需的默认配置项。")) {
      return;
    }

    try {
      setLoading(true);
      await adminService.initializeDefaultConfigs();
      alert("默认配置初始化成功！");
      loadConfigsByType();
    } catch (error) {
      console.error("Failed to initialize defaults:", error);
      alert("初始化失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.display_name.trim()) {
      alert("显示名称不能为空");
      return;
    }
    if (!formData.config_key.trim()) {
      alert("配置Key不能为空");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        config_type: getConfigTypeFromTab(activeTab),
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
      loadConfigsByType();
    } catch (error) {
      console.error("Failed to save:", error);
      alert("保存失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除吗？")) return;

    try {
      setLoading(true);
      await adminService.deleteSystemConfig(id);
      loadConfigsByType();
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
      loadConfigsByType();
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
      setFormData({ config_key: "", config_value: "", display_name: "", description: "", display_order: 0, is_active: true });
    }
    setShowModal(true);
  };

  const renderConfigList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (activeTab === "skills") {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            技能分类用于管理SAP、ERP、CRM、JAVA等技能体系，支持大类小类联动。
          </p>
          {configs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CpuChipIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p>暂无技能分类</p>
              <button onClick={() => openEditModal()} className="mt-4 text-blue-600 hover:text-blue-700">
                添加第一个技能分类
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {configs.map((category: any) => (
                <div key={category._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{category.category_name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{category.category_code}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        子分类: {category.sub_categories?.length || 0} 个
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal({ ...category, _id: category._id, config_key: category.category_code, config_value: category.category_name, display_name: category.category_name })} className="p-1 text-gray-400 hover:text-blue-600">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(category._id)} className="p-1 text-gray-400 hover:text-red-600">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {category.sub_categories && category.sub_categories.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex flex-wrap gap-1">
                        {category.sub_categories.slice(0, 5).map((sub: any) => (
                          <span key={sub._id} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                            {sub.sub_category_name}
                          </span>
                        ))}
                        {category.sub_categories.length > 5 && (
                          <span className="px-2 py-0.5 text-xs text-gray-400">
                            +{category.sub_categories.length - 5} 更多
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (configs.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p>暂无配置数据</p>
          <button
            onClick={handleInitializeDefaults}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            初始化默认配置
          </button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">显示名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">配置Key</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">配置值</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">描述</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">排序</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {configs.map((config) => (
              <tr key={config._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleActive(config)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      config.is_active ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                        config.is_active ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{config.display_name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 font-mono">{config.config_key}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">{config.config_value}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 max-w-xs truncate">{config.description || "-"}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">{config.display_order}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEditModal(config)} className="text-blue-600 hover:text-blue-900 mr-3">
                    <PencilIcon className="w-5 h-5 inline" />
                  </button>
                  <button onClick={() => handleDelete(config._id!)} className="text-red-600 hover:text-red-900">
                    <TrashIcon className="w-5 h-5 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统配置</h1>
          <p className="mt-1 text-sm text-gray-600">管理平台运行所需的各种配置项</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInitializeDefaults}
            className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <RefreshIcon className="w-4 h-4 mr-2" />
            初始化默认
          </button>
          {activeTab !== "skills" && (
            <button
              onClick={() => openEditModal()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              添加配置
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <div className="flex flex-wrap -mb-px overflow-x-auto">
            {(["skills", "worktypes", "tax", "currency", "languages", "jobnature", "workformat", "ratetypes", "invoicetypes", "paymentmethods"] as ConfigTab[]).map((tab) => {
              const config = getTabConfig(tab);
              const Icon = config.icon;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`inline-flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{getTabConfig(activeTab).label}</h2>
          {renderConfigList()}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingConfig ? "编辑" : "添加"} {getTabConfig(activeTab).label}
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
                  placeholder="例如：远程工作"
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
                  placeholder="例如：远程"
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

export default SystemConfigurationPage;