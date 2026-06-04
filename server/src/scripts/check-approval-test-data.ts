const mongoose = require('mongoose');

async function checkApprovalTestData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/freelancehub');
    const db = mongoose.connection.db;
    
    console.log('\n========================================');
    console.log('  检查审批测试公司数�?);
    console.log('========================================\n');
    
    // 审批测试公司 ID
    const approvalTestCompanyId = '69c487eae54c541bc125ae00';
    
    // 检查该公司的工�?
    const workLogs = await db.collection('work_log').find({
      company_id: new mongoose.Types.ObjectId(approvalTestCompanyId)
    }).toArray();
    
    console.log(`审批测试公司的工时记�? ${workLogs.length} 条`);
    for (const w of workLogs) {
      console.log(`  - ${w._id} | 状�? ${w.status} | 描述: ${w.work_description}`);
    }
    
    // 检查该公司的发�?
    const invoices = await db.collection('freelancer_invoice').find({
      company_id: new mongoose.Types.ObjectId(approvalTestCompanyId)
    }).toArray();
    
    console.log(`\n审批测试公司的发票记�? ${invoices.length} 条`);
    for (const i of invoices) {
      console.log(`  - ${i._id} | 状�? ${i.status} | 描述: ${i.description}`);
    }
    
    // 检查所有待审批工时
    const allSubmittedWorkLogs = await db.collection('work_log').find({ status: 'submitted' }).toArray();
    console.log(`\n所有待审批工时: ${allSubmittedWorkLogs.length} 条`);
    for (const w of allSubmittedWorkLogs) {
      console.log(`  - ${w._id} | company_id: ${w.company_id} | 匹配审批测试公司: ${w.company_id?.toString() === approvalTestCompanyId ? '�? : '�?}`);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('错误:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkApprovalTestData();
