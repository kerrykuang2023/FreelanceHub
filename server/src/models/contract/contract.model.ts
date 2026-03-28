import mongoose from "mongoose";

export type ContractStatus = 'draft' | 'pending_signature' | 'active' | 'expired' | 'terminated';

export interface IContract extends mongoose.Document {
  template_id: mongoose.Types.ObjectId;
  project_id: mongoose.Types.ObjectId;
  freelancer_id: mongoose.Types.ObjectId;
  company_id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  variables: Array<{
    name: string;
    value: any;
  }>;
  status: ContractStatus;
  signatures: Array<{
    signer_id: mongoose.Types.ObjectId;
    signer_type: 'freelancer' | 'company';
    signer_name: string;
    signed_at: Date;
    signature_data: string;
    ip_address: string;
  }>;
  start_date: Date;
  end_date: Date;
  terms: {
    daily_rate?: number;
    monthly_rate?: number;
    currency: string;
    payment_terms: string;
    working_hours: string;
    notice_period_days: number;
  };
  attachments: Array<{
    name: string;
    url: string;
    uploaded_at: Date;
  }>;
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const ContractSchema = new mongoose.Schema<IContract>(
  {
    template_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContractTemplate',
      required: true,
    },
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectRequirement',
      required: true,
    },
    freelancer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FreelancerProfile',
      required: true,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
    },
    variables: [
      {
        name: {
          type: String,
          required: true,
        },
        value: {
          type: mongoose.Schema.Types.Mixed,
        },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'pending_signature', 'active', 'expired', 'terminated'],
      default: 'draft',
    },
    signatures: [
      {
        signer_id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        signer_type: {
          type: String,
          enum: ['freelancer', 'company'],
          required: true,
        },
        signer_name: {
          type: String,
          required: true,
        },
        signed_at: {
          type: Date,
          required: true,
        },
        signature_data: {
          type: String,
        },
        ip_address: {
          type: String,
        },
      },
    ],
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    terms: {
      daily_rate: {
        type: Number,
      },
      monthly_rate: {
        type: Number,
      },
      currency: {
        type: String,
        default: 'CNY',
      },
      payment_terms: {
        type: String,
        default: '月结',
      },
      working_hours: {
        type: String,
        default: '标准工时',
      },
      notice_period_days: {
        type: Number,
        default: 30,
      },
    },
    attachments: [
      {
        name: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        uploaded_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserAccount',
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

ContractSchema.index({ project_id: 1 });
ContractSchema.index({ freelancer_id: 1 });
ContractSchema.index({ company_id: 1 });
ContractSchema.index({ status: 1 });
ContractSchema.index({ end_date: 1 });

const Contract = mongoose.model<IContract>('Contract', ContractSchema, 'contracts');

export default Contract;
