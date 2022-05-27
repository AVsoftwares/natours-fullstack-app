const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "please tell us your name"],
  },
  email: {
    type: String,
    required: [true, "please provide your email"],
    unique: true,
    lowerCase: true, //transform the email to lowercase
    validate: [validator.isEmail, "please provide a valid email"],
  },
  photo: String,
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "please provide a password"],
    minlength: 8,
    select: false, //non viene mostrata in output
  },
  passwordConfirm: {
    type: String,
    required: [true, "please confirm your password"],
    validate: {
      // only works on SAVE and CREATE not update, we use anony func because we need "this"
      validator: function (el) {
        return el === this.password;
      },
    },
  },
  passwordChangedAt: Date,
  PasswordResetToken: String,
  PasswordResetExpires: Date,
});
userSchema.pre("save", async function (next) {
  //set current password or new pass to encrypted versione when creating or updating
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  //passconfirm è un required input ma non deve essere persistent nel db, quindi una volta validato posso scartare questo campo
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();

  this.passwordChangedAt = Date.now() - 1000; // altrimenti può capitare che il jwt venga creato prima e quindi non sia valido per loggare
  next();
});

//metodi di istanza, si possono usare per tutti i documenti
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimeStamp, JWTTimestamp);
    return JWTTimestamp < changedTimeStamp;
  }

  //false means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.PasswordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.PasswordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
