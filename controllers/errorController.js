const AppError = require("../utils/AppError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleJWTError = (err) =>
  new AppError("invalid token, please login again", 401);

const handleJWTExpiredError = (err) =>
  new AppError("your token has expired, please login again", 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  //trusted error, can show to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,

      message: err.message,
    });
    //programming or other unknow err, don't leak DETAILS
  } else {
    console.error("error");

    res.status(500).json({
      status: "error",
      message: "something went very wrong ",
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError;
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError;
    sendErrorProd(error, res);
  }
};
