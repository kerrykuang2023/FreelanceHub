import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  StarIcon,
  CheckCircleIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import api from '@/services/api';
import PageHeader from '@/components/core-ui/PageHeader';
import PortalLayout from '@/components/layouts/portal/PortalLayout';

interface RatingDimension {
  score: number;
  comment?: string;
}

interface RatingFormData {
  project_id: string;
  reviewee_id: string;
  dimensions: {
    professional_skill: RatingDimension;
    work_attitude: RatingDimension;
    communication: RatingDimension;
    delivery_quality: RatingDimension;
  };
  overall_comment: string;
  is_anonymous: boolean;
}

const DIMENSION_CONFIG = {
  professional_skill: { label: '专业技能', description: '技术能力、专业知识水平' },
  work_attitude: { label: '工作态度', description: '责任心、主动性、配合度' },
  communication: { label: '沟通能力', description: '响应速度、表达清晰度' },
  delivery_quality: { label: '交付质量', description: '代码质量、按时交付' },
};

const CreateRatingPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [formData, setFormData] = useState<RatingFormData>({
    project_id: projectId || '',
    reviewee_id: '',
    dimensions: {
      professional_skill: { score: 5 },
      work_attitude: { score: 5 },
      communication: { score: 5 },
      delivery_quality: { score: 5 },
    },
    overall_comment: '',
    is_anonymous: false,
  });

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${projectId}`);
      if (response.data.success) {
        setProject(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (dimension: keyof typeof formData.dimensions, score: number) => {
    setFormData({
      ...formData,
      dimensions: {
        ...formData.dimensions,
        [dimension]: { ...formData.dimensions[dimension], score },
      },
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const response = await api.post('/ratings', formData);
      if (response.data.success) {
        navigate('/ratings');
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (dimension: keyof typeof formData.dimensions) => {
    const score = formData.dimensions[dimension].score;
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleScoreChange(dimension, star)}
            className="focus:outline-none"
          >
            {star <= score ? (
              <StarSolidIcon className="w-8 h-8 text-yellow-400" />
            ) : (
              <StarIcon className="w-8 h-8 text-gray-300" />
            )}
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">{score} 分</span>
      </div>
    );
  };

  const getAverageScore = () => {
    const scores = Object.values(formData.dimensions).map((d) => d.score);
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  };

  if (loading) {
    return (
      <PortalLayout title="提交评价">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="提交评价">
      <div className="space-y-6">
        <PageHeader
          title="提交评价"
          description="为已完成的项目提交协作评价。"
          breadcrumbs={[
            { label: "首页", href: "/" },
            { label: "评价管理", href: "/ratings" },
            { label: "提交评价" },
          ]}
        />

      <div className="max-w-3xl space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-sm text-gray-500">项目</p>
        <p className="mt-1 text-base font-semibold text-gray-900">{project?.project_title || '加载中...'}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">评分维度</h2>
        
        <div className="space-y-8">
          {Object.entries(DIMENSION_CONFIG).map(([key, config]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">{config.label}</h3>
                  <p className="text-sm text-gray-500">{config.description}</p>
                </div>
              </div>
              {renderStarRating(key as keyof typeof formData.dimensions)}
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-gray-900">综合评分</span>
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-blue-600">{getAverageScore()}</span>
              <span className="text-gray-500">/ 5.0</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">评价内容</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              详细评价
            </label>
            <textarea
              value={formData.overall_comment}
              onChange={(e) => setFormData({ ...formData, overall_comment: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请详细描述您的合作体验..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="anonymous"
              checked={formData.is_anonymous}
              onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="anonymous" className="ml-2 text-sm text-gray-600">
              匿名评价
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? '提交中...' : '提交评价'}
        </button>
      </div>
      </div>
      </div>
    </PortalLayout>
  );
};

export default CreateRatingPage;
