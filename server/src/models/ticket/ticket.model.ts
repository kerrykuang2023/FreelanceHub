import mongoose from "mongoose";

export type TicketCategory = 'dispute' | 'complaint' | 'question' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'pending' | 'processing' | 'arbitration' | 'resolved' | 'closed';

export interface ITicket extends mongoose.Document {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  creator_id: mongoose.Types.ObjectId;
  assignee_id?: mongoose.Types.ObjectId;
  related_project_id?: mongoose.Types.ObjectId;
  related_worklog_id?: mongoose.Types.ObjectId;
  related_invoice_id?: mongoose.Types.ObjectId;
  messages: Array<{
    sender_id: mongoose.Types.ObjectId;
    sender_name: string;
    content: string;
    attachments: string[];
    created_at: Date;
  }>;
  resolution?: string;
  resolved_at?: Date;
  closed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const TicketSchema = new mongoose.Schema<ITicket>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    category: {
      type: String,
      enum: ['dispute', 'complaint', 'question', 'other'],
      default: 'other',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'arbitration', 'resolved', 'closed'],
      default: 'pending',
    },
    creator_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserAccount',
      required: true,
      index: true,
    },
    assignee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserAccount',
      index: true,
    },
    related_project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectRequirement',
    },
    related_worklog_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkLog',
    },
    related_invoice_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FreelancerInvoice',
    },
    messages: [
      {
        sender_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'UserAccount',
          required: true,
        },
        sender_name: {
          type: String,
          required: true,
        },
        content: {
          type: String,
          required: true,
          maxlength: 2000,
        },
        attachments: [
          {
            type: String,
          },
        ],
        created_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    resolution: {
      type: String,
      maxlength: 2000,
    },
    resolved_at: {
      type: Date,
    },
    closed_at: {
      type: Date,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

TicketSchema.index({ status: 1, priority: 1 });
TicketSchema.index({ created_at: -1 });

const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema, 'tickets');

export default Ticket;
