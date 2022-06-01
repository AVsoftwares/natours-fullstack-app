const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const sendEmail = require("../utils/email");

// eslint-disable-next-line arrow-body-style
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),

    httpOnly: true, //can't be accessed or modifided by browser, prevent xss
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  //CREATE AND SEND A COOKIE
  res.cookie("jwt", token, cookieOptions);
  user.password = undefined; //remove password from output
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, res);
});

//login with auth
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body; //usa sempre desctructuring

  //check if email and pass exists
  if (!email || !password) {
    return next(new AppError("please provide email and password", 400));
  }
  //check if user exists && password is correct
  const user = await User.findOne({
    email,
  }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("incorrect email or password", 401));
  }
  //send token to client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //getting token and checking if exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError("you are not logged in, login to access", 401));
  }
  //verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError("the user with this token no longer exists", 401));
  }

  //check if user changed password after jwt was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError("password recently changed, login again ", 401));
  }

  //grant access to protected route
  req.user = freshUser;
  next();
});

//only for rendered pages, no errors
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  //getting token and checking if exists
  if (req.cookies.jwt) {
    //verify token
    const decoded = await promisify(jwt.verify)(
      req.cookie.jwt,
      process.env.JWT_SECRET
    );

    //check if user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
      return next();
    }

    //check if user changed password after jwt was issued
    if (freshUser.changedPasswordAfter(decoded.iat)) {
      return next();
    }

    //THERE IS A LOGGED IN USER
    res.locals.user = freshUser;
    return next();
  }
  next();
});
// eslint-disable-next-line arrow-body-style
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("you do not have permission for this"), 403);
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("there's no user with this email address"), 404);
  }
  //generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //send to user's email (devo mandargli l'url esatto su cui cliccare per resettare la mail)
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `forgot your psw? submit PATCH request with new password and passwordConfirm to: ${resetURL}.\n If you didn't forget psw ignore email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "your password reset token (valid for 10 min)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "token sent to email!",
    });
  } catch (err) {
    user.PasswordResetToken = undefined;
    user.PasswordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("there was an error sending email,try again later"),
      500
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //get user based on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    PasswordResetToken: hashedToken,
    PasswordResetExpires: { $gt: Date.now() },
  });

  //if token has not expired and there is user, set new password
  if (!user) {
    return next(new AppError("token is invalid or has expired"), 400);
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.PasswordResetToken = undefined;
  user.PasswordResetExpires = undefined;
  await user.save();

  //update changedPasswordAt for user and

  //log user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //get user from collection
  //siamo loggati quindi abbiamo user corrente nella request, aggiungendo password nell'output per poi confrontarla
  const user = await User.findById(req.user.id).select("+password");

  //check if POSTed password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("your current password is wrong", 501));
  }

  //if so, update password
  user.password = req.body.password;
  user.passwordConfrim = req.body.passwordConfirm;
  await user.save(); //we want validation in this case
  //NEVER USE UPDATE OR FINDANDUPDATE WITH ANYTHING RELATED TO PASSWORD

  //login user ,send JWT
  createSendToken(user, 200, res);
});
