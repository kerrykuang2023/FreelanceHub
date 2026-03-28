import mongoose from "mongoose";

export type MessageType = 'system' | 'notification' | 'reminder';
export type MessageCategory = 'project' | 'worklog' | 'invoice' | 'payment' | 'contract' | 'other';

export interface IMessage extends mongoose.Document {
  recipient_id: mongoose.Types.ObjectId;
  sender_id?: mongoose.Types.ObjectId;
  type: MessageType;
  category: MessageCategory;
  title: string;
  content: string;
  link?: string;
  related_id?: mongoose.Types.ObjectId;
  is_read: boolean;
  read_at?: Date;
  created_at: Date;
}

const MessageSchema = new mongoose.Schema<IMessage>(
  {
    recipient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserAccount',
      required: true,
      index: true,
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserAccount',
    },
    type: {
      type: String,
      enum: ['system', 'notification', 'reminder'],
      default: 'notification',
    },
    category: {
      type: String,
      enum: ['project', 'worklog', 'invoice', 'payment', 'contract', 'other'],
      default: 'other',
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    link: {
      type: String,
    },
    related_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    is_read: {
      type: Boolean,
      default: false,
      index: true,
    },
    read_at: {
      type: Date,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  }
);

MessageSchema.index({ recipient_id: 1, is_read: 1 });
MessageSchema.index({ recipient_id: 1, created_at: -1 });

const Message = mongoose.model<IMessage>('Message', MessageSchema, 'messages');

export default Message;
