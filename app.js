const path = require("path");
const express = require("express");
//const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const morgan = require("morgan");

const AppError = require("./utils/AppError");
const globalErrorhandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const viewRouter = require("./routes/viewRoutes");

const app = express();
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

//GLOBAL MIDDLEWARE, applied to all the routes, app.js usually used for applying middleware

//serving static files
app.use(express.static(path.join(__dirname, "public")));

//set security http headers
app.use(helmet());

//dev logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//limit request from ip
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "too many requests, try again after some time",
});

app.use("/api", limiter);
//in app.use we only need a function and not a function call, in fact the ones that call return a function

//body parser, from body into req.body
app.use(express.json({ limit: "10 kb" }));

//data sanitization against noSQL query injection
//looks at request properties and filters out dollar signs etc. to prevent query injections
app.use(mongoSanitize());

//data sanitization against xss
//converts html simbols in other thing
app.use(xss());

//prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//////////////////////////////////

//routes
app.use("/api/v1/tours", tourRouter); //tourRouter è un middleware che uso per questa specifica route, creo come una sub app con nuovo root
app.use("/api/v1/users", userRouter);

//se una richieta arriva qui significa che nessun router è riuscito a intercettarla

app.use("/api/v1/reviews", reviewRouter);
app.use("/", viewRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

//usando 4 paramentri express sa che è ERROR HANDLING MIDDLEWARE
app.use(globalErrorhandler);

module.exports = app;
