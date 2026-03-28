import mongoose from "mongoose";

const SkillCategorySchema = new mongoose.Schema(
  {
    category_name: {
      type: String,
      required: true,
      length: 100,
    },
    category_code: {
      type: String,
      required: true,
      unique: true,
      length: 50,
    },
    category_icon: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
      length: 500,
    },
    display_order: {
      type: Number,
      default: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    parent_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SkillCategory",
      required: false,
    },
  },
  {
    collection: "skill_category",
    timestamps: true,
  }
);

const SkillCategory = mongoose.model("SkillCategory", SkillCategorySchema);
export default SkillCategory;
