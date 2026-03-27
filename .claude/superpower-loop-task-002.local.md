# Superpower Loop Task #002 - 完整端到端测试

## Status: in-progress

## Task Overview

基于动态数据流转验证原则，完成全场景全角色的端到端测试：
1. 验证前后端数据一致性
2. 验证业务操作后的状态流转
3. 验证跨角色业务流程完整性
4. 发现并修复所有问题

## Task Matrix

| ID | Task | Priority | Status | Dependencies | Skills |
|----|------|----------|--------|--------------|--------|
| T1 | 创建测试场景设计文档 | P0 | ✅ | - | - |
| T2 | 创建完整测试脚本 | P0 | ✅ | T1 | playwright |
| T3 | 运行测试数据初始化 | P0 | ✅ | - | - |
| T4 | 执行求职者场景测试 | P0 | 🔄 | T3 | playwright |
| T5 | 执行HR场景测试 | P0 | ⏳ | T4 | playwright |
| T6 | 执行管理员场景测试 | P0 | ⏳ | T5 | playwright |
| T7 | 执行跨角色流程测试 | P0 | ⏳ | T6 | playwright |
| T8 | 问题修复循环 | P0 | ⏳ | T7 | red-agent, green-agent |
| T9 | 回归测试验证 | P0 | ⏳ | T8 | playwright |

## Test Scenarios

### 求职者场景 (Freelancer)
| 场景ID | 场景名称 | 验证内容 | 状态 |
|--------|----------|----------|------|
| F-WL-01 | 工时列表数据一致性 | 前后端数量一致 | ⏳ |
| F-WL-02 | 提交工时审核 | draft→submitted状态流转 | ⏳ |
| F-INV-01 | 发票列表数据一致性 | 前后端数量一致 | ⏳ |

### HR场景 (HR Recruiter)
| 场景ID | 场景名称 | 验证内容 | 状态 |
|--------|----------|----------|------|
| H-PROJ-01 | 项目列表数据一致性 | 前后端数量一致 | ⏳ |
| H-WL-01 | 工时审核流程 | submitted→confirmed状态流转 | ⏳ |
| H-INV-01 | 发票审核流程 | submitted→approved状态流转 | ⏳ |

### 管理员场景 (Admin)
| 场景ID | 场景名称 | 验证内容 | 状态 |
|--------|----------|----------|------|
| A-USER-01 | 用户列表数据一致性 | 前后端数量一致 | ⏳ |
| A-COMP-01 | 企业列表数据一致性 | 前后端数量一致 | ⏳ |
| A-DASHBOARD-01 | 数据总览一致性 | 全平台数据统计 | ⏳ |

### 跨角色流程
| 场景ID | 场景名称 | 验证内容 | 状态 |
|--------|----------|----------|------|
| FLOW-COMPLETE | 完整业务链路 | 项目→工时→发票链路 | ⏳ |

## Issues Found
| Issue ID | Severity | Scenario | Description | Status |
|----------|----------|----------|-------------|--------|
| - | - | - | 待测试执行后记录 | - |

## Progress Log
- [2026-03-25] 📋 创建测试场景设计文档
- [2026-03-25] 📋 创建完整测试脚本
- [2026-03-25] 🔄 开始执行测试...

## Verification Results
- Pending: Test execution
