const Review = require("../models/reviewModel");
const factory = require("./handlerFactory");

// const catchAsync = require("../utils/catchAsync");

exports.getAllReviews = factory.getAll(Review);

//SOSTITUISCO LE PARTI DELLA FUNZIONE CHE NON CI SONO NELLA FACTORY CON UN MIDDLEWARE DA ESEGUIRE PRIMA
exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createReview = factory.createOne(Review);

exports.deleteReview = factory.deleteOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.getReview = factory.getOne(Review);
