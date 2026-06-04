import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TicketIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import api from '@/services/api';

interface Ticket {
  _id: string;
  title: string;
  description: string;
  category: 'dispute' | 'complaint' | 'question' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'processing' | 'arbitration' | 'resolved' | 'closed';
  creator_id: {
    _id: string;
    user_name: string;
  };
  assignee_id?: {
    _id: string;
    user_name: string;
  };
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

const CATEGORY_CONFIG = {
  dispute: { label: '纠纷', color: 'bg-red-100 text-red-800' },
  complaint: { label: '投诉', color: 'bg-orange-100 text-orange-800' },
  question: { label: '咨询', color: 'bg-blue-100 text-blue-800' },
  other: { label: '其他', color: 'bg-gray-100 text-gray-800' },
};

const PRIORITY_CONFIG = {
  low: { label: '低', color: 'bg-gray-100 text-gray-600' },
  medium: { label: '中', color: 'bg-blue-100 text-blue-800' },
  high: { label: '高', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: '紧急', color: 'bg-red-100 text-red-800' },
};

const STATUS_CONFIG = {
  pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-800', icon: ChatBubbleLeftRightIcon },
  arbitration: { label: '仲裁中', color: 'bg-purple-100 text-purple-800', icon: ExclamationTriangleIcon },
  resolved: { label: '已解决', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
  closed: { label: '已关闭', color: 'bg-gray-100 text-gray-600', icon: CheckCircleIcon },
};

const TicketsPage = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    resolved: 0,
  });

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const [ticketsRes, statsRes] = await Promise.all([
        api.get('/tickets', {
          params: { status: statusFilter !== 'all' ? statusFilter : undefined },
        }),
        api.get('/tickets/stats'),
      ]);

      if (ticketsRes.data.success) {
        setTickets(ticketsRes.data.data?.items || []);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN');
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工单管理</h1>
          <p className="mt-1 text-sm text-gray-600">处理纠纷、投诉和咨询</p>
        </div>
        <Link
          to="/tickets/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          创建工单
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总工单</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <TicketIcon className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待处理</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">处理中</p>
              <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已解决</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tickets List */}
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

        {tickets.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      ticket.status === 'resolved' ? 'bg-green-100' :
                      ticket.status === 'pending' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      <TicketIcon className={`w-6 h-6 ${
                        ticket.status === 'resolved' ? 'text-green-600' :
                        ticket.status === 'pending' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{ticket.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_CONFIG[ticket.category].color}`}>
                          {CATEGORY_CONFIG[ticket.category].label}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_CONFIG[ticket.priority].color}`}>
                          {PRIORITY_CONFIG[ticket.priority].label}优先级
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ticket.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>创建者: {ticket.creator_id?.user_name}</span>
                        <span>创建于 {formatDate(ticket.created_at)}</span>
                        {ticket.assignee_id && (
                          <span>处理人: {ticket.assignee_id.user_name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[ticket.status].color}`}>
                      {STATUS_CONFIG[ticket.status].label}
                    </span>
                    <Link
                      to={`/tickets/${ticket._id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      查看详情
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <TicketIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">暂无工单</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsPage;
