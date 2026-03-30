import { Page, APIRequestContext, expect } from '@playwright/test';

export interface DataConsistencyResult {
  passed: boolean;
  frontendData: any;
  backendData: any;
  differences: string[];
  message: string;
}

export interface WorkLogFrontendData {
  id: string;
  status: string;
  hours: number;
  description: string;
  date: string;
}

export interface WorkLogBackendData {
  _id: string;
  status: string;
  hours_worked: number;
  work_description: string;
  work_date: string;
}

export interface InvoiceFrontendData {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
}

export interface InvoiceBackendData {
  _id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
}

export interface ProjectFrontendData {
  id: string;
  title: string;
  status: string;
  applicantCount?: number;
}

export interface ProjectBackendData {
  _id: string;
  job_title: string;
  status: string;
  applications?: any[];
}

const API_BASE_URL = 'http://localhost:5555/api/v1';

export class DataConsistencyVerifier {
  private authToken: string;

  constructor(authToken: string) {
    this.authToken = authToken;
  }

  static async getAuthToken(request: APIRequestContext, email: string, password: string): Promise<string> {
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { email, password }
    });
    const data = await response.json();
    return data.data?.token || data.token;
  }

  async verifyWorkLogConsistency(
    page: Page,
    request: APIRequestContext,
    workLogId: string,
    expectedStatus?: string
  ): Promise<DataConsistencyResult> {
    const differences: string[] = [];
    
    const frontendData = await this.captureWorkLogFromUI(page, workLogId);
    const backendData = await this.getWorkLogFromAPI(request, workLogId);
    
    if (!frontendData || !backendData) {
      return {
        passed: false,
        frontendData,
        backendData,
        differences: ['无法获取数据'],
        message: `数据获取失败 - 前端: ${frontendData ? '有' : '无'}, 后端: ${backendData ? '有' : '无'}`
      };
    }

    if (frontendData.status !== backendData.status) {
      differences.push(`状态不一致: 前端=${frontendData.status}, 后端=${backendData.status}`);
    }

    if (expectedStatus && backendData.status !== expectedStatus) {
      differences.push(`状态不符合预期: 期望=${expectedStatus}, 实际=${backendData.status}`);
    }

    if (frontendData.hours !== backendData.hours_worked) {
      differences.push(`工时不一致: 前端=${frontendData.hours}, 后端=${backendData.hours_worked}`);
    }

    return {
      passed: differences.length === 0,
      frontendData,
      backendData,
      differences,
      message: differences.length === 0 ? '数据一致性验证通过' : `发现 ${differences.length} 处不一致`
    };
  }

  async verifyInvoiceConsistency(
    page: Page,
    request: APIRequestContext,
    invoiceId: string,
    expectedStatus?: string
  ): Promise<DataConsistencyResult> {
    const differences: string[] = [];
    
    const frontendData = await this.captureInvoiceFromUI(page, invoiceId);
    const backendData = await this.getInvoiceFromAPI(request, invoiceId);
    
    if (!frontendData || !backendData) {
      return {
        passed: false,
        frontendData,
        backendData,
        differences: ['无法获取数据'],
        message: `数据获取失败 - 前端: ${frontendData ? '有' : '无'}, 后端: ${backendData ? '有' : '无'}`
      };
    }

    if (frontendData.status !== backendData.status) {
      differences.push(`状态不一致: 前端=${frontendData.status}, 后端=${backendData.status}`);
    }

    if (expectedStatus && backendData.status !== expectedStatus) {
      differences.push(`状态不符合预期: 期望=${expectedStatus}, 实际=${backendData.status}`);
    }

    const frontendAmount = Number(frontendData.totalAmount);
    const backendAmount = Number(backendData.total_amount);
    if (Math.abs(frontendAmount - backendAmount) > 0.01) {
      differences.push(`金额不一致: 前端=${frontendAmount}, 后端=${backendAmount}`);
    }

    return {
      passed: differences.length === 0,
      frontendData,
      backendData,
      differences,
      message: differences.length === 0 ? '数据一致性验证通过' : `发现 ${differences.length} 处不一致`
    };
  }

  async verifyProjectConsistency(
    page: Page,
    request: APIRequestContext,
    projectId: string
  ): Promise<DataConsistencyResult> {
    const differences: string[] = [];
    
    const frontendData = await this.captureProjectFromUI(page, projectId);
    const backendData = await this.getProjectFromAPI(request, projectId);
    
    if (!frontendData || !backendData) {
      return {
        passed: false,
        frontendData,
        backendData,
        differences: ['无法获取数据'],
        message: `数据获取失败 - 前端: ${frontendData ? '有' : '无'}, 后端: ${backendData ? '有' : '无'}`
      };
    }

    if (frontendData.status !== backendData.status) {
      differences.push(`状态不一致: 前端=${frontendData.status}, 后端=${backendData.status}`);
    }

    return {
      passed: differences.length === 0,
      frontendData,
      backendData,
      differences,
      message: differences.length === 0 ? '数据一致性验证通过' : `发现 ${differences.length} 处不一致`
    };
  }

  async verifyListCountConsistency(
    page: Page,
    request: APIRequestContext,
    listType: 'worklogs' | 'invoices' | 'projects' | 'applications',
    expectedCount?: number
  ): Promise<DataConsistencyResult> {
    const differences: string[] = [];
    
    const frontendCount = await this.captureListCountFromUI(page, listType);
    const backendCount = await this.getListCountFromAPI(request, listType);
    
    if (frontendCount !== backendCount) {
      differences.push(`数量不一致: 前端=${frontendCount}, 后端=${backendCount}`);
    }

    if (expectedCount !== undefined && backendCount !== expectedCount) {
      differences.push(`数量不符合预期: 期望=${expectedCount}, 实际=${backendCount}`);
    }

    return {
      passed: differences.length === 0,
      frontendData: { count: frontendCount },
      backendData: { count: backendCount },
      differences,
      message: differences.length === 0 
        ? `列表数量一致: ${frontendCount} 条` 
        : `发现不一致: ${differences.join('; ')}`
    };
  }

  private async captureWorkLogFromUI(page: Page, workLogId: string): Promise<WorkLogFrontendData | null> {
    try {
      const workLogCard = page.locator(`[data-worklog-id="${workLogId}"], [data-id="${workLogId}"]`).first();
      
      if (!await workLogCard.isVisible({ timeout: 3000 })) {
        const allCards = page.locator('[data-testid="work-log-card"], [data-testid="worklog-item"]');
        const count = await allCards.count();
        for (let i = 0; i < count; i++) {
          const card = allCards.nth(i);
          const id = await card.getAttribute('data-worklog-id') || await card.getAttribute('data-id');
          if (id === workLogId) {
            return await this.extractWorkLogDataFromCard(card);
          }
        }
        return null;
      }
      
      return await this.extractWorkLogDataFromCard(workLogCard);
    } catch (error) {
      console.error('捕获前端工时数据失败:', error);
      return null;
    }
  }

  private async extractWorkLogDataFromCard(card: any): Promise<WorkLogFrontendData> {
    const statusText = await card.locator('[data-testid="status"], .status-badge').textContent() || '';
    const hoursText = await card.locator('[data-testid="hours"], .hours').textContent() || '0';
    const description = await card.locator('[data-testid="description"], .description').textContent() || '';
    const date = await card.locator('[data-testid="date"], .date').textContent() || '';
    
    return {
      id: await card.getAttribute('data-worklog-id') || await card.getAttribute('data-id') || '',
      status: this.normalizeStatus(statusText),
      hours: parseFloat(hoursText.replace(/[^0-9.]/g, '')) || 0,
      description: description.trim(),
      date: date.trim()
    };
  }

  private async captureInvoiceFromUI(page: Page, invoiceId: string): Promise<InvoiceFrontendData | null> {
    try {
      const invoiceCard = page.locator(`[data-invoice-id="${invoiceId}"], [data-id="${invoiceId}"]`).first();
      
      if (!await invoiceCard.isVisible({ timeout: 3000 })) {
        return null;
      }
      
      const statusText = await invoiceCard.locator('[data-testid="status"], .status-badge').textContent() || '';
      const invoiceNumber = await invoiceCard.locator('[data-testid="invoice-number"], .invoice-number').textContent() || '';
      const amountText = await invoiceCard.locator('[data-testid="total-amount"], .total-amount').textContent() || '0';
      
      return {
        id: invoiceId,
        invoiceNumber: invoiceNumber.trim(),
        status: this.normalizeStatus(statusText),
        totalAmount: parseFloat(amountText.replace(/[^0-9.]/g, '')) || 0
      };
    } catch (error) {
      console.error('捕获前端发票数据失败:', error);
      return null;
    }
  }

  private async captureProjectFromUI(page: Page, projectId: string): Promise<ProjectFrontendData | null> {
    try {
      const projectCard = page.locator(`[data-project-id="${projectId}"], [data-id="${projectId}"]`).first();
      
      if (!await projectCard.isVisible({ timeout: 3000 })) {
        return null;
      }
      
      const title = await projectCard.locator('[data-testid="project-title"], h3, .title').textContent() || '';
      const statusText = await projectCard.locator('[data-testid="status"], .status-badge').textContent() || '';
      
      return {
        id: projectId,
        title: title.trim(),
        status: this.normalizeStatus(statusText)
      };
    } catch (error) {
      console.error('捕获前端项目数据失败:', error);
      return null;
    }
  }

  private async captureListCountFromUI(page: Page, listType: string): Promise<number> {
    try {
      let selector = '';
      switch (listType) {
        case 'worklogs':
          selector = '[data-testid="work-log-card"], [data-testid="worklog-item"], .work-log-item';
          break;
        case 'invoices':
          selector = '[data-testid="invoice-card"], [data-testid="invoice-item"], .invoice-item';
          break;
        case 'projects':
          selector = '[data-testid="project-card"], [data-testid="job-card"], .project-card';
          break;
        case 'applications':
          selector = '[data-testid="application-card"], [data-testid="application-item"], .application-item';
          break;
      }
      
      const items = page.locator(selector);
      return await items.count();
    } catch (error) {
      console.error('捕获前端列表数量失败:', error);
      return 0;
    }
  }

  private async getWorkLogFromAPI(request: APIRequestContext, workLogId: string): Promise<WorkLogBackendData | null> {
    try {
      const response = await request.get(`${API_BASE_URL}/work-logs/${workLogId}`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (!response.ok()) return null;
      
      const data = await response.json();
      const workLog = data.data || data;
      
      return {
        _id: workLog._id,
        status: workLog.status,
        hours_worked: workLog.hours_worked,
        work_description: workLog.work_description,
        work_date: workLog.work_date
      };
    } catch (error) {
      console.error('获取后端工时数据失败:', error);
      return null;
    }
  }

  private async getInvoiceFromAPI(request: APIRequestContext, invoiceId: string): Promise<InvoiceBackendData | null> {
    try {
      const response = await request.get(`${API_BASE_URL}/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (!response.ok()) return null;
      
      const data = await response.json();
      const invoice = data.data || data;
      
      return {
        _id: invoice._id,
        invoice_number: invoice.invoice_number,
        status: invoice.status,
        total_amount: invoice.total_amount
      };
    } catch (error) {
      console.error('获取后端发票数据失败:', error);
      return null;
    }
  }

  private async getProjectFromAPI(request: APIRequestContext, projectId: string): Promise<ProjectBackendData | null> {
    try {
      const response = await request.get(`${API_BASE_URL}/jobs/${projectId}`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (!response.ok()) return null;
      
      const data = await response.json();
      const project = data.data || data;
      
      return {
        _id: project._id,
        job_title: project.job_title,
        status: project.status,
        applications: project.applications
      };
    } catch (error) {
      console.error('获取后端项目数据失败:', error);
      return null;
    }
  }

  private async getListCountFromAPI(request: APIRequestContext, listType: string): Promise<number> {
    try {
      let endpoint = '';
      switch (listType) {
        case 'worklogs':
          endpoint = `${API_BASE_URL}/work-logs`;
          break;
        case 'invoices':
          endpoint = `${API_BASE_URL}/invoices`;
          break;
        case 'projects':
          endpoint = `${API_BASE_URL}/jobs`;
          break;
        case 'applications':
          endpoint = `${API_BASE_URL}/applications`;
          break;
      }
      
      const response = await request.get(endpoint, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (!response.ok()) return 0;
      
      const data = await response.json();
      const items = data.data?.items || data.data || data.items || data;
      
      if (Array.isArray(items)) {
        return items.length;
      }
      
      return 0;
    } catch (error) {
      console.error('获取后端列表数量失败:', error);
      return 0;
    }
  }

  private normalizeStatus(status: string): string {
    const statusMap: Record<string, string> = {
      '草稿': 'draft',
      '待审核': 'submitted',
      '已提交': 'submitted',
      '已确认': 'confirmed',
      '已驳回': 'rejected',
      '已开票': 'invoiced',
      '已发布': 'published',
      '进行中': 'in_progress',
      '已完成': 'completed',
      '已付款': 'paid',
      '已收款': 'received',
      '待审批': 'submitted',
      '已审批': 'approved',
      'draft': 'draft',
      'submitted': 'submitted',
      'confirmed': 'confirmed',
      'rejected': 'rejected',
      'invoiced': 'invoiced',
      'published': 'published',
      'in_progress': 'in_progress',
      'completed': 'completed',
      'paid': 'paid',
      'received': 'received',
      'approved': 'approved'
    };
    
    const normalized = status.toLowerCase().trim();
    return statusMap[normalized] || statusMap[status.trim()] || normalized;
  }

  async waitForDataSync(page: Page, timeout: number = 5000): Promise<void> {
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  }

  async refreshPageAndWait(page: Page): Promise<void> {
    await page.reload();
    await this.waitForDataSync(page);
  }

  async verifyStatusTransition(
    page: Page,
    request: APIRequestContext,
    itemId: string,
    itemType: 'worklog' | 'invoice',
    fromStatus: string,
    toStatus: string,
    action: () => Promise<void>
  ): Promise<DataConsistencyResult> {
    console.log(`  📋 验证状态转换: ${fromStatus} → ${toStatus}`);
    
    let backendData: any;
    if (itemType === 'worklog') {
      backendData = await this.getWorkLogFromAPI(request, itemId);
    } else {
      backendData = await this.getInvoiceFromAPI(request, itemId);
    }
    
    if (!backendData) {
      return {
        passed: false,
        frontendData: null,
        backendData: null,
        differences: ['无法获取初始数据'],
        message: '无法获取操作前的数据'
      };
    }
    
    const initialStatus = backendData.status;
    console.log(`  📊 初始状态: ${initialStatus}`);
    
    if (this.normalizeStatus(initialStatus) !== this.normalizeStatus(fromStatus)) {
      return {
        passed: false,
        frontendData: null,
        backendData,
        differences: [`初始状态不匹配: 期望=${fromStatus}, 实际=${initialStatus}`],
        message: '初始状态不符合预期'
      };
    }
    
    await action();
    
    await this.waitForDataSync(page);
    
    if (itemType === 'worklog') {
      backendData = await this.getWorkLogFromAPI(request, itemId);
    } else {
      backendData = await this.getInvoiceFromAPI(request, itemId);
    }
    
    if (!backendData) {
      return {
        passed: false,
        frontendData: null,
        backendData: null,
        differences: ['无法获取操作后数据'],
        message: '无法获取操作后的数据'
      };
    }
    
    const finalStatus = backendData.status;
    console.log(`  📊 最终状态: ${finalStatus}`);
    
    if (this.normalizeStatus(finalStatus) !== this.normalizeStatus(toStatus)) {
      return {
        passed: false,
        frontendData: null,
        backendData,
        differences: [`状态转换失败: 期望=${toStatus}, 实际=${finalStatus}`],
        message: `状态未正确转换: ${fromStatus} → ${finalStatus} (期望: ${toStatus})`
      };
    }
    
    return {
      passed: true,
      frontendData: null,
      backendData,
      differences: [],
      message: `状态转换成功: ${fromStatus} → ${toStatus}`
    };
  }
}
