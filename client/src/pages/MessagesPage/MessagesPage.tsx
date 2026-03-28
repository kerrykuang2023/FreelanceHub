import { useState, useEffect } from 'react';
import {
  BellIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ChatBubbleLeftRightIcon,
  FunnelIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import notificationService, { INotification } from '@/services/notifications.service';

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  system: { icon: BellIcon, color: 'text-blue-600 bg-blue-100', label: '系统通知' },
  application: { icon: BriefcaseIcon, color: 'text-purple-600 bg-purple-100', label: '项目申请' },
  worklog: { icon: ClockIcon, color: 'text-orange-600 bg-orange-100', label: '工时通知' },
  invoice: { icon: DocumentTextIcon, color: 'text-green-600 bg-green-100', label: '发票通知' },
  payment: { icon: CurrencyDollarIcon, color: 'text-emerald-600 bg-emerald-100', label: '付款通知' },
  message: { icon: ChatBubbleLeftRightIcon, color: 'text-indigo-600 bg-indigo-100', label: '消息' },
  project: { icon: BriefcaseIcon, color: 'text-cyan-600 bg-cyan-100', label: '项目通知' },
};

const MessagesPage = () => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedNotification, setSelectedNotification] = useState<INotification | null>(null);
  const [stats, setStats] = useState({ total: 0, unread: 0 });

  useEffect(() => {
    loadNotifications();
    loadStats();
  }, [activeTab, typeFilter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications({
        is_read: activeTab === 'unread' ? false : undefined,
        type: typeFilter || undefined,
        limit: 50,
      });
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await notificationService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, is_read: true } : n))
      );
      setStats((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setStats((prev) => ({ ...prev, unread: 0 }));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setStats((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const filteredNotifications = notifications;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">消息中心</h1>
          <p className="text-sm text-gray-500 mt-1">
            查看系统通知、项目更新和重要消息
          </p>
        </div>
        {stats.unread > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            全部标记已读
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  activeTab === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                全部 ({stats.total})
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  activeTab === 'unread'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                未读 ({stats.unread})
              </button>
            </div>
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部类型</option>
                {Object.entries(typeConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <BellIcon className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无消息</h3>
            <p className="text-sm text-gray-500">
              {activeTab === 'unread' ? '您已阅读所有消息' : '新消息将显示在这里'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => {
              const config = typeConfig[notification.type] || typeConfig.system;
              const IconComponent = config.icon;

              return (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => {
                    setSelectedNotification(notification);
                    if (!notification.is_read) {
                      handleMarkAsRead(notification._id);
                    }
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {config.label}
                          </span>
                          {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(notification.created_at).toLocaleString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 mt-1">{notification.title}</h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {notification.content}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification._id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedNotification && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black opacity-30"
              onClick={() => setSelectedNotification(null)}
            ></div>
            <div className="relative bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {typeConfig[selectedNotification.type]?.label || '通知'}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(selectedNotification.created_at).toLocaleString('zh-CN')}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {selectedNotification.title}
              </h3>
              <p className="text-gray-600 whitespace-pre-wrap">
                {selectedNotification.content}
              </p>
              {selectedNotification.link && (
                <div className="mt-4 pt-4 border-t">
                  <a
                    href={selectedNotification.link}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    查看详情 →
                  </a>
                </div>
              )}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
