import Evidence, { IEvidence } from '../models/evidence/evidence.model';
import crypto from 'crypto';

export interface UploadEvidenceDTO {
  ticket_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  description?: string;
}

class EvidenceService {
  private static INSTANCE: EvidenceService;
  private readonly encryptionKey: string;
  private readonly encryptionAlgorithm = 'aes-256-cbc';

  public static getInstance(): EvidenceService {
    if (!EvidenceService.INSTANCE) {
      EvidenceService.INSTANCE = new EvidenceService();
    }
    return EvidenceService.INSTANCE;
  }

  constructor() {
    this.encryptionKey = process.env.EVIDENCE_ENCRYPTION_KEY || 'default-encryption-key-32-characters!';
  }

  public async uploadEvidence(
    data: UploadEvidenceDTO,
    uploaderId: string
  ): Promise<IEvidence> {
    const encryptedUrl = this.encryptData(data.file_url);

    const evidence = await Evidence.create({
      ticket_id: data.ticket_id,
      uploader_id: uploaderId,
      file_name: data.file_name,
      file_type: data.file_type,
      file_size: data.file_size,
      file_url: data.file_url,
      encrypted_url: encryptedUrl,
      description: data.description,
      is_encrypted: true,
      is_verified: false,
    });

    return evidence;
  }

  public async getEvidenceByTicket(ticketId: string): Promise<IEvidence[]> {
    return Evidence.find({ ticket_id: ticketId })
      .populate('uploader_id', 'user_name user_image')
      .populate('verified_by', 'user_name')
      .sort({ created_at: -1 });
  }

  public async getEvidenceById(id: string): Promise<IEvidence | null> {
    return Evidence.findById(id)
      .populate('uploader_id', 'user_name user_image')
      .populate('verified_by', 'user_name');
  }

  public async deleteEvidence(id: string, uploaderId: string): Promise<boolean> {
    const result = await Evidence.findOneAndDelete({
      _id: id,
      uploader_id: uploaderId,
    });
    return !!result;
  }

  public async verifyEvidence(
    id: string,
    verifierId: string
  ): Promise<IEvidence | null> {
    return Evidence.findByIdAndUpdate(
      id,
      {
        is_verified: true,
        verified_by: verifierId,
        verified_at: new Date(),
      },
      { new: true }
    );
  }

  public async getEvidenceUrl(id: string): Promise<string | null> {
    const evidence = await Evidence.findById(id);
    if (!evidence) return null;

    if (evidence.is_encrypted && evidence.encrypted_url) {
      return this.decryptData(evidence.encrypted_url);
    }

    return evidence.file_url;
  }

  public async getEvidenceStats(ticketId: string): Promise<{
    total: number;
    verified: number;
    pending: number;
    totalSize: number;
  }> {
    const evidences = await Evidence.find({ ticket_id: ticketId });

    return {
      total: evidences.length,
      verified: evidences.filter((e) => e.is_verified).length,
      pending: evidences.filter((e) => !e.is_verified).length,
      totalSize: evidences.reduce((sum, e) => sum + (e.file_size || 0), 0),
    };
  }

  private encryptData(data: string): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const cipher = crypto.createCipheriv(this.encryptionAlgorithm, key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  private decryptData(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);

    const decipher = crypto.createDecipheriv(this.encryptionAlgorithm, key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

export default EvidenceService.getInstance();
