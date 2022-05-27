const fs = require("fs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("../../models/userModel");
const Tour = require("../../models/tourModel");
const Review = require("../../models/reviewModel");

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB connection succesful");
  });

//read JSON file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, "utf-8")
);

const importData = async () => {
  try {
    await Review.create(reviews);
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("data succesfully loaded!");
    process.exit();
  }
};

//delete all data from collection
const deleteData = async () => {
  try {
    await User.deleteMany();
    await Tour.deleteMany();
    await Review.deleteMany();
    console.log("data succesfully deleted!");
  } catch (error) {
    console.log(error);
  } finally {
    process.exit();
  }
};

if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
