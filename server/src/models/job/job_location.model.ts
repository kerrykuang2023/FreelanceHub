import mongoose from "mongoose";

const JobLocationSchema = new mongoose.Schema(
  {
    street_address: {
      type: String,
      required: false,
      maxlength: 200,
      default: "",
    },
    city: {
      type: String,
      required: false,
      maxlength: 50,
      default: "",
    },
    state: {
      type: String,
      required: false,
      maxlength: 50,
      default: "",
    },
    country: {
      type: String,
      required: false,
      maxlength: 50,
      default: "",
    },
    zip_code: {
      type: String,
      required: false,
      maxlength: 10,
      default: "",
    },
  },
  {
    collection: "job_location",
    timestamps: true,
  }
);

const JobLocation = mongoose.model("JobLocation", JobLocationSchema);

export default JobLocation;
