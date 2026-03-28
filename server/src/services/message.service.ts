import Message, { IMessage, MessageType, MessageCategory } from '../models/message/message.model';

export interface CreateMessageDTO {
  recipient_id: string;
  sender_id?: string;
  type: MessageType;
  category: MessageCategory;
  title: string;
  content: string;
  link?: string;
  related_id?: string;
}

class MessageService {
  private static INSTANCE: MessageService;

  public static getInstance(): MessageService {
    if (!MessageService.INSTANCE) {
      MessageService.INSTANCE = new MessageService();
    }
    return MessageService.INSTANCE;
  }

  public async createMessage(data: CreateMessageDTO): Promise<IMessage> {
    const message = await Message.create({
      ...data,
      is_read: false,
    });
    return message;
  }

  public async createSystemMessage(
    recipientId: string,
    title: string,
    content: string,
    category: MessageCategory = 'other',
    link?: string,
    relatedId?: string
  ): Promise<IMessage> {
    return this.createMessage({
      recipient_id: recipientId,
      type: 'system',
      category,
      title,
      content,
      link,
      related_id: relatedId,
    });
  }

  public async createNotification(
    recipientId: string,
    senderId: string,
    title: string,
    content: string,
    category: MessageCategory = 'other',
    link?: string,
    relatedId?: string
  ): Promise<IMessage> {
    return this.createMessage({
      recipient_id: recipientId,
      sender_id: senderId,
      type: 'notification',
      category,
      title,
      content,
      link,
      related_id: relatedId,
    });
  }

  public async createReminder(
    recipientId: string,
    title: string,
    content: string,
    category: MessageCategory = 'other',
    link?: string,
    relatedId?: string
  ): Promise<IMessage> {
    return this.createMessage({
      recipient_id: recipientId,
      type: 'reminder',
      category,
      title,
      content,
      link,
      related_id: relatedId,
    });
  }

  public async getMessages(
    recipientId: string,
    options: {
      page?: number;
      pageSize?: number;
      is_read?: boolean;
      category?: MessageCategory;
      type?: MessageType;
    } = {}
  ): Promise<{
    items: IMessage[];
    total: number;
    unreadCount: number;
  }> {
    const { page = 1, pageSize = 20, is_read, category, type } = options;
    const skip = (page - 1) * pageSize;

    const filter: any = { recipient_id: recipientId };
    if (is_read !== undefined) filter.is_read = is_read;
    if (category) filter.category = category;
    if (type) filter.type = type;

    const [items, total, unreadCount] = await Promise.all([
      Message.find(filter)
        .populate('sender_id', 'user_name user_image')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(pageSize),
      Message.countDocuments(filter),
      Message.countDocuments({ recipient_id: recipientId, is_read: false }),
    ]);

    return { items, total, unreadCount };
  }

  public async getMessageById(id: string, recipientId: string): Promise<IMessage | null> {
    return Message.findOne({ _id: id, recipient_id: recipientId }).populate(
      'sender_id',
      'user_name user_image'
    );
  }

  public async markAsRead(id: string, recipientId: string): Promise<IMessage | null> {
    const message = await Message.findOneAndUpdate(
      { _id: id, recipient_id: recipientId },
      { is_read: true, read_at: new Date() },
      { new: true }
    );
    return message;
  }

  public async markAllAsRead(recipientId: string): Promise<number> {
    const result = await Message.updateMany(
      { recipient_id: recipientId, is_read: false },
      { is_read: true, read_at: new Date() }
    );
    return result.modifiedCount;
  }

  public async deleteMessage(id: string, recipientId: string): Promise<boolean> {
    const result = await Message.findOneAndDelete({
      _id: id,
      recipient_id: recipientId,
    });
    return !!result;
  }

  public async getUnreadCount(recipientId: string): Promise<number> {
    return Message.countDocuments({ recipient_id: recipientId, is_read: false });
  }

  public async deleteOldMessages(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Message.deleteMany({
      created_at: { $lt: cutoffDate },
      is_read: true,
    });

    return result.deletedCount;
  }
}

export default MessageService.getInstance();
