import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import api from '@/services/api';

interface Contract {
  _id: string;
  contract_number: string;
  contract_title: string;
  project_id: {
    _id: string;
    project_title: string;
  };
  freelancer_id: {
    _id: string;
    user_name: string;
  };
  company_id: {
    _id: string;
    company_name: string;
  };
  status: 'draft' | 'pending_signature' | 'active' | 'expired' | 'terminated';
  start_date: string;
  end_date: string;
  total_amount?: number;
  currency: string;
  created_at: string;
}

const STATUS_CONFIG = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  pending_signature: { label: '待签署', color: 'bg-yellow-100 text-yellow-800' },
  active: { label: '生效中', color: 'bg-green-100 text-green-800' },
  expired: { label: '已过期', color: 'bg-red-100 text-red-800' },
  terminated: { label: '已终止', color: 'bg-gray-100 text-gray-600' },
};

const ContractsPage = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadContracts();
  }, [statusFilter]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/contracts', {
        params: { status: statusFilter !== 'all' ? statusFilter : undefined },
      });
      if (response.data.success) {
        setContracts(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (id: string) => {
    try {
      await api.post(`/contracts/${id}/sign`);
      loadContracts();
    } catch (error) {
      console.error('Failed to sign contract:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">合同管理</h1>
          <p className="mt-1 text-sm text-gray-600">管理您的所有合同</p>
        </div>
        <Link
          to="/contracts/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          创建合同
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">全部状态</option>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>

        {contracts.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {contracts.map((contract) => (
              <div key={contract._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{contract.contract_title}</h3>
                      <p className="text-sm text-gray-500">{contract.contract_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[contract.status].color}`}>
                      {STATUS_CONFIG[contract.status].label}
                    </span>
                    <Link to={`/contracts/${contract._id}`} className="text-blue-600 hover:text-blue-700">
                      <EyeIcon className="w-5 h-5" />
                    </Link>
                    {contract.status === 'pending_signature' && (
                      <button
                        onClick={() => handleSign(contract._id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        签署
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">暂无合同</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractsPage;
