import ContractTemplate, { IContractTemplate } from '../models/contract/contract_template.model';
import Contract, { IContract, ContractStatus } from '../models/contract/contract.model';
import ProjectRequirement from '../models/freelancer/project_requirement.model';
import FreelancerProfile from '../models/freelancer/freelancer_profile.model';
import Company from '../models/company-profile/company.model';
import UserAccount from '../models/user/user-account.model';

export interface CreateContractTemplateDTO {
  name: string;
  description?: string;
  content: string;
  variables: Array<{
    name: string;
    label: string;
    type: 'text' | 'date' | 'number' | 'select';
    required: boolean;
    options?: string[];
  }>;
  is_default?: boolean;
}

export interface CreateContractDTO {
  template_id: string;
  project_id: string;
  freelancer_id: string;
  company_id: string;
  title: string;
  content?: string;
  variables: Array<{ name: string; value: any }>;
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
}

export interface SignContractDTO {
  contract_id: string;
  signer_type: 'freelancer' | 'company';
  signature_data?: string;
  ip_address?: string;
}

class ContractService {
  private static INSTANCE: ContractService;

  public static getInstance(): ContractService {
    if (!ContractService.INSTANCE) {
      ContractService.INSTANCE = new ContractService();
    }
    return ContractService.INSTANCE;
  }

  public async createTemplate(data: CreateContractTemplateDTO, userId: string): Promise<IContractTemplate> {
    if (data.is_default) {
      await ContractTemplate.updateMany({}, { is_default: false });
    }

    const template = await ContractTemplate.create({
      ...data,
      created_by: userId,
    });

    return template;
  }

  public async getTemplates(options: { page?: number; pageSize?: number } = {}): Promise<{
    items: IContractTemplate[];
    total: number;
  }> {
    const { page = 1, pageSize = 20 } = options;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      ContractTemplate.find()
        .populate('created_by', 'user_name email')
        .sort({ is_default: -1, created_at: -1 })
        .skip(skip)
        .limit(pageSize),
      ContractTemplate.countDocuments(),
    ]);

    return { items, total };
  }

  public async getTemplateById(id: string): Promise<IContractTemplate | null> {
    return ContractTemplate.findById(id).populate('created_by', 'user_name email');
  }

  public async updateTemplate(id: string, data: Partial<CreateContractTemplateDTO>): Promise<IContractTemplate | null> {
    if (data.is_default) {
      await ContractTemplate.updateMany({ _id: { $ne: id } }, { is_default: false });
    }

    return ContractTemplate.findByIdAndUpdate(id, data, { new: true });
  }

  public async deleteTemplate(id: string): Promise<boolean> {
    const result = await ContractTemplate.findByIdAndDelete(id);
    return !!result;
  }

  public async getDefaultTemplate(): Promise<IContractTemplate | null> {
    return ContractTemplate.findOne({ is_default: true });
  }

  public async createContract(data: CreateContractDTO, userId: string): Promise<IContract> {
    const template = await ContractTemplate.findById(data.template_id);
    if (!template) {
      throw new Error('Contract template not found');
    }

    const project = await ProjectRequirement.findById(data.project_id);
    if (!project) {
      throw new Error('Project not found');
    }

    const freelancer = await FreelancerProfile.findById(data.freelancer_id);
    if (!freelancer) {
      throw new Error('Freelancer not found');
    }

    const company = await Company.findById(data.company_id);
    if (!company) {
      throw new Error('Company not found');
    }

    const content = this.replaceVariables(template.content, data.variables);

    const contract = await Contract.create({
      ...data,
      content,
      created_by: userId,
      status: 'draft',
    });

    return contract;
  }

  private replaceVariables(content: string, variables: Array<{ name: string; value: any }>): string {
    let result = content;
    for (const variable of variables) {
      const regex = new RegExp(`{{\\s*${variable.name}\\s*}}`, 'g');
      let replacement = variable.value;
      if (variable.value instanceof Date) {
        replacement = variable.value.toLocaleDateString('zh-CN');
      }
      result = result.replace(regex, String(replacement));
    }
    return result;
  }

  public async getContracts(options: {
    page?: number;
    pageSize?: number;
    status?: ContractStatus;
    freelancer_id?: string;
    company_id?: string;
    project_id?: string;
  } = {}): Promise<{
    items: IContract[];
    total: number;
  }> {
    const { page = 1, pageSize = 20, status, freelancer_id, company_id, project_id } = options;
    const skip = (page - 1) * pageSize;

    const filter: any = {};
    if (status) filter.status = status;
    if (freelancer_id) filter.freelancer_id = freelancer_id;
    if (company_id) filter.company_id = company_id;
    if (project_id) filter.project_id = project_id;

    const [items, total] = await Promise.all([
      Contract.find(filter)
        .populate('template_id', 'name')
        .populate('project_id', 'project_title')
        .populate('freelancer_id', 'display_name')
        .populate('company_id', 'company_name')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(pageSize),
      Contract.countDocuments(filter),
    ]);

    return { items, total };
  }

  public async getContractById(id: string): Promise<IContract | null> {
    return Contract.findById(id)
      .populate('template_id', 'name description')
      .populate('project_id')
      .populate('freelancer_id')
      .populate('company_id')
      .populate('created_by', 'user_name email');
  }

  public async updateContract(id: string, data: Partial<CreateContractDTO>): Promise<IContract | null> {
    if (data.variables && data.template_id) {
      const template = await ContractTemplate.findById(data.template_id);
      if (template) {
        data.content = this.replaceVariables(template.content, data.variables);
      }
    }

    return Contract.findByIdAndUpdate(id, data, { new: true });
  }

  public async signContract(data: SignContractDTO, userId: string): Promise<IContract> {
    const contract = await Contract.findById(data.contract_id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status !== 'pending_signature') {
      throw new Error('Contract is not in pending_signature status');
    }

    const user = await UserAccount.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const existingSignature = contract.signatures.find(
      (s) => s.signer_id.toString() === userId && s.signer_type === data.signer_type
    );

    if (existingSignature) {
      throw new Error('Already signed');
    }

    contract.signatures.push({
      signer_id: userId as any,
      signer_type: data.signer_type,
      signer_name: user.email,
      signed_at: new Date(),
      signature_data: data.signature_data || '',
      ip_address: data.ip_address || '',
    });

    const requiredSignatures = 2;
    if (contract.signatures.length >= requiredSignatures) {
      contract.status = 'active';
    }

    await contract.save();
    return contract;
  }

  public async submitForSignature(id: string): Promise<IContract> {
    const contract = await Contract.findById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status !== 'draft') {
      throw new Error('Contract is not in draft status');
    }

    contract.status = 'pending_signature';
    await contract.save();

    return contract;
  }

  public async terminateContract(id: string, reason: string): Promise<IContract> {
    const contract = await Contract.findById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status !== 'active') {
      throw new Error('Only active contracts can be terminated');
    }

    contract.status = 'terminated';
    await contract.save();

    return contract;
  }

  public async getExpiringContracts(days: number): Promise<IContract[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return Contract.find({
      status: 'active',
      end_date: {
        $gte: new Date(),
        $lte: targetDate,
      },
    })
      .populate('freelancer_id', 'display_name user_id')
      .populate('company_id', 'company_name')
      .populate('project_id', 'project_title');
  }

  public async expireContracts(): Promise<number> {
    const result = await Contract.updateMany(
      {
        status: 'active',
        end_date: { $lt: new Date() },
      },
      { status: 'expired' }
    );

    return result.modifiedCount;
  }
}

export default ContractService.getInstance();
