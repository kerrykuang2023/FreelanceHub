import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface BasicInfo {
  headline: string;
  summary: string;
  location: string;
}

interface BasicInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BasicInfo) => void;
  initialData?: BasicInfo;
  saving?: boolean;
}

const BasicInfoModal = ({ isOpen, onClose, onSubmit, initialData, saving }: BasicInfoModalProps) => {
  const [formData, setFormData] = useState<BasicInfo>({
    headline: '',
    summary: '',
    location: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        headline: initialData.headline || '',
        summary: initialData.summary || '',
        location: initialData.location || '',
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">编辑基本信息</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                职业标题
              </label>
              <input
                type="text"
                data-testid="basic-headline-input"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="例如：高级全栈开发工程师 | 8年经验"
              />
              <p className="mt-1 text-xs text-gray-500">简短描述您的专业领域和经验</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所在地
              </label>
              <input
                type="text"
                data-testid="basic-location-input"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="例如：上海，中国"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                个人简介
              </label>
              <textarea
                data-testid="basic-summary-input"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                placeholder="介绍您的专业技能、工作经验和职业目标..."
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.summary.length}/500 字符
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                data-testid="basic-info-submit-btn"
                className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoModal;
