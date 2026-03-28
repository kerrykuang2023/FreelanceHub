import React, { useState, useEffect } from 'react';
import HttpService from '@/core/http.service';
import { useAuth } from '@/providers/AuthProvider/AuthProvider';

interface RoleApproval {
  _id: string;
  role_type: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_data: any;
  reviewed_at?: Date;
  review_notes?: string;
  rejection_reason?: string;
  created_at: Date;
  expires_at: Date;
}

const MyRoleApprovalsPage: React.FC = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<RoleApproval[]>([]);
  const [loading, setLoading] = useState(true);

  const http = new HttpService();

  useEffect(() => {
    fetchMyApprovals();
  }, []);

  const fetchMyApprovals = async () => {
    try {
      setLoading(true);
      const response = await http.get('auth/my-role-approvals');
      setApprovals(response.data || []);
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (roleType: string) => {
    const labels: Record<string, string> = {
      job_seeker: '求职者',
      hr_recruiter: 'HR招聘官',
      admin: '管理员',
    };
    return labels[roleType] || roleType;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            审批中
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            已批准
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            已拒绝
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">我的角色申请记录</h1>
          <p className="mt-1 text-sm text-gray-500">查看您的角色申请状态和历史记录</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">加载中...</p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无申请记录</h3>
            <p className="mt-1 text-sm text-gray-500">您还没有提交过角色申请</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((approval) => (
              <div key={approval._id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        approval.status === 'approved' ? 'bg-green-100' :
                        approval.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
                      }`}>
                        {approval.role_type === 'job_seeker' ? (
                          <svg className={`w-6 h-6 ${
                            approval.status === 'approved' ? 'text-green-600' :
                            approval.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className={`w-6 h-6 ${
                            approval.status === 'approved' ? 'text-green-600' :
                            approval.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getRoleLabel(approval.role_type)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          申请时间: {formatDate(approval.created_at)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(approval.status)}
                  </div>

                  {approval.status === 'pending' && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-700">
                        您的申请正在审核中，请耐心等待。如有疑问请联系客服。
                      </p>
                    </div>
                  )}

                  {approval.status === 'rejected' && approval.rejection_reason && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg">
                      <h4 className="text-sm font-medium text-red-800 mb-1">拒绝原因</h4>
                      <p className="text-sm text-red-700">{approval.rejection_reason}</p>
                    </div>
                  )}

                  {approval.review_notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">审核备注</h4>
                      <p className="text-sm text-gray-600">{approval.review_notes}</p>
                    </div>
                  )}

                  {approval.reviewed_at && (
                    <div className="mt-4 text-sm text-gray-500">
                      审核时间: {formatDate(approval.reviewed_at)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRoleApprovalsPage;
