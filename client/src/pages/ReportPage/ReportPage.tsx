import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HttpService from '@/core/http.service';
import PageHeader from '@/components/core-ui/PageHeader';
import PortalLayout from '@/components/layouts/portal/PortalLayout';

type ReportType = 
  | 'spam'
  | 'harassment'
  | 'fake_profile'
  | 'scam'
  | 'inappropriate_content'
  | 'copyright'
  | 'payment_issue'
  | 'contract_dispute'
  | 'other';

type TargetType = 'user' | 'project' | 'job' | 'message' | 'invoice' | 'worklog';

interface ReportPageProps {
  targetType?: TargetType;
  targetId?: string;
  targetUserId?: string;
  onClose?: () => void;
}

const ReportPage: React.FC<ReportPageProps> = ({
  targetType: initialTargetType,
  targetId: initialTargetId,
  targetUserId,
  onClose,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    target_type: initialTargetType || 'user',
    target_id: initialTargetId || '',
    target_user_id: targetUserId || '',
    report_type: '' as ReportType,
    description: '',
    attachments: [] as string[],
  });

  const http = new HttpService();

  const reportTypes: { value: ReportType; label: string; description: string }[] = [
    { value: 'spam', label: '垃圾信息', description: '发送垃圾广告或重复信息' },
    { value: 'harassment', label: '骚扰行为', description: '言语攻击、威胁或骚扰' },
    { value: 'fake_profile', label: '虚假资料', description: '使用虚假身份或信息' },
    { value: 'scam', label: '诈骗行为', description: '欺诈、骗取钱财或信息' },
    { value: 'inappropriate_content', label: '不当内容', description: '发布违法或不当内容' },
    { value: 'copyright', label: '版权侵权', description: '侵犯知识产权或版权' },
    { value: 'payment_issue', label: '支付问题', description: '拒绝付款或付款纠纷' },
    { value: 'contract_dispute', label: '合同纠纷', description: '违反合同约定' },
    { value: 'other', label: '其他问题', description: '其他需要举报的问题' },
  ];

  const targetTypes: { value: TargetType; label: string }[] = [
    { value: 'user', label: '用户' },
    { value: 'project', label: '项目' },
    { value: 'job', label: '职位' },
    { value: 'message', label: '消息' },
    { value: 'invoice', label: '发票' },
    { value: 'worklog', label: '工时记录' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.report_type || !formData.description) {
      alert('请填写完整的举报信息');
      return;
    }

    if (formData.description.length < 20) {
      alert('请详细描述举报内容（至少20字）');
      return;
    }

    try {
      setLoading(true);
      await http.post('user-reports', formData);
      alert('举报已提交，我们会尽快处理');
      if (onClose) {
        onClose();
      } else {
        navigate('/profile/reports');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || '提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalLayout title="提交举报">
      <div className="space-y-6">
        <PageHeader
          title="提交举报"
          description="如果您发现违规行为，请提交举报。我们会认真处理每一份举报。"
          breadcrumbs={[
            { label: "首页", href: "/" },
            { label: "提交举报" },
          ]}
        />
      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">提交举报</h1>
            <p className="mt-1 text-sm text-gray-500">
              如果您发现违规行为，请提交举报。我们会认真处理每一份举报。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                举报对象类型 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.target_type}
                onChange={(e) => setFormData({ ...formData, target_type: e.target.value as TargetType })}
                disabled={!!initialTargetType}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
              >
                {targetTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {!initialTargetId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  举报对象ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.target_id}
                  onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                  placeholder="请输入要举报的对象ID"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                举报类型 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {reportTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.report_type === type.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report_type"
                      value={type.value}
                      checked={formData.report_type === type.value}
                      onChange={(e) => setFormData({ ...formData, report_type: e.target.value as ReportType })}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="ml-3">
                      <span className="block text-sm font-medium text-gray-900">{type.label}</span>
                      <span className="block text-xs text-gray-500">{type.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                详细描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                placeholder="请详细描述您要举报的内容，包括时间、经过、证据等（至少20字）"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.description.length}/2000 字符
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">举报须知</h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• 请确保举报内容真实有效，恶意举报将受到处罚</li>
                <li>• 我们会在3个工作日内处理您的举报</li>
                <li>• 处理结果将通过站内消息通知您</li>
                <li>• 如有证据文件，请在描述中说明，我们会联系您获取</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => onClose ? onClose() : navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading || !formData.report_type || formData.description.length < 20}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '提交中...' : '提交举报'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </PortalLayout>
  );
};

export default ReportPage;
