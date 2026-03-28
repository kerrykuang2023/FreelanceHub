import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  StarIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import httpService from '@/core/http.service';
import { useAuth } from '@/providers';

interface RatingDimension {
  professional_skill: number;
  work_attitude: number;
  communication: number;
  delivery_quality: number;
}

interface Rating {
  _id: string;
  project_id: {
    _id: string;
    project_title: string;
  };
  reviewer_id: {
    _id: string;
    user_name?: string;
    user_image?: string;
  };
  reviewee_id: {
    _id: string;
    user_name?: string;
    user_image?: string;
  };
  reviewer_type: 'company' | 'freelancer';
  reviewee_type: 'company' | 'freelancer';
  dimensions: RatingDimension;
  overall_score: number;
  comment?: string;
  is_anonymous: boolean;
  reply?: {
    content: string;
    created_at: string;
  };
  created_at: string;
}

const DIMENSION_LABELS = {
  professional_skill: '专业技能',
  work_attitude: '工作态度',
  communication: '沟通能力',
  delivery_quality: '交付质量',
};

const RatingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'given'>('received');
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);

  useEffect(() => {
    loadRatings();
  }, [activeTab, user]);

  const loadRatings = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: 1,
        pageSize: 50,
      };

      if (activeTab === 'received') {
        params.reviewee_id = user?._id;
      } else {
        params.reviewer_id = user?._id;
      }

      const response = await httpService.get('/ratings', { params });
      setRatings((response as any).data?.items || []);
    } catch (error) {
      console.error('Failed to load ratings:', error);
      setRatings([]);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      i < Math.floor(score) ? (
        <StarSolidIcon key={i} className="w-4 h-4 text-yellow-400" />
      ) : (
        <StarIcon key={i} className="w-4 h-4 text-gray-300" />
      )
    ));
  };

  const getReviewerName = (rating: Rating) => {
    if (rating.is_anonymous) {
      return rating.reviewer_type === 'company' ? '匿名企业' : '匿名顾问';
    }
    return rating.reviewer_id?.user_name || '未知用户';
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
          <h1 className="text-2xl font-bold text-gray-900">评价管理</h1>
          <p className="text-sm text-gray-500 mt-1">查看和管理您的评价记录</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <div className="flex space-x-4 px-6 py-4">
            <button
              onClick={() => setActiveTab('received')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'received'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              收到的评价
            </button>
            <button
              onClick={() => setActiveTab('given')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'given'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              发出的评价
            </button>
          </div>
        </div>

        {ratings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <StarIcon className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无评价</h3>
            <p className="text-sm text-gray-500">
              {activeTab === 'received' ? '您还没有收到任何评价' : '您还没有发出任何评价'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {ratings.map((rating) => (
              <div
                key={rating._id}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedRating(rating)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    {rating.reviewer_type === 'company' ? (
                      <BuildingOfficeIcon className="w-6 h-6 text-gray-500" />
                    ) : (
                      <UserCircleIcon className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {activeTab === 'received' ? getReviewerName(rating) : rating.reviewee_id?.user_name || '未知用户'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {rating.reviewer_type === 'company' ? '企业评价' : '顾问评价'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(rating.created_at).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">{renderStars(rating.overall_score)}</div>
                      <span className="text-sm font-medium text-gray-700">{rating.overall_score.toFixed(1)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {rating.comment || '无评价内容'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      项目: {rating.project_id?.project_title || '未知项目'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedRating && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black opacity-30"
              onClick={() => setSelectedRating(null)}
            ></div>
            <div className="relative bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">评价详情</h3>
                <span className="text-sm text-gray-400">
                  {new Date(selectedRating.created_at).toLocaleDateString('zh-CN')}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(selectedRating.overall_score)}</div>
                    <span className="text-xl font-bold text-blue-600">
                      {selectedRating.overall_score.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  {Object.entries(selectedRating.dimensions).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{DIMENSION_LABELS[key as keyof typeof DIMENSION_LABELS]}</span>
                      <div className="flex items-center gap-1">
                        {renderStars(value)}
                        <span className="text-sm font-medium ml-1">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">评价内容</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {selectedRating.comment || '无评价内容'}
                  </p>
                </div>

                {selectedRating.reply && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">回复</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedRating.reply.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      回复于 {new Date(selectedRating.reply.created_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500">
                    项目: {selectedRating.project_id?.project_title || '未知项目'}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedRating(null)}
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

export default RatingsPage;
