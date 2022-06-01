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
  res
    .status(200)
    .set({
      "Cross-Origin-Resource-Policy": "cross-site",

      "Content-Security-Policy":
        "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    })
    .render("tour", {
      title: `${tour.name} Tour`,
      tour,
    });
});

exports.getLoginForm = catchAsync(async (req, res) => {
  res
    .status(200)
    .set(
      "Content-Security-Policy",
      "connect-src 'self' https://cdnjs.cloudflare.com http://127.0.0.1:3000/"
    )
    .render("login", {
      title: "Log into your account",
    });
});
