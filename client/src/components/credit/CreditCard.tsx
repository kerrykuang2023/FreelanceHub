import React, { useState, useEffect } from 'react';
import HttpService from '@/core/http.service';

interface CreditInfo {
  balance: number;
  level: string;
  levelInfo: {
    name: string;
    color: string;
    icon: string;
    benefits: string[];
  };
  totalEarned: number;
  totalSpent: number;
  stats: {
    levelProgress: {
      current: number;
      next: number;
      progress: number;
    };
  };
}

interface CreditCardProps {
  className?: string;
  showDetails?: boolean;
}

const CreditCard: React.FC<CreditCardProps> = ({ className = '', showDetails = true }) => {
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const http = new HttpService();

  useEffect(() => {
    fetchCreditInfo();
  }, []);

  const fetchCreditInfo = async () => {
    try {
      setLoading(true);
      const response = await http.get('credits/my');
      setCreditInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch credit info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!creditInfo) {
    return null;
  }

  const { balance, level, levelInfo, totalEarned, totalSpent, stats } = creditInfo;

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <div className={`bg-gradient-to-r ${
        level === 'platinum' ? 'from-purple-500 to-purple-700' :
        level === 'gold' ? 'from-yellow-400 to-yellow-600' :
        level === 'silver' ? 'from-gray-400 to-gray-600' :
        'from-amber-600 to-amber-800'
      } p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">信用积分</p>
            <p className="text-3xl font-bold mt-1">{balance.toLocaleString()}</p>
          </div>
          <div className="text-4xl">{levelInfo.icon}</div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>{levelInfo.name}</span>
            {stats.levelProgress.progress < 100 && (
              <span>距离下一等级还需 {stats.levelProgress.next - balance} 分</span>
            )}
          </div>
          <div className="w-full bg-white/30 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${Math.min(100, stats.levelProgress.progress)}%` }}
            />
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-500">累计获得</p>
              <p className="text-xl font-bold text-green-600">+{totalEarned.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-500">累计扣减</p>
              <p className="text-xl font-bold text-red-600">-{totalSpent.toLocaleString()}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">会员权益</h4>
            <ul className="space-y-2">
              {levelInfo.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export { CreditCard };
export default CreditCard;
