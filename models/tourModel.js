const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "a tour must have a name"], //validator
      unique: true,
      maxlength: [40, "a tour name must have less than 40 characters"],
      validate: {
        validator: (val) => validator.isAlpha(val, ["en-US"], { ignore: " " }),
        message: "A tour must only  contain characters",
      },
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, "must have duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, " must have max group sie"],
    },
    difficulty: {
      type: String,
      required: [true, "must have difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "difficulty is either easy,medium or difficult",
      },
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "rating must be above 1.0"],
      max: [5, "rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10, //run each time there's a new value
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    price: {
      type: Number,
      required: [true, "a tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        message: "discount price {{VALUE}} should be below regular price",
        validator: function (val) {
          //this punta al doc corrente solo nella creazione di un nuovo doc
          return val < this.price;
        },
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "must have description"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "must have cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // nascondo dall'out perchè dati che non voglio mostrare
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //geoJSON
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    //EMBEDDED DOCUMENT
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      //REFERENCES BETWEEN DATA SETS
      { type: mongoose.Schema.ObjectId, ref: "User" },
    ],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" });

tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

//VIRTUAL POPULATE
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create(); nella funzione ho accesso al documento che viene salvato e lo referenzio con this; devo usare funzione come anche per le virtual properties

//PRE: ogni presave ha accesso a next

tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre("save", function (next) {
//   console.log("will save document");
//   next();
// });

// //POST
// tourSchema.post("save", (doc, next) => {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE- this punta alla query corrente come prima il documento, uso regExp così che venga applicato a tutto quello che inizia con find
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt",
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`query took ${Date.now() - this.start} milliseconds`);

  next();
});

//AGGREGATION MIDDLEWARE: this indica l'oggetto aggregation corrente

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
