import mongoose from 'mongoose';

const createIndexes = async (): Promise<void> => {
  console.log('🔧 Creating database indexes...');

  try {
    const db = mongoose.connection.db;

    await db.collection('user_accounts').createIndex({ email: 1 }, { unique: true });
    await db.collection('user_accounts').createIndex({ user_type_id: 1 });
    await db.collection('user_accounts').createIndex({ is_active: 1 });
    await db.collection('user_accounts').createIndex({ created_at: -1 });

    await db.collection('freelancer_profiles').createIndex({ user_id: 1 }, { unique: true });
    await db.collection('freelancer_profiles').createIndex({ skill_category_ids: 1 });
    await db.collection('freelancer_profiles').createIndex({ skill_sub_category_ids: 1 });
    await db.collection('freelancer_profiles').createIndex({ availability_status: 1 });
    await db.collection('freelancer_profiles').createIndex({ is_verified: 1 });
    await db.collection('freelancer_profiles').createIndex({ 'rating.overall': -1 });

    await db.collection('project_requirements').createIndex({ company_id: 1 });
    await db.collection('project_requirements').createIndex({ posted_by: 1 });
    await db.collection('project_requirements').createIndex({ status: 1 });
    await db.collection('project_requirements').createIndex({ project_major_categories: 1 });
    await db.collection('project_requirements').createIndex({ project_sub_categories: 1 });
    await db.collection('project_requirements').createIndex({ created_at: -1 });
    await db.collection('project_requirements').createIndex({ start_date: 1 });
    await db.collection('project_requirements').createIndex({ company_id: 1, status: 1 });

    await db.collection('work_logs').createIndex({ freelancer_id: 1, work_date: -1 });
    await db.collection('work_logs').createIndex({ project_requirement_id: 1 });
    await db.collection('work_logs').createIndex({ company_id: 1 });
    await db.collection('work_logs').createIndex({ status: 1 });
    await db.collection('work_logs').createIndex({ freelancer_id: 1, status: 1 });
    await db.collection('work_logs').createIndex({ work_date: 1 });

    await db.collection('freelancer_invoices').createIndex({ invoice_number: 1 }, { unique: true });
    await db.collection('freelancer_invoices').createIndex({ freelancer_id: 1 });
    await db.collection('freelancer_invoices').createIndex({ company_id: 1 });
    await db.collection('freelancer_invoices').createIndex({ status: 1 });
    await db.collection('freelancer_invoices').createIndex({ created_at: -1 });
    await db.collection('freelancer_invoices').createIndex({ freelancer_id: 1, status: 1 });
    await db.collection('freelancer_invoices').createIndex({ due_date: 1 });

    await db.collection('contracts').createIndex({ project_id: 1 });
    await db.collection('contracts').createIndex({ freelancer_id: 1 });
    await db.collection('contracts').createIndex({ company_id: 1 });
    await db.collection('contracts').createIndex({ status: 1 });
    await db.collection('contracts').createIndex({ end_date: 1 });
    await db.collection('contracts').createIndex({ freelancer_id: 1, status: 1 });

    await db.collection('messages').createIndex({ recipient_id: 1, created_at: -1 });
    await db.collection('messages').createIndex({ recipient_id: 1, is_read: 1 });
    await db.collection('messages').createIndex({ related_id: 1 });

    await db.collection('ratings').createIndex({ reviewee_id: 1, created_at: -1 });
    await db.collection('ratings').createIndex({ reviewer_id: 1 });
    await db.collection('ratings').createIndex({ project_id: 1 });
    await db.collection('ratings').createIndex({ status: 1 });

    await db.collection('tickets').createIndex({ creator_id: 1 });
    await db.collection('tickets').createIndex({ assignee_id: 1 });
    await db.collection('tickets').createIndex({ status: 1 });
    await db.collection('tickets').createIndex({ priority: 1 });
    await db.collection('tickets').createIndex({ created_at: -1 });

    await db.collection('milestone_deliverables').createIndex({ project_requirement_id: 1, milestone_number: 1 });
    await db.collection('milestone_deliverables').createIndex({ freelancer_id: 1, status: 1 });
    await db.collection('milestone_deliverables').createIndex({ company_id: 1, status: 1 });
    await db.collection('milestone_deliverables').createIndex({ due_date: 1, status: 1 });

    await db.collection('payment_records').createIndex({ invoice_id: 1 });
    await db.collection('payment_records').createIndex({ status: 1 });
    await db.collection('payment_records').createIndex({ created_at: -1 });

    await db.collection('companies').createIndex({ company_name: 1 });
    await db.collection('companies').createIndex({ is_verified: 1 });

    console.log('✅ All database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
};

const dropIndexes = async (): Promise<void> => {
  console.log('🗑️ Dropping all indexes...');

  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
      await db.collection(collection.name).dropIndexes();
      console.log(`Dropped indexes for ${collection.name}`);
    }

    console.log('✅ All indexes dropped');
  } catch (error) {
    console.error('❌ Error dropping indexes:', error);
    throw error;
  }
};

export { createIndexes, dropIndexes };
