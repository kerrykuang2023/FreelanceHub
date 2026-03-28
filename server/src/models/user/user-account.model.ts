import bcrypt from "bcrypt";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const UserAccountSchema = new mongoose.Schema(
  {
    user_type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserType",
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 255,
    },
    password: {
      type: String,
      required: true,
      maxlength: 100,
      select: false,
    },
    user_name: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100,
    },
    first_name: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100,
    },
    last_name: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100,
    },
    date_of_birth: {
      type: Date,
      required: false,
    },
    gender: {
      type: String,
      required: false,
      enum: ["male", "female", "other", "prefer_not_to_say"],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    contact_number: {
      type: String,
      required: false,
      maxlength: 20,
    },
    sms_notification_active: {
      type: Boolean,
      default: false,
    },
    email_notification_active: {
      type: Boolean,
      default: true,
    },
    user_image: {
      type: String,
      required: false,
    },
    registration_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    last_login_date: {
      type: Date,
      required: false,
    },
    favorite_jobs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPost",
    }],
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: false,
    },
  },
  {
    collection: "user_account",
    timestamps: true,
  }
);

UserAccountSchema.index({ email: 1 }, { unique: true });
UserAccountSchema.index({ user_type_id: 1 });
UserAccountSchema.index({ created_at: -1 });

UserAccountSchema.pre("save", function (next) {
  if (!this.registration_date) {
    this.registration_date = new Date();
  }
  next();
});

UserAccountSchema.pre("save", function (next) {
  const user = this;

  if (!user.isModified("password")) return next();

  bcrypt.genSalt(10, function (err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err);

      user.password = hash;
      next();
    });
  });
});

UserAccountSchema.methods.comparePassword = function (password: string) {
  return bcrypt.compareSync(password, this.password);
};

UserAccountSchema.methods.generateJWT = function () {
  const today = new Date();
  const expirationDate = new Date(today);
  expirationDate.setDate(today.getDate() + 60);

  const payload = {
    id: this._id,
    email: this.email,
    user_name: this.user_name,
  };

  const jwtSecret = process.env.JWT_SECRET || "jwt_secret_key_2026";
  return jwt.sign(payload, jwtSecret, {
    expiresIn: parseInt((expirationDate.getTime() / 1000).toString(), 10),
  });
};

UserAccountSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const UserAccount = mongoose.model("UserAccount", UserAccountSchema);

export default UserAccount;
