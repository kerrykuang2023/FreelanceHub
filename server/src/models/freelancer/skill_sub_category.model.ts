import mongoose from "mongoose";

const SkillSubCategorySchema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SkillCategory",
      required: true,
    },
    sub_category_name: {
      type: String,
      required: true,
      length: 100,
    },
    sub_category_code: {
      type: String,
      required: true,
      length: 50,
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
    tags: [{
      type: String,
    }],
  },
  {
    collection: "skill_sub_category",
    timestamps: true,
  }
);

SkillSubCategorySchema.index({ category_id: 1, sub_category_code: 1 }, { unique: true });

const SkillSubCategory = mongoose.model("SkillSubCategory", SkillSubCategorySchema);
export default SkillSubCategory;
