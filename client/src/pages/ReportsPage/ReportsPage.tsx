import { useState, useEffect, useRef } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BriefcaseIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import * as echarts from 'echarts';
import api from '@/services/api';

interface ReportData {
  income: {
    total: number;
    byMonth: Array<{ month: string; amount: number }>;
    byProject: Array<{ project: string; amount: number }>;
  };
  expense: {
    total: number;
    byCategory: Array<{ category: string; amount: number }>;
  };
  profit: {
    total: number;
    margin: number;
  };
  worklogStats: {
    totalHours: number;
    billableHours: number;
    avgHoursPerDay: number;
  };
  worklogTrend?: Array<{ date: string; hours: number }>;
  invoiceStats?: {
    total: number;
    pending: number;
    approved: number;
    paid: number;
  };
  invoiceByMonth?: Array<{ month: string; amount: number; count: number }>;
}

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const worklogChartRef = useRef<HTMLDivElement>(null);
  const invoiceChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReport();
  }, [period]);

  useEffect(() => {
    if (reportData && !loading) {
      initWorklogChart();
      initInvoiceChart();
      initProjectPieChart();
    }
  }, [reportData, loading]);

  const initWorklogChart = () => {
    if (!worklogChartRef.current || !reportData?.worklogTrend) return;

    const chart = echarts.init(worklogChartRef.current);
    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c}小时',
      },
      xAxis: {
        type: 'category',
        data: reportData.worklogTrend.map(item => item.date),
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        name: '工时',
      },
      series: [
        {
          data: reportData.worklogTrend.map(item => item.hours),
          type: 'line',
          smooth: true,
          areaStyle: {
            opacity: 0.3,
          },
          itemStyle: {
            color: '#8B5CF6',
          },
        },
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true,
      },
    };

    chart.setOption(option);
    return () => chart.dispose();
  };

  const initInvoiceChart = () => {
    if (!invoiceChartRef.current || !reportData?.invoiceByMonth) return;

    const chart = echarts.init(invoiceChartRef.current);
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: ['发票金额', '发票数量'],
      },
      xAxis: {
        type: 'category',
        data: reportData.invoiceByMonth.map(item => item.month),
      },
      yAxis: [
        {
          type: 'value',
          name: '金额',
          axisLabel: {
            formatter: '¥{value}',
          },
        },
        {
          type: 'value',
          name: '数量',
        },
      ],
      series: [
        {
          name: '发票金额',
          type: 'bar',
          data: reportData.invoiceByMonth.map(item => item.amount),
          itemStyle: {
            color: '#10B981',
          },
        },
        {
          name: '发票数量',
          type: 'line',
          yAxisIndex: 1,
          data: reportData.invoiceByMonth.map(item => item.count),
          itemStyle: {
            color: '#F59E0B',
          },
        },
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true,
      },
    };

    chart.setOption(option);
    return () => chart.dispose();
  };

  const initProjectPieChart = () => {
    if (!pieChartRef.current || !reportData?.income?.byProject) return;

    const chart = echarts.init(pieChartRef.current);
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [
        {
          name: '项目收入',
          type: 'pie',
          radius: '60%',
          data: reportData.income.byProject.map(item => ({
            name: item.project,
            value: item.amount,
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          label: {
            formatter: '{b}\n¥{c}',
          },
        },
      ],
    };

    chart.setOption(option);
    return () => chart.dispose();
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/${period}`);
      
      // Mock data for testing charts - replace with actual API data
      const mockData: ReportData = {
        income: {
          total: response.data?.income?.total || 125000,
          byMonth: response.data?.income?.byMonth || [
            { month: '1 月', amount: 15000 },
            { month: '2 月', amount: 18000 },
            { month: '3 月', amount: 22000 },
            { month: '4 月', amount: 19000 },
            { month: '5 月', amount: 25000 },
            { month: '6 月', amount: 26000 },
          ],
          byProject: response.data?.income?.byProject || [
            { project: '电商平台开发', amount: 45000 },
            { project: '移动端 APP', amount: 38000 },
            { project: '企业官网', amount: 22000 },
            { project: '数据可视化', amount: 20000 },
          ],
        },
        expense: {
          total: response.data?.expense?.total || 35000,
          byCategory: response.data?.expense?.byCategory || [
            { category: '软件订阅', amount: 8000 },
            { category: '办公设备', amount: 12000 },
            { category: '培训学习', amount: 5000 },
            { category: '其他', amount: 10000 },
          ],
        },
        profit: {
          total: response.data?.profit?.total || 90000,
          margin: response.data?.profit?.margin || 72,
        },
        worklogStats: {
          totalHours: response.data?.worklogStats?.totalHours || 480,
          billableHours: response.data?.worklogStats?.billableHours || 420,
          avgHoursPerDay: response.data?.worklogStats?.avgHoursPerDay || 6.5,
        },
        worklogTrend: [
          { date: '2024-01-01', hours: 8 },
          { date: '2024-01-08', hours: 7.5 },
          { date: '2024-01-15', hours: 9 },
          { date: '2024-01-22', hours: 6.5 },
          { date: '2024-01-29', hours: 8.5 },
          { date: '2024-02-05', hours: 7 },
          { date: '2024-02-12', hours: 8 },
          { date: '2024-02-19', hours: 9.5 },
        ],
        invoiceStats: {
          total: 24,
          pending: 3,
          approved: 8,
          paid: 13,
        },
        invoiceByMonth: [
          { month: '1 月', amount: 15000, count: 3 },
          { month: '2 月', amount: 18000, count: 4 },
          { month: '3 月', amount: 22000, count: 5 },
          { month: '4 月', amount: 19000, count: 4 },
          { month: '5 月', amount: 25000, count: 5 },
          { month: '6 月', amount: 26000, count: 3 },
        ],
      };
      
      setReportData(mockData);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  if (loading || !reportData) {
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
          <h1 className="text-2xl font-bold text-gray-900">数据统计</h1>
          <p className="mt-1 text-sm text-gray-600">查看收入、支出和工时统计</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="monthly">本月</option>
          <option value="quarterly">本季度</option>
          <option value="yearly">本年度</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总收入</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(reportData.income.total)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+12.5%</span>
            <span className="text-gray-500 ml-1">较上期</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总支出</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(reportData.expense.total)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <ArrowTrendingDownIcon className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">-5.2%</span>
            <span className="text-gray-500 ml-1">较上期</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">净利润</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(reportData.profit.total)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-500">利润率</span>
            <span className="text-blue-600 font-medium ml-2">{reportData.profit.margin}%</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-testid="worklog-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总工时</p>
              <p className="text-2xl font-bold text-purple-600">
                {reportData.worklogStats.totalHours}h
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-500">日均</span>
            <span className="text-purple-600 font-medium ml-2">
              {reportData.worklogStats.avgHoursPerDay}h
            </span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Worklog Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <ClockIcon className="w-5 h-5 mr-2 text-purple-600" />
            工时趋势
          </h3>
          <div ref={worklogChartRef} className="h-64" data-testid="worklog-chart"></div>
        </div>

        {/* Invoice Stats Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <CurrencyDollarIcon className="w-5 h-5 mr-2 text-green-600" />
            发票统计
          </h3>
          <div ref={invoiceChartRef} className="h-64" data-testid="invoice-chart"></div>
        </div>
      </div>

      {/* Project Income Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <BriefcaseIcon className="w-5 h-5 mr-2 text-blue-600" />
          项目收入分布
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div ref={pieChartRef} className="h-64" data-testid="project-pie-chart"></div>
          <div className="space-y-3">
            {reportData?.income?.byProject?.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <BriefcaseIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-sm font-medium text-gray-900">{item.project}</span>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice Status Cards */}
      {reportData?.invoiceStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="invoice-status-cards">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-testid="invoice-total-card">
            <p className="text-sm text-gray-500">总发票数</p>
            <p className="text-2xl font-bold text-gray-900">{reportData.invoiceStats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-100 p-6" data-testid="invoice-pending-card">
            <p className="text-sm text-yellow-600">待审核</p>
            <p className="text-2xl font-bold text-yellow-600">{reportData.invoiceStats.pending}</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow-sm border border-green-100 p-6" data-testid="invoice-approved-card">
            <p className="text-sm text-green-600">已通过</p>
            <p className="text-2xl font-bold text-green-600">{reportData.invoiceStats.approved}</p>
          </div>
          <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-100 p-6" data-testid="invoice-paid-card">
            <p className="text-sm text-blue-600">已付款</p>
            <p className="text-2xl font-bold text-blue-600">{reportData.invoiceStats.paid}</p>
          </div>
        </div>
      )}

      {/* Invoice Stats Summary */}
      {reportData?.invoiceStats && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-testid="invoice-stats">
          <h3 className="font-semibold text-gray-900 mb-4">发票统计详情</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">总金额</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(reportData.invoiceByMonth?.reduce((sum, item) => sum + item.amount, 0) || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">平均每月</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency((reportData.invoiceByMonth?.reduce((sum, item) => sum + item.amount, 0) || 0) / (reportData.invoiceByMonth?.length || 1))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">总发票数</p>
              <p className="text-xl font-bold text-purple-600">{reportData.invoiceStats.total}张</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">付款率</p>
              <p className="text-xl font-bold text-green-600">
                {Math.round((reportData.invoiceStats.paid / reportData.invoiceStats.total) * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Export */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">导出报表</h3>
            <p className="text-sm text-gray-500">导出详细的财务报表数据</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            导出Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
