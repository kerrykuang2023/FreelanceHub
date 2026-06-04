import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

const CertificationModal: React.FC<CertificationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    certification_name: initialData?.certification_name || '',
    issuing_organization: initialData?.issuing_organization || '',
    issue_date: initialData?.issue_date?.split('T')[0] || '',
    expiry_date: initialData?.expiry_date?.split('T')[0] || '',
    credential_id: initialData?.credential_id || '',
    credential_url: initialData?.credential_url || '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        certification_name: initialData?.certification_name || '',
        issuing_organization: initialData?.issuing_organization || '',
        issue_date: initialData?.issue_date?.split('T')[0] || '',
        expiry_date: initialData?.expiry_date?.split('T')[0] || '',
        credential_id: initialData?.credential_id || '',
        credential_url: initialData?.credential_url || '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData };
    if (!data.expiry_date) delete data.expiry_date;
    if (!data.credential_id) delete data.credential_id;
    if (!data.credential_url) delete data.credential_url;
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
              {initialData ? '编辑证书' : '添加证书'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">证书名称 *</label>
              <input
                type="text"
                data-testid="certification-name-input"
                required
                value={formData.certification_name}
                onChange={(e) => setFormData({ ...formData, certification_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="如: AWS Solutions Architect"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">颁发机构 *</label>
              <input
                type="text"
                data-testid="certification-issuer-input"
                required
                value={formData.issuing_organization}
                onChange={(e) => setFormData({ ...formData, issuing_organization: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="如: Amazon Web Services"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">颁发日期 *</label>
                <input
                  type="date"
                  data-testid="certification-issue-date-input"
                  required
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">有效期至</label>
                <input
                  type="date"
                  data-testid="certification-expiry-date-input"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">证书编号</label>
              <input
                type="text"
                data-testid="certification-credential-id-input"
                value={formData.credential_id}
                onChange={(e) => setFormData({ ...formData, credential_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="如: AWS-123456"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">证书链接</label>
              <input
                type="url"
                data-testid="certification-credential-url-input"
                value={formData.credential_url}
                onChange={(e) => setFormData({ ...formData, credential_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://..."
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
                data-testid="certification-submit-btn"
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

export default CertificationModal;
