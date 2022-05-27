const AppError = require("../utils/AppError");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");

const filterObj = (obj, ...allowedFields) => {
  const newObject = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObject[el] = obj[el];
  });
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //create error if user POSTs pass data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "this route is not for password updates, use  /updateMyPassword",
        400
      )
    );
  }
  //update user document
  //posso usare update non avendo a che fare con le password
  //filter body to not let the user set sensitive data
  const filteredBody = filterObj(req.body, "name", "email");
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "route not defined, please use signup instead",
  });
};

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);

//DO NOT UPDATE PASSWORD WITH THIS
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.user.id, { active: false });
});
