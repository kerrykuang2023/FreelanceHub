import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface SkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  skillCategories?: any[];
}

const SkillModal: React.FC<SkillModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  skillCategories = [],
}) => {
  const [formData, setFormData] = useState({
    skill_name: initialData?.skill_name || '',
    skill_level: initialData?.skill_level || '中级',
    years_of_experience: initialData?.years_of_experience || 1,
    skill_category_id: initialData?.skill_category_id || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="relative inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {initialData ? '编辑技能' : '添加技能'}
            </h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">技能名称 *</label>
              <input
                type="text"
                required
                value={formData.skill_name}
                onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如 React, Node.js, Python"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">技能等级 *</label>
              <select
                value={formData.skill_level}
                onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="初级">初级</option>
                <option value="中级">中级</option>
                <option value="高级">高级</option>
                <option value="专家">专家</option>
              </select>
            </div>

            {skillCategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">技能分类</label>
                <select
                  value={formData.skill_category_id}
                  onChange={(e) => setFormData({ ...formData, skill_category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">不指定分类</option>
                  {skillCategories.map((category) => (
                    <option key={category._id || category.config_key} value={category._id || category.config_key}>
                      {category.config_value || category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">使用年限（年） *</label>
              <input
                type="number"
                required
                min="0"
                max="50"
                value={formData.years_of_experience}
                onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                {initialData ? '保存' : '添加'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SkillModal;
