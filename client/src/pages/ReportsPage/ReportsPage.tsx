import { useEffect, useRef, useState } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BriefcaseIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import api from '@/services/api';

echarts.use([BarChart, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

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
  worklogTrend: Array<{ date: string; hours: number }>;
  invoiceStats: {
    total: number;
    pending: number;
    approved: number;
    paid: number;
  };
  invoiceByMonth: Array<{ month: string; amount: number; count: number }>;
}

const emptyReportData = (): ReportData => ({
  income: { total: 0, byMonth: [], byProject: [] },
  expense: { total: 0, byCategory: [] },
  profit: { total: 0, margin: 0 },
  worklogStats: { totalHours: 0, billableHours: 0, avgHoursPerDay: 0 },
  worklogTrend: [],
  invoiceStats: { total: 0, pending: 0, approved: 0, paid: 0 },
  invoiceByMonth: [],
});

const toNumber = (value: unknown) => Number(value ?? 0);

const normalizeReportData = (payload: any): ReportData => {
  const data = payload?.data || payload || {};
  const empty = emptyReportData();

  return {
    income: {
      total: toNumber(data.income?.total),
      byMonth: Array.isArray(data.income?.byMonth) ? data.income.byMonth : empty.income.byMonth,
      byProject: Array.isArray(data.income?.byProject) ? data.income.byProject : empty.income.byProject,
    },
    expense: {
      total: toNumber(data.expense?.total),
      byCategory: Array.isArray(data.expense?.byCategory) ? data.expense.byCategory : empty.expense.byCategory,
    },
    profit: {
      total: toNumber(data.profit?.total),
      margin: toNumber(data.profit?.margin),
    },
    worklogStats: {
      totalHours: toNumber(data.worklogStats?.totalHours),
      billableHours: toNumber(data.worklogStats?.billableHours),
      avgHoursPerDay: toNumber(data.worklogStats?.avgHoursPerDay),
    },
    worklogTrend: Array.isArray(data.worklogTrend) ? data.worklogTrend : empty.worklogTrend,
    invoiceStats: {
      total: toNumber(data.invoiceStats?.total),
      pending: toNumber(data.invoiceStats?.pending),
      approved: toNumber(data.invoiceStats?.approved),
      paid: toNumber(data.invoiceStats?.paid),
    },
    invoiceByMonth: Array.isArray(data.invoiceByMonth) ? data.invoiceByMonth : empty.invoiceByMonth,
  };
};

const formatCurrency = (amount: number) => `¥${amount.toLocaleString()}`;

const escapeCsv = (value: string | number) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [reportData, setReportData] = useState<ReportData>(emptyReportData());
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const worklogChartRef = useRef<HTMLDivElement>(null);
  const invoiceChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReport();
  }, [period]);

  useEffect(() => {
    if (loading) return;

    const disposers = [
      initWorklogChart(),
      initInvoiceChart(),
      initProjectPieChart(),
    ].filter(Boolean) as Array<() => void>;

    return () => {
      disposers.forEach((dispose) => dispose());
    };
  }, [reportData, loading]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/reports/${period}`);
      setReportData(normalizeReportData(response));
    } catch (error) {
      console.error('Failed to load report:', error);
      setError('报表数据暂时无法加载，已显示空统计。请稍后刷新重试。');
      setReportData(emptyReportData());
    } finally {
      setLoading(false);
    }
  };

  const initWorklogChart = () => {
    if (!worklogChartRef.current) return undefined;

    const chart = echarts.init(worklogChartRef.current);
    chart.setOption({
      tooltip: { trigger: 'axis', formatter: '{b}: {c} 小时' },
      xAxis: {
        type: 'category',
        data: reportData.worklogTrend.map((item) => item.date),
        axisLabel: { rotate: 45 },
      },
      yAxis: { type: 'value', name: '工时' },
      series: [
        {
          data: reportData.worklogTrend.map((item) => item.hours),
          type: 'line',
          smooth: true,
          areaStyle: { opacity: 0.3 },
          itemStyle: { color: '#8B5CF6' },
        },
      ],
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    });

    return () => chart.dispose();
  };

  const initInvoiceChart = () => {
    if (!invoiceChartRef.current) return undefined;

    const chart = echarts.init(invoiceChartRef.current);
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['发票金额', '发票数量'] },
      xAxis: { type: 'category', data: reportData.invoiceByMonth.map((item) => item.month) },
      yAxis: [
        { type: 'value', name: '金额', axisLabel: { formatter: '¥{value}' } },
        { type: 'value', name: '数量' },
      ],
      series: [
        {
          name: '发票金额',
          type: 'bar',
          data: reportData.invoiceByMonth.map((item) => item.amount),
          itemStyle: { color: '#10B981' },
        },
        {
          name: '发票数量',
          type: 'line',
          yAxisIndex: 1,
          data: reportData.invoiceByMonth.map((item) => item.count),
          itemStyle: { color: '#F59E0B' },
        },
      ],
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    });

    return () => chart.dispose();
  };

  const initProjectPieChart = () => {
    if (!pieChartRef.current) return undefined;

    const chart = echarts.init(pieChartRef.current);
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [
        {
          name: '项目收入',
          type: 'pie',
          radius: '60%',
          data: reportData.income.byProject.map((item) => ({ name: item.project, value: item.amount })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          label: { formatter: '{b}\n¥{c}' },
        },
      ],
    });

    return () => chart.dispose();
  };

  const handleExport = () => {
    setExporting(true);
    try {
      const rows = [
        ['指标', '数值'],
        ['总收入', reportData.income.total],
        ['总支出', reportData.expense.total],
        ['净利润', reportData.profit.total],
        ['利润率', `${reportData.profit.margin}%`],
        ['总工时', reportData.worklogStats.totalHours],
        ['可计费工时', reportData.worklogStats.billableHours],
        ['平均每日工时', reportData.worklogStats.avgHoursPerDay],
        ['总发票数', reportData.invoiceStats.total],
        ['待审核发票', reportData.invoiceStats.pending],
        ['已通过发票', reportData.invoiceStats.approved],
        ['已付款发票', reportData.invoiceStats.paid],
      ];
      const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `freelancehub-report-${period}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const paymentRate = reportData.invoiceStats.total > 0
    ? Math.round((reportData.invoiceStats.paid / reportData.invoiceStats.total) * 100)
    : 0;
  const invoiceMonthTotal = reportData.invoiceByMonth.reduce((sum, item) => sum + item.amount, 0);
  const avgInvoiceMonth = reportData.invoiceByMonth.length > 0
    ? invoiceMonthTotal / reportData.invoiceByMonth.length
    : 0;

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
          <h1 className="text-2xl font-bold text-gray-900">数据统计</h1>
          <p className="mt-1 text-sm text-gray-600">查看收入、支出、发票和工时统计</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as 'monthly' | 'quarterly' | 'yearly')}
          className="px-4 py-2 border border-gray-300 rounded-lg"
          aria-label="统计周期"
        >
          <option value="monthly">本月</option>
          <option value="quarterly">本季度</option>
          <option value="yearly">本年度</option>
        </select>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-testid="summary-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总收入</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.income.total)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-gray-500">已付款发票收入</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-testid="summary-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总支出</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.expense.total)}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <ArrowTrendingDownIcon className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-gray-500">企业侧已付款成本</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-testid="summary-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">净利润</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.profit.total)}</p>
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
              <p className="text-2xl font-bold text-purple-600">{reportData.worklogStats.totalHours}h</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-500">日均</span>
            <span className="text-purple-600 font-medium ml-2">{reportData.worklogStats.avgHoursPerDay}h</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <ClockIcon className="w-5 h-5 mr-2 text-purple-600" />
            工时趋势
          </h3>
          <div ref={worklogChartRef} className="h-64" data-testid="worklog-chart"></div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <CurrencyDollarIcon className="w-5 h-5 mr-2 text-green-600" />
            发票统计
          </h3>
          <div ref={invoiceChartRef} className="h-64" data-testid="invoice-chart"></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <BriefcaseIcon className="w-5 h-5 mr-2 text-blue-600" />
          项目收入分布
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div ref={pieChartRef} className="h-64" data-testid="project-pie-chart"></div>
          <div className="space-y-3">
            {reportData.income.byProject.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500">暂无已付款项目收入</div>
            ) : (
              reportData.income.byProject.map((item, i) => (
                <div key={`${item.project}-${i}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center min-w-0">
                    <BriefcaseIcon className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                    <span className="text-sm font-medium text-gray-900 truncate">{item.project}</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600 ml-4 shrink-0">{formatCurrency(item.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-testid="invoice-stats">
        <h3 className="font-semibold text-gray-900 mb-4">发票统计详情</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">总金额</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(invoiceMonthTotal)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">平均每期</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(avgInvoiceMonth)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">总发票数</p>
            <p className="text-xl font-bold text-purple-600">{reportData.invoiceStats.total}张</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">付款率</p>
            <p className="text-xl font-bold text-green-600">{paymentRate}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900">导出报表</h3>
            <p className="text-sm text-gray-500">导出当前周期的财务和工时统计</p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {exporting ? '导出中...' : '导出 Excel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
