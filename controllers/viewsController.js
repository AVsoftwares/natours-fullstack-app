const Tour = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");

exports.getOverview = catchAsync(async (req, res) => {
  //1 get tour data from collection
  console.log("loading tours");
  const tours = await Tour.find();

  //2 build template

  //3 render template using step 1 data
  console.log("rendering tours");
  res.status(200).render("overview", {
    title: "All tours",
    tours,
  });
});

exports.getTour = catchAsync(async (req, res) => {
  //1 get the data for requested tour including reviews and guides
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  });

  //build template

  //render template using data from step 1
  res.status(200).render("tour", {
    title: `${tour.name} Tour`,
    tour,
  });
});
