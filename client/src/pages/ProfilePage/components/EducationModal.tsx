import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

const EducationModal: React.FC<EducationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    school: '',
    degree: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        school: initialData?.school || '',
        degree: initialData?.degree || '',
        field_of_study: initialData?.field_of_study || '',
        start_date: initialData?.start_date?.split('T')[0] || '',
        end_date: initialData?.end_date?.split('T')[0] || '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const data = { ...formData };
    if (!data.end_date) delete (data as any).end_date;
    onSubmit(data);
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
              {initialData ? '编辑教育经历' : '添加教育经历'}
            </h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">学校名称 *</label>
              <input
                type="text"
                data-testid="education-school-input"
                required
                value={formData.school}
                onChange={(event) => setFormData({ ...formData, school: event.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：上海交通大学"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学历/学位 *</label>
                <input
                  type="text"
                  data-testid="education-degree-input"
                  required
                  value={formData.degree}
                  onChange={(event) => setFormData({ ...formData, degree: event.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例如：本科"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">专业 *</label>
                <input
                  type="text"
                  data-testid="education-field-input"
                  required
                  value={formData.field_of_study}
                  onChange={(event) => setFormData({ ...formData, field_of_study: event.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例如：计算机科学"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">开始日期 *</label>
                <input
                  type="date"
                  data-testid="education-start-date-input"
                  required
                  value={formData.start_date}
                  onChange={(event) => setFormData({ ...formData, start_date: event.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                <input
                  type="date"
                  data-testid="education-end-date-input"
                  value={formData.end_date}
                  onChange={(event) => setFormData({ ...formData, end_date: event.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
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
                data-testid="education-submit-btn"
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

export default EducationModal;
