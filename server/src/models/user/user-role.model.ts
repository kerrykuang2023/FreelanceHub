import mongoose from "mongoose";

export type RoleType = "job_seeker" | "hr_recruiter" | "admin";
export type RoleStatus = "pending" | "approved" | "rejected" | "frozen";

interface IExperience {
  company: string;
  position: string;
  start_date: Date;
  end_date?: Date;
  description: string;
}

interface IExpectedSalary {
  min: number;
  max: number;
  currency: string;
}

interface IRoleSpecificData {
  skills?: string[];
  experience?: IExperience[];
  expected_salary?: IExpectedSalary;
  company_id?: mongoose.Types.ObjectId;
  company_name?: string;
  position?: string;
}

interface IUserRole extends mongoose.Document {
  user_id: mongoose.Types.ObjectId;
  role_type: RoleType;
  status: RoleStatus;
  is_active: boolean;
  role_specific_data: IRoleSpecificData;
  approved_by?: mongoose.Types.ObjectId;
  approved_at?: Date;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
}

const UserRoleSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
      required: true,
      index: true,
    },
    role_type: {
      type: String,
      enum: ["job_seeker", "hr_recruiter", "admin"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "frozen"],
      default: "pending",
      required: true,
    },
    is_active: {
      type: Boolean,
      default: false,
      required: true,
    },
    role_specific_data: {
      skills: {
        type: [String],
        default: [],
      },
      experience: [
        {
          company: { type: String },
          position: { type: String },
          start_date: { type: Date },
          end_date: { type: Date },
          description: { type: String },
        },
      ],
      expected_salary: {
        min: { type: Number },
        max: { type: Number },
        currency: { type: String, default: "CNY" },
      },
      company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
      },
      company_name: { type: String },
      position: { type: String },
    },
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAccount",
    },
    approved_at: {
      type: Date,
    },
    rejection_reason: {
      type: String,
    },
  },
  {
    collection: "user_role",
    timestamps: true,
  }
);

UserRoleSchema.index({ user_id: 1, role_type: 1 }, { unique: true });

UserRoleSchema.methods.toJSON = function () {
  const userRole = this.toObject();
  userRole.id = userRole._id;
  delete userRole._id;
  delete userRole.__v;
  return userRole;
};

const UserRole = mongoose.model<IUserRole>("UserRole", UserRoleSchema);

export default UserRole;
export { IUserRole, IRoleSpecificData, IExperience, IExpectedSalary };
