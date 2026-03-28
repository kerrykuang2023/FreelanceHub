import mongoose from "mongoose";

export interface IContractTemplate extends mongoose.Document {
  name: string;
  description: string;
  content: string;
  variables: Array<{
    name: string;
    label: string;
    type: 'text' | 'date' | 'number' | 'select';
    required: boolean;
    options?: string[];
  }>;
  is_default: boolean;
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const ContractTemplateSchema = new mongoose.Schema<IContractTemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
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
        label: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['text', 'date', 'number', 'select'],
          default: 'text',
        },
        required: {
          type: Boolean,
          default: false,
        },
        options: [
          {
            type: String,
          },
        ],
      },
    ],
    is_default: {
      type: Boolean,
      default: false,
    },
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

ContractTemplateSchema.index({ name: 1 }, { unique: true });
ContractTemplateSchema.index({ is_default: 1 });

const ContractTemplate = mongoose.model<IContractTemplate>(
  'ContractTemplate',
  ContractTemplateSchema,
  'contract_templates'
);

export default ContractTemplate;
