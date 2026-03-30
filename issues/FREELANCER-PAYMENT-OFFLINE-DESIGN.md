# 自由顾问平台 - 线下付款模式设计方案

## 一、线下付款核心流程

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           线下付款流程（线下转账 + 凭证上传）                              │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────┐    ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│  1. 工时已确认   │───▶│  2. 创建付款申请  │───▶│  3. 企业审批通过  │───▶│  4. 线下转账    │
│ (WorkLogBatch)  │    │ (PaymentRequest) │    │                 │    │               │
└────────────────┘    └────────────────┘    └────────────────┘    └────────────────┘
                                                                            │
                                                                            ▼
┌────────────────┐    ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│  8. 对账完成    │◀───│  7. 顾问确认收款  │◀───│  6. 上传付款凭证  │◀───│  5. 提交凭证    │
│                 │    │                 │    │ (PaymentRecord) │    │               │
└────────────────┘    └────────────────┘    └────────────────┘    └────────────────┘
```

## 二、核心数据模型

### 2.1 付款申请表 (PaymentRequest)

```typescript
interface PaymentRequest {
  _id: ObjectId;
  request_number: string;           // PR2024011500001
  freelancer_id: ObjectId;
  company_id: ObjectId;
  affiliation_id: ObjectId;
  project_requirement_id?: ObjectId;
  work_log_batch_id?: ObjectId;
  invoice_id?: ObjectId;

  request_type: "工时结算" | "项目款" | "预付款" | "尾款" | "里程碑款";
  billing_period_start?: Date;
  billing_period_end?: Date;

  requested_amount: number;          // 申请金额
  amount_breakdown: {
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    total_amount: number;
    is_tax_inclusive: boolean;
  };

  work_summary: {
    total_hours: number;
    work_details: string;
  };

  status: "draft" | "submitted" | "approved" | "rejected" |
          "payment_initiated" | "paid" | "cancelled";

  approval_info?: {
    approved_by: ObjectId;
    approved_at: Date;
    approval_comment: string;
  };

  rejection_info?: {
    rejected_by: ObjectId;
    rejected_at: Date;
    rejection_reason: string;
  };

  payment_info?: {
    payment_method: "银行转账" | "支付宝" | "微信支付" | "支票" | "现金";
    payment_initiated_at: Date;
    payment_reference: string;
  };

  expected_payment_date?: Date;
  notes?: string;
}
```

### 2.2 付款记录表 (PaymentRecord)

```typescript
interface PaymentRecord {
  _id: ObjectId;
  payment_request_id?: ObjectId;
  invoice_id?: ObjectId;
  work_log_batch_id?: ObjectId;

  freelancer_id: ObjectId;
  company_id: ObjectId;
  affiliation_id: ObjectId;
  project_requirement_id?: ObjectId;

  payment_type: "工时结算" | "项目款" | "预付款" | "尾款" | "退款" | "其他";
  payment_period_start?: Date;
  payment_period_end?: Date;

  billing_info: {
    total_hours: number;
    daily_rate: number;
    subtotal_amount: number;
    currency: string;
    is_tax_inclusive: boolean;
    tax_rate: number;
    tax_amount: number;
    total_amount: number;
  };

  applied_amount: number;           // 申请金额
  actual_payment_amount?: number;    // 实际付款金额（可能不同）
  currency: string;

  payment_method?: "银行转账" | "支付宝" | "微信支付" | "支票" | "现金" | "其他";
  payment_status: "pending" | "confirmed" | "rejected" | "completed";

  // 付款凭证（核心）
  payment_voucher: {
    voucher_number: string;          // 凭证编号
    voucher_url: string;             // 凭证文件URL
    uploaded_by: ObjectId;
    uploaded_at: Date;
    verification_status: "pending" | "verified" | "rejected";
    verified_by?: ObjectId;
    verified_at?: Date;
    rejection_reason?: string;
  };

  // 银行转账信息
  bank_transfer_info?: {
    from_bank_name: string;
    from_bank_account: string;
    from_account_holder: string;
    to_bank_name: string;
    to_bank_account: string;
    to_account_holder: string;
    transfer_reference: string;
    transfer_date: Date;
  };

  // 对账状态
  reconciliation_status: "unreconciled" | "partial" | "reconciled" | "disputed";
  reconciled_at?: Date;
  reconciled_by?: ObjectId;
}
```

## 三、线下付款交互流程

### 3.1 完整交互时序

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  自由顾问  │    │   平台    │    │   企业    │    │   猎头    │    │   挂靠企业 │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │               │
     │ 1.提交工时      │               │               │               │
     │───────────────▶│               │               │               │
     │               │               │               │               │
     │               │ 2.工时确认     │               │               │
     │               │───────────────▶│               │               │
     │               │               │               │               │
     │               │               │ 3.确认/驳回工时 │               │
     │               │◀──────────────│               │               │
     │               │               │               │               │
     │ 4.查看确认结果   │               │               │               │
     │◀───────────────│               │               │               │
     │               │               │               │               │
     │ 5.发起付款申请   │               │               │               │
     │───────────────▶│               │               │               │
     │               │               │               │               │
     │               │ 6.付款申请通知   │               │               │
     │               │───────────────▶│               │               │
     │               │               │               │               │
     │               │               │ 7.审批通过      │               │
     │               │◀──────────────│               │               │
     │               │               │               │               │
     │               │ 8.审批结果通知   │               │               │
     │◀───────────────│               │               │               │
     │               │               │               │               │
     │               │               │ 9.线下转账      │               │
     │               │               │───────────────▶│               │
     │               │               │               │               │
     │               │               │               │ 10.上传付款凭证 │
     │               │◀──────────────│               │               │
     │               │               │               │               │
     │ 11.确认收款     │               │               │               │
     │◀───────────────│               │               │               │
     │               │               │               │               │
     │               │ 12.对账确认     │               │               │
     │               │───────────────▶│               │               │
     │               │               │               │               │
     │               │               │ 13.对账完成    │               │
     │               │◀──────────────│               │               │
     │               │               │               │               │
```

### 3.2 各角色操作

#### 自由顾问操作

```
┌────────────────────────────────────────────────────────────────┐
│  我的付款                                                        │
├────────────────────────────────────────────────────────────────┤
│  待收款: ¥55,120        已收款: ¥320,500      对账中: ¥12,000   │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [待收款申请]                                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ PR20240115001 - SAP MM项目工时结算                         │  │
│  │ 申请金额: ¥55,120 (含税)                                   │  │
│  │ 关联工时: 2024-01-01 至 2024-01-15 (26小时)               │  │
│  │ 状态: 已审批通过，待付款                                    │  │
│  │ 期望付款日: 2024-01-31                                    │  │
│  │                                                               │  │
│  │              [查看详情]  [催款]                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [已收款]                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ PR20240101001 - SAP SD项目工时结算                         │  │
│  │ 收款金额: ¥48,000                                        │  │
│  │ 收款日期: 2024-01-05                                      │  │
│  │ 付款凭证: 付款凭证_20240105.pdf                           │  │
│  │ [查看凭证]                                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

#### 企业/猎头操作

```
┌────────────────────────────────────────────────────────────────┐
│  付款管理                                                        │
├────────────────────────────────────────────────────────────────┤
│  待审批: 3笔(¥128,000)   待付款: 5笔(¥280,000)   已付款: 45笔   │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [待审批列表]                                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 张工 - SAP MM顾问  |  申请¥55,120  |  2024-01-01~01-15   │  │
│  │ 工时: 26小时  |  日薪: ¥2,000/天  |  [查看工时]            │  │
│  │                                                    [审批] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [待付款列表]                                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 张工 - SAP MM顾问  |  ¥55,120  |  预计2024-01-31         │  │
│  │                                                    [付款] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  付款操作                                                        │
├────────────────────────────────────────────────────────────────┤
│  付款信息填写:                                                   │
│  ─────────────────                                              │
│  付款金额: [55,120        ] CNY                                │
│  付款方式: [银行转账        ▼]                                  │
│  付款日期: [2024-01-31   ]                                     │
│  备注:     [项目月度结算款  ]                                   │
│                                                                 │
│  上传凭证:                                                       │
│  ─────────────────                                              │
│  [选择文件] 或拖拽文件到此处                                     │
│  支持: JPG, PNG, PDF                                             │
│  已上传: 银行转账截图_20240131.jpg                               │
│                                                                 │
│                    [取消]  [确认付款]                           │
└────────────────────────────────────────────────────────────────┘
```

## 四、对账功能设计

### 4.1 对账核心逻辑

```
┌────────────────────────────────────────────────────────────────┐
│                         对账流程                               │
└────────────────────────────────────────────────────────────────┘

发起对账                    差异处理                    完成对账
    │                         │                         │
    ▼                         ▼                         ▼
┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
│企业发起 │───▶│系统匹配 │───▶│无差异   │───▶│顾问确认 │───▶│对账完成│
│对账请求 │    │付款记录 │    │自动通过 │    │         │    │        │
└────────┘    └────────┘    └────────┘    └────────┘    └────────┘
                   │               │
                   │有差异         │有差异
                   ▼               ▼
            ┌────────┐      ┌────────┐
            │差异明细 │      │发起争议│
            │显示      │      │处理    │
            └────────┘      └────────┘
```

### 4.2 对账数据模型

```typescript
interface Reconciliation {
  _id: ObjectId;
  reconciliation_number: string;    // RC20240115001

  freelancer_id: ObjectId;
  company_id: ObjectId;
  affiliation_id: ObjectId;

  billing_period_start: Date;
  billing_period_end: Date;

  total_records: number;
  matched_records: number;
  disputed_records: number;

  expected_amount: number;          // 应付金额
  actual_amount: number;           // 实付金额
  difference: number;               // 差异金额
  difference_reason?: string;

  records: [{
    work_log_id: ObjectId;
    invoice_id: ObjectId;
    payment_record_id: ObjectId;
    expected_hours: number;
    actual_hours?: number;
    expected_amount: number;
    actual_amount?: number;
    match_status: "matched" | "difference" | "missing" | "disputed";
    notes?: string;
  }];

  status: "pending" | "in_progress" | "completed" | "disputed";
  freelancer_confirmed: boolean;
  company_confirmed: boolean;
  confirmed_at?: Date;

  dispute_info?: {
    disputed_by: ObjectId;
    disputed_at: Date;
    reason: string;
    resolution?: string;
    resolved_by?: ObjectId;
    resolved_at?: Date;
  };
}
```

### 4.3 对账报表

```
┌─────────────────────────────────────────────────────────────────────┐
│                        对账报表 - 2024年1月                          │
├─────────────────────────────────────────────────────────────────────┤
│  顾问: 张工 (SAP MM顾问)            挂靠企业: 上海外包公司A            │
│  周期: 2024-01-01 至 2024-01-31    对账日期: 2024-02-01              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  付款明细:                                                            │
│  ┌────────┬────────┬────────┬────────┬────────┬────────┬─────────┐   │
│  │ 工时日期 │ 项目   │ 工时   │ 日薪   │ 应付   │ 实付   │ 差异    │   │
│  ├────────┼────────┼────────┼────────┼────────┼────────┼─────────┤   │
│  │ 01-02  │ SAP MM │ 8小时  │ ¥2,000 │ ¥16,000│ ¥16,000│ ¥0     │   │
│  │ 01-03  │ SAP MM │ 6小时  │ ¥2,000 │ ¥12,000│ ¥12,000│ ¥0     │   │
│  │ 01-04  │ SAP MM │ 8小时  │ ¥2,000 │ ¥16,000│ ¥16,000│ ¥0     │   │
│  │ 01-05  │ SAP MM │ 4小时  │ ¥2,000 │ ¥8,000 │ ¥7,120 │ ¥-880  │   │
│  └────────┴────────┴────────┴────────┴────────┴────────┴─────────┘   │
│                                                                      │
│  汇总:                                                               │
│  ├── 应付总额:    ¥52,000                                            │
│  ├── 实付总额:    ¥51,120                                            │
│  ├── 差异总额:    ¥-880 (待确认)                                      │
│  └── 差异原因:    01-05日工时确认8小时，实际付款按6小时计算               │
│                                                                      │
│  [导出Excel]  [导出PDF]                                               │
│                                                                      │
│  顾问确认: ○ 已确认  ● 未确认                                         │
│  企业确认: ○ 已确认  ● 未确认                                         │
│                                                                      │
│                    [发起争议]  [确认对账]                              │
└─────────────────────────────────────────────────────────────────────┘
```

## 五、统计报表功能

### 5.1 顾问收入统计

```
┌─────────────────────────────────────────────────────────────────────┐
│                      我的收入统计                                      │
├─────────────────────────────────────────────────────────────────────┤
│  本月收入: ¥55,120        累计收入: ¥375,620      待收款: ¥55,120     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  收入趋势 (最近6个月)                                                 │
│  ████████████████████████ ¥55,120 (1月)                          │
│  ████████████████████ ¥48,000 (12月)                               │
│  ██████████████████ ¥42,500 (11月)                                 │
│  ████████████████ ¥38,000 (10月)                                    │
│  ██████████████ ¥35,000 (9月)                                       │
│  ████████████ ¥32,000 (8月)                                         │
│                                                                      │
│  按项目分类:                                                          │
│  ├── SAP MM模块实施: ¥180,000 (48%)                                 │
│  ├── SAP SD模块实施: ¥120,000 (32%)                                 │
│  ├── SAP FICO咨询:   ¥55,620 (15%)                                 │
│  └── 其他项目:        ¥20,000 (5%)                                   │
│                                                                      │
│  按企业分类:                                                          │
│  ├── 上海外包公司A: ¥200,000 (53%)                                   │
│  ├── 北京猎头公司B: ¥120,000 (32%)                                   │
│  └── 杭州科技C:     ¥55,620 (15%)                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 企业付款统计

```
┌─────────────────────────────────────────────────────────────────────┐
│                      企业付款统计                                      │
├─────────────────────────────────────────────────────────────────────┤
│  本月已付: ¥280,000      本月待付: ¥128,000    累计已付: ¥1,250,000   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  付款状态分布:                                                        │
│  ████████████████ 已付款 ¥1,250,000 (78%)                          │
│  ████ 待付款 ¥280,000 (17%)                                          │
│  ██ 待审批 ¥80,000 (5%)                                              │
│                                                                      │
│  顾问费用明细:                                                        │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ 顾问姓名  │ 项目    │ 本月工时 │ 本月应付  │ 已付   │ 待付   │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 张工     │ SAP MM  │ 120小时  │ ¥240,000 │ ¥200K │ ¥40K  │   │
│  │ 李工     │ SAP SD  │ 80小时   │ ¥176,000 │ ¥176K │ ¥0    │   │
│  │ 王工     │ JAVA    │ 100小时  │ ¥120,000 │ ¥80K  │ ¥40K  │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  [导出付款明细]  [生成月度报表]                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 六、税务计算（保留含税/不含税选项）

### 6.1 税额计算

```typescript
// 计算示例：日薪2000元/天，工作15天

// 情况1：含税价（企业包税）
const grossAmount = 2000 * 15;  // 30,000元
// 增值税（6%）= 30,000 / 1.06 * 0.06 = 1,698.11元
// 不含税金额 = 30,000 - 1,698.11 = 28,301.89元

// 情况2：不含税价（顾问实得）
const netAmount = 2000 * 15;    // 30,000元
// 增值税（6%）= 30,000 * 0.06 = 1,800元
// 价税合计 = 30,000 + 1,800 = 31,800元
```

### 6.2 发票处理

```
┌─────────────────────────────────────────────────────────────────────┐
│  开票信息                                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  发票类型:  ○ 增值税专用发票  ● 增值税普通发票  ○ 个人发票              │
│                                                                      │
│  价税分离:  ● 含税价  ○ 不含税价                                       │
│                                                                      │
│  ────────────────────────────────────────────────────────────────   │
│                                                                      │
│  劳务明细:                                                            │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ 序号 │ 项目/日期     │ 数量  │ 单价   │ 金额    │ 税率  │ 税额  │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  1  │ SAP MM顾问服务│ 15天  │ 2,000  │ 30,000  │ 6%   │1,800 │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  金额计算:                                                           │
│  ├── 不含税金额:           ¥30,000.00                               │
│  ├── 增值税率 (6%):         ¥1,800.00                               │
│  ├── 价税合计:            ¥31,800.00                                 │
│  └── 大写: 叁万壹仟捌佰元整                                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 七、API 接口设计

### 7.1 付款相关接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/payment-requests | 创建付款申请 |
| GET | /api/payment-requests | 获取付款申请列表 |
| GET | /api/payment-requests/:id | 获取付款申请详情 |
| PUT | /api/payment-requests/:id | 更新付款申请 |
| POST | /api/payment-requests/:id/submit | 提交付款申请 |
| POST | /api/payment-requests/:id/approve | 审批通过 |
| POST | /api/payment-requests/:id/reject | 审批拒绝 |
| POST | /api/payment-requests/:id/mark-paid | 标记已付款 |
| POST | /api/payment-requests/:id/remind | 催款 |

### 7.2 付款记录接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/payment-records | 创建付款记录 |
| GET | /api/payment-records | 获取付款记录列表 |
| GET | /api/payment-records/:id | 获取付款记录详情 |
| POST | /api/payment-records/:id/upload-voucher | 上传付款凭证 |
| POST | /api/payment-records/:id/confirm-receipt | 确认收款 |
| POST | /api/payment-records/:id/verify | 验证凭证 |

### 7.3 对账接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/reconciliations | 发起对账 |
| GET | /api/reconciliations | 获取对账列表 |
| GET | /api/reconciliations/:id | 获取对账详情 |
| POST | /api/reconciliations/:id/confirm | 确认对账 |
| POST | /api/reconciliations/:id/dispute | 发起争议 |
| GET | /api/reconciliations/report | 生成对账报表 |

## 八、消息通知设计

### 8.1 通知类型

| 通知类型 | 触发时机 | 接收人 |
|---------|---------|-------|
| 工时确认通知 | 企业确认工时 | 顾问 |
| 付款申请提交 | 顾问提交付款申请 | 企业 |
| 付款申请审批 | 企业审批通过/拒绝 | 顾问 |
| 付款提醒 | 付款逾期前3天 | 企业 |
| 付款凭证上传 | 企业上传凭证 | 顾问 |
| 收款确认 | 顾问确认收款 | 企业 |
| 对账邀请 | 企业发起对账 | 顾问 |
| 对账完成 | 双方确认对账 | 双方 |

### 8.2 消息模板

```
【付款申请已审批通过】
尊敬的张工，您提交的付款申请 PR20240115001 已审批通过。
申请金额: ¥55,120.00
预计付款日期: 2024-01-31
请留意银行账户收款，如有疑问请联系您的项目经理。

【上传付款凭证】
贵司申请的付款 ¥55,120.00 已处理。
付款凭证已上传至平台，请登录查看确认。
确认收款后，本月工时结算即完成。
```

## 九、数据权限设计

### 9.1 角色数据权限

| 角色 | 可见数据 |
|------|---------|
| 自由顾问 | 仅本人付款申请、收款记录 |
| 挂靠企业 | 本企业所有顾问的付款申请、付款记录 |
| 外包/猎头 | 本企业发布的所有项目相关付款数据 |
| 终端企业 | 本企业需求相关的付款数据 |
| 平台运营 | 所有数据，可查看统计报表 |

### 9.2 敏感操作权限

| 操作 | 需要权限 |
|------|---------|
| 创建付款申请 | 顾问本人 |
| 审批付款申请 | 企业付款审批人 |
| 上传付款凭证 | 企业财务人员 |
| 确认收款 | 顾问本人 |
| 发起对账 | 双方均可 |
| 确认对账 | 双方均可 |

## 十、系统预留扩展点

### 10.1 AI能力预留（暂不实现）

```typescript
// 预留接口
interface AIAnalysisService {
  // 智能工时审核
  analyzeWorkLog(workLog: WorkLog): {
    isReasonable: boolean;
    anomalyScore: number;
    suggestions: string[];
  };

  // 智能付款预测
  predictPaymentDate(request: PaymentRequest): {
    expectedDate: Date;
    confidence: number;
  };

  // 异常检测
  detectAnomaly(data: any): {
    isAnomaly: boolean;
    anomalyType: string;
    severity: 'low' | 'medium' | 'high';
  };
}
```

### 10.2 在线支持预留（暂不实现）

```typescript
// 预留接口
interface OnlineSupportService {
  // 工时拍照上传（暂不实现）
  uploadWorkPhoto(photo: File, workLogId: string): Promise<WorkPhoto>;

  // 位置打卡（暂不实现）
  checkIn(location: Location): Promise<CheckInRecord>;

  // 在线客服（暂不实现）
  sendMessage(message: ChatMessage): Promise<void>;
}

// 预留数据结构
interface WorkPhoto {
  photo_url: string;
  taken_at: Date;
  location?: Location;
  work_log_id?: string;
}
```

## 十一、数据库索引设计

```javascript
// PaymentRequest 索引
db.payment_request.createIndex({ "request_number": 1 }, { unique: true });
db.payment_request.createIndex({ "freelancer_id": 1, "status": 1 });
db.payment_request.createIndex({ "company_id": 1, "status": 1 });
db.payment_request.createIndex({ "status": 1, "submitted_at": -1 });
db.payment_request.createIndex({ "expected_payment_date": 1 });

// PaymentRecord 索引
db.payment_record.createIndex({ "freelancer_id": 1, "payment_period_end": -1 });
db.payment_record.createIndex({ "company_id": 1, "payment_status": 1 });
db.payment_record.createIndex({ "invoice_id": 1 });
db.payment_record.createIndex({ "payment_voucher.voucher_number": 1 });
db.payment_record.createIndex({ "reconciliation_status": 1 });

// Reconciliation 索引
db.reconciliation.createIndex({ "reconciliation_number": 1 }, { unique: true });
db.reconciliation.createIndex({ "freelancer_id": 1, "billing_period_start": -1 });
db.reconciliation.createIndex({ "company_id": 1, "status": 1 });
db.reconciliation.createIndex({ "status": 1 });
```

## 十二、关键业务流程状态机

### 12.1 付款申请状态流转

```
                                    ┌─────────────┐
                                    │   draft     │  草稿
                                    └──────┬──────┘
                                           │ submit
                                           ▼
                                    ┌─────────────┐
                              ┌─────│  submitted  │ 已提交
                              │     └──────┬──────┘
                              │            │
              ┌───────────────┼────────────┼───────────────┐
              │               │            │               │
              ▼               ▼            │               │
       ┌─────────────┐ ┌─────────────┐   │               │
       │  rejected   │ │  approved   │   │               │
       │   已拒绝     │ │   已审批    │   │               │
       └─────────────┘ └──────┬──────┘               │
                               │ payment_initiated
                               ▼                        │
                        ┌─────────────┐                 │
                        │payment_init │ 付款发起        │
                        └──────┬──────┘                 │
                               │                        │
                               ▼                        │
                        ┌─────────────┐                 │
                        │    paid     │ 已付款           │
                        └──────┬──────┘                 │
                               │                        │
                               ▼                        │
                        ┌─────────────┐                 │
                        │  confirmed  │ 顾问确认收款    │
                        └──────┬──────┘                 │
                               │                        │
                               ▼                        │
                        ┌─────────────┐                 │
                        │ completed   │ 流程完成         │
                        └─────────────┘                 │
                                                        │
                       ┌────────────────────────────────┘
                       │
                       ▼
                ┌─────────────┐
                │ cancelled   │ 已取消
                └─────────────┘
```

### 12.2 凭证验证状态

```
┌─────────────┐    upload    ┌─────────────┐    verify    ┌─────────────┐
│   pending   │─────────────▶│  uploaded   │─────────────▶│  verified   │
│    待上传    │              └──────┬──────┘              └─────────────┘
└─────────────┘                     │ verified = false
                                    ▼
                             ┌─────────────┐
                             │  rejected   │
                             │    被拒     │
                             └─────────────┘
```

## 十三、安全设计

### 13.1 敏感操作

- 付款凭证上传需签名验证
- 银行账户信息加密存储
- 对账操作需双方确认
- 敏感操作日志记录

### 13.2 数据安全

- 付款记录不可删除，仅可作废
- 所有财务操作需审计日志
- 凭证文件安全存储
