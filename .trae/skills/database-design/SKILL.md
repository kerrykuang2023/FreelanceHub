---
name: "database-design"
description: "MongoDB/Mongoose database design patterns. Invoke when creating models, schemas, indexes, or designing data relationships for the freelancer platform."
---

# Database Design

Comprehensive guide for designing MongoDB schemas with Mongoose ODM, focusing on data integrity, performance optimization, and proper indexing strategies.

## Schema Design Principles

### 1. General Guidelines

- Use meaningful field names in camelCase
- Add descriptive comments for complex fields
- Set appropriate field lengths for strings
- Use proper data types (Date for dates, Boolean for flags)
- Always add timestamps for audit trails

### 2. Field Type Selection

```typescript
// String fields
fieldName: {
  type: String,
  required: true,
  length: 255  // Add length constraint
}

// Number fields
fieldName: {
  type: Number,
  required: true,
  min: 0,
  max: 100
}

// Date fields
fieldName: {
  type: Date,
  required: true
}

// Boolean fields
fieldName: {
  type: Boolean,
  required: true,
  default: false
}

// ObjectId references
fieldName: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'ModelName',
  required: true
}

// Array fields
fieldName: [{
  type: String
}]

// Nested objects
fieldName: {
  nestedField1: String,
  nestedField2: Number
}
```

## Standard Schema Template

```typescript
import mongoose from "mongoose";

const ExampleSchema = new mongoose.Schema(
  {
    // Required fields at the top
    required_field: {
      type: String,
      required: true,
      length: 100,
    },

    // Optional fields
    optional_field: {
      type: String,
      required: false,
      length: 500,
    },

    // Reference fields
    reference_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReferencedModel",
      required: true,
    },

    // Array of objects
    items: [{
      item_name: {
        type: String,
        required: true,
      },
      item_value: {
        type: Number,
        required: true,
      },
    }],

    // Enums
    status: {
      type: String,
      enum: ["pending", "active", "completed", "rejected"],
      default: "pending",
    },

    // Computed defaults
    computed_field: {
      type: Number,
      default: 0,
    },

    // Timestamps (optional - usually set in schema options)
    created_date: {
      type: Date,
      required: true,
    },
  },
  {
    collection: "collection_name",
    timestamps: true,  // Adds createdAt and updatedAt automatically
  }
);

// Indexes
ExampleSchema.index({ field_name: 1 });
ExampleSchema.index({ field1: 1, field2: -1 });  // Compound index
ExampleSchema.index({ field_name: 1 }, { unique: true });  // Unique index

// Pre-save hooks
ExampleSchema.pre("save", function (next) {
  // Set default values before save
  if (!this.created_date) {
    this.created_date = new Date();
  }
  next();
});

// Methods
ExampleSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Statics
ExampleSchema.statics.findByStatus = function(status: string) {
  return this.find({ status });
};

const Example = mongoose.model("Example", ExampleSchema);
export default Example;
```

## Indexing Strategy

### 1. Index Types

```typescript
// Single field index
schema.index({ email: 1 });

// Compound index (order matters!)
schema.index({ status: 1, created_at: -1 });

// Unique index
schema.index({ email: 1 }, { unique: true });

// Text index for search
schema.index({ title: 'text', description: 'text' });

// Geospatial index
schema.index({ location: '2dsphere' });
```

### 2. Common Index Patterns

```typescript
// User queries by email
UserSchema.index({ email: 1 }, { unique: true });

// Job posts by company
JobPostSchema.index({ company_id: 1, created_date: -1 });

// Work logs by freelancer and date
WorkLogSchema.index({ freelancer_id: 1, work_date: -1 });

// Payment records by status
PaymentRecordSchema.index({ payment_status: 1, created_at: -1 });

// Freelancer affiliations by company
FreelancerAffiliationSchema.index({ company_id: 1, status: 1 });
```

## Data Relationships

### 1. One-to-One

```typescript
// User has one profile
UserSchema {
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  }
}
```

### 2. One-to-Many

```typescript
// Company has many job posts
CompanySchema {
  _id: ObjectId
}

JobPostSchema {
  company_id: {
    type: ObjectId,
    ref: 'Company'
  }
}

// Query
const jobs = await JobPost.find({ company_id: companyId });
```

### 3. Many-to-Many

```typescript
// Jobs require multiple skills
// Skills can be required by multiple jobs

JobPostSchema {
  required_skills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillSet'
  }]
}

// Use aggregation for proper population
const jobs = await JobPost.find()
  .populate('required_skills')
  .sort({ created_date: -1 });
```

### 4. Embedded Documents

```typescript
// Use for data that belongs to parent and rarely queried independently
OrderSchema {
  items: [{
    product_id: ObjectId,
    product_name: String,
    quantity: Number,
    price: Number
  }]
}
```

## Freelancer Platform Models

### 1. ProjectRequirement Schema

```typescript
const ProjectRequirementSchema = new mongoose.Schema(
  {
    posted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: true,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    project_title: {
      type: String,
      required: true,
      length: 200,
    },
    project_description: {
      type: String,
      required: true,
      length: 4000,
    },
    language_requirements: [{
      type: String,
      enum: ["中文", "英语", "俄语", "日语", "韩语", "法语", "德语"]
    }],
    job_nature: {
      type: String,
      enum: ["全职", "兼职", "自由顾问", "实习"],
      required: true,
    },
    work_format: {
      type: String,
      enum: ["远程", "现场", "混合"],
      required: true,
    },
    rate_type: {
      type: String,
      enum: ["待面试", "日薪", "月薪", "年薪", "项目总价"],
      required: true,
    },
    rate_amount: Number,
    rate_currency: {
      type: String,
      enum: ["CNY", "USD", "EUR", "RUB", "GBP"],
      default: "CNY",
    },
    project_major_categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "SkillCategory"
    }],
    project_sub_categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "SkillSubCategory"
    }],
    project_cycle: {
      type: String,
      enum: ["1个月以内", "3个月", "6个月", "1年", "2年", "长期"],
      required: true,
    },
    required_skills: [{
      skill_name: String,
      skill_level: {
        type: String,
        enum: ["入门", "初级", "中级", "高级", "专家"]
      },
      is_mandatory: {
        type: Boolean,
        default: true
      }
    }],
    hiring_count: {
      type: Number,
      default: 1
    },
    is_active: {
      type: Boolean,
      default: true
    },
    view_count: {
      type: Number,
      default: 0
    },
    application_count: {
      type: Number,
      default: 0
    },
    created_date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["草稿", "发布", "进行中", "已关闭", "已到期"],
      default: "发布"
    }
  },
  {
    collection: "project_requirement",
    timestamps: true
  }
);

ProjectRequirementSchema.index({ company_id: 1, status: 1 });
ProjectRequirementSchema.index({ project_major_categories: 1 });
ProjectRequirementSchema.index({ created_date: -1 });
```

### 2. WorkLog Schema

```typescript
const WorkLogSchema = new mongoose.Schema(
  {
    freelancer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerProfile",
      required: true
    },
    project_requirement_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectRequirement",
      required: true
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    affiliation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerAffiliation",
      required: true
    },
    work_date: {
      type: Date,
      required: true
    },
    work_period_start: {
      type: Date,
      required: true
    },
    work_period_end: {
      type: Date,
      required: true
    },
    hours_worked: {
      type: Number,
      required: true,
      min: 0,
      max: 24
    },
    work_type: {
      type: String,
      enum: ["现场开发", "远程工作", "会议", "培训", "出差",
             "代码评审", "问题修复", "需求分析", "文档编写",
             "测试", "部署", "其他"],
      required: true
    },
    work_description: {
      type: String,
      required: true,
      length: 2000
    },
    work_content_detail: {
      type: String,
      length: 5000
    },
    attachments: [{
      file_name: String,
      file_url: String,
      file_type: String,
      file_size: Number,
      file_description: String
    }],
    status: {
      type: String,
      enum: ["draft", "submitted", "confirmed", "rejected", "invoiced", "paid"],
      default: "draft"
    },
    submitted_at: Date,
    confirmed_at: Date,
    confirmed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount"
    },
    rejection_reason: String,
    billing_info: {
      daily_rate: Number,
      hours_billable: Number,
      amount: Number,
      currency: String,
      is_tax_inclusive: Boolean,
      tax_rate: Number,
      tax_amount: Number,
      total_amount: Number
    }
  },
  {
    collection: "work_log",
    timestamps: true
  }
);

WorkLogSchema.index({ freelancer_id: 1, work_date: -1 });
WorkLogSchema.index({ company_id: 1, status: 1 });
WorkLogSchema.index({ project_requirement_id: 1 });
WorkLogSchema.index({ status: 1, submitted_at: -1 });
```

### 3. PaymentRecord Schema

```typescript
const PaymentRecordSchema = new mongoose.Schema(
  {
    freelancer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerProfile",
      required: true
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    affiliation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FreelancerAffiliation",
      required: true
    },
    payment_request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentRequest"
    },
    payment_type: {
      type: String,
      enum: ["工时结算", "项目款", "预付款", "尾款", "退款", "其他"],
      required: true
    },
    applied_amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      enum: ["CNY", "USD", "EUR", "RUB", "GBP"],
      default: "CNY"
    },
    payment_status: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "completed"],
      default: "pending"
    },
    payment_voucher: {
      voucher_number: String,
      voucher_url: String,
      uploaded_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserAccount"
      },
      uploaded_at: {
        type: Date,
        default: Date.now
      },
      verification_status: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending"
      }
    },
    billing_info: {
      total_hours: Number,
      daily_rate: Number,
      subtotal_amount: Number,
      is_tax_inclusive: Boolean,
      tax_rate: Number,
      tax_amount: Number,
      total_amount: Number
    },
    reconciliation_status: {
      type: String,
      enum: ["unreconciled", "partial", "reconciled", "disputed"],
      default: "unreconciled"
    }
  },
  {
    collection: "payment_record",
    timestamps: true
  }
);

PaymentRecordSchema.index({ freelancer_id: 1, payment_period_end: -1 });
PaymentRecordSchema.index({ company_id: 1, payment_status: 1 });
PaymentRecordSchema.index({ payment_voucher: 1 });
```

## Aggregation Pipelines

### Work Log Summary

```typescript
const getWorkLogSummary = async (freelancerId: string, startDate: Date, endDate: Date) => {
  return await WorkLog.aggregate([
    {
      $match: {
        freelancer_id: new mongoose.Types.ObjectId(freelancerId),
        work_date: { $gte: startDate, $lte: endDate },
        status: "confirmed"
      }
    },
    {
      $group: {
        _id: "$project_requirement_id",
        total_hours: { $sum: "$hours_worked" },
        total_amount: { $sum: "$billing_info.total_amount" },
        work_logs_count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "project_requirements",
        localField: "_id",
        foreignField: "_id",
        as: "project"
      }
    }
  ]);
};
```

## Migration Best Practices

1. Always add new fields with defaults
2. Never remove fields directly - deprecate first
3. Use versioning for schema changes
4. Test migrations on staging first
5. Keep migrations backward compatible
