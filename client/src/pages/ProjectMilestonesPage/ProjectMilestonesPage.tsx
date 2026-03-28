import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  FlagIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import api from '@/services/api';

interface Milestone {
  _id: string;
  project_requirement_id: string;
  milestone_number: number;
  milestone_name: string;
  description: string;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  status: 'planned' | 'in_progress' | 'at_risk' | 'overdue' | 'submitted' | 'approved';
  completion_percentage: number;
  deliverables: Array<{
    deliverable_name: string;
    deliverable_description: string;
    deliverable_url?: string;
    is_approved: boolean;
  }>;
  billing_info: {
    milestone_amount: number;
    currency: string;
    is_invoiced: boolean;
  };
}

const STATUS_CONFIG = {
  planned: { label: '计划中', color: 'bg-gray-100 text-gray-800', icon: FlagIcon },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-800', icon: PlayIcon },
  at_risk: { label: '有风险', color: 'bg-yellow-100 text-yellow-800', icon: ExclamationTriangleIcon },
  overdue: { label: '已逾期', color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon },
  submitted: { label: '已提交', color: 'bg-purple-100 text-purple-800', icon: DocumentTextIcon },
  approved: { label: '已批准', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
};

const ProjectMilestonesPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({
    totalMilestones: 0,
    completedMilestones: 0,
    inProgressMilestones: 0,
    overdueMilestones: 0,
    overallProgress: 0,
  });

  useEffect(() => {
    loadMilestones();
  }, [projectId]);

  const loadMilestones = async () => {
    try {
      setLoading(true);
      const [milestonesRes, progressRes] = await Promise.all([
        api.get(`/milestones`, { params: { project_id: projectId } }),
        api.get(`/milestones/project/${projectId}/progress`),
      ]);
      
      if (milestonesRes.data.success) {
        setMilestones(milestonesRes.data.data?.items || []);
      }
      if (progressRes.data.success) {
        setProgress(progressRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN');
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
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
          <h1 className="text-2xl font-bold text-gray-900">项目进度看板</h1>
          <p className="mt-1 text-sm text-gray-600">跟踪项目里程碑和交付进度</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <PlusIcon className="w-5 h-5 mr-2" />
          添加里程碑
        </button>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总里程碑</p>
              <p className="text-2xl font-bold text-gray-900">{progress.totalMilestones}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FlagIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已完成</p>
              <p className="text-2xl font-bold text-green-600">{progress.completedMilestones}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">进行中</p>
              <p className="text-2xl font-bold text-blue-600">{progress.inProgressMilestones}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <PlayIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已逾期</p>
              <p className="text-2xl font-bold text-red-600">{progress.overdueMilestones}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">整体进度</h3>
          <span className="text-2xl font-bold text-blue-600">{progress.overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progress.overallProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Milestones Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-6">里程碑时间线</h3>

        {milestones.length > 0 ? (
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6">
              {milestones.map((milestone, index) => {
                const StatusIcon = STATUS_CONFIG[milestone.status].icon;
                const daysRemaining = getDaysRemaining(milestone.planned_end_date);
                
                return (
                  <div key={milestone._id} className="relative pl-16">
                    <div className={`absolute left-6 w-5 h-5 rounded-full border-4 border-white ${
                      milestone.status === 'approved' ? 'bg-green-500' :
                      milestone.status === 'overdue' ? 'bg-red-500' :
                      milestone.status === 'in_progress' ? 'bg-blue-500' :
                      'bg-gray-300'
                    }`}></div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-gray-900">
                              里程碑 {milestone.milestone_number}: {milestone.milestone_name}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[milestone.status].color}`}>
                              {STATUS_CONFIG[milestone.status].label}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                          
                          <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                            <span className="flex items-center">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              {formatDate(milestone.planned_start_date)} - {formatDate(milestone.planned_end_date)}
                            </span>
                            {milestone.status !== 'approved' && milestone.status !== 'overdue' && (
                              <span className={`flex items-center ${daysRemaining <= 3 ? 'text-red-500' : ''}`}>
                                {daysRemaining > 0 ? `剩余 ${daysRemaining} 天` : '已到期'}
                              </span>
                            )}
                            {milestone.billing_info?.milestone_amount > 0 && (
                              <span className="text-blue-600 font-medium">
                                ¥{milestone.billing_info.milestone_amount.toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>完成度</span>
                              <span>{milestone.completion_percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  milestone.status === 'approved' ? 'bg-green-500' :
                                  milestone.status === 'overdue' ? 'bg-red-500' :
                                  'bg-blue-500'
                                }`}
                                style={{ width: `${milestone.completion_percentage}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Deliverables */}
                          {milestone.deliverables && milestone.deliverables.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-medium text-gray-500 mb-2">交付物</p>
                              <div className="space-y-1">
                                {milestone.deliverables.map((deliverable, i) => (
                                  <div key={i} className="flex items-center text-sm">
                                    {deliverable.is_approved ? (
                                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                                    ) : (
                                      <ClockIcon className="w-4 h-4 text-gray-400 mr-2" />
                                    )}
                                    <span className={deliverable.is_approved ? 'text-gray-600' : 'text-gray-400'}>
                                      {deliverable.deliverable_name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="ml-4 flex items-center space-x-2">
                          {milestone.status === 'planned' && (
                            <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                              开始
                            </button>
                          )}
                          {milestone.status === 'in_progress' && (
                            <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                              提交
                            </button>
                          )}
                          {milestone.status === 'submitted' && (
                            <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                              批准
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <FlagIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">暂无里程碑</p>
            <button className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700">
              <PlusIcon className="w-5 h-5 mr-1" />
              添加第一个里程碑
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectMilestonesPage;
