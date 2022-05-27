const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const APIFeatures = require("../utils/apiFeatures");

//qui generalizzo i controller che svolgono azioni simili passando il model in modo che a seconda del campo scelto la funzione ritorni il metodo specifico che poi salvo nel controller specifico nel suo file
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      //null is a falsy value
      return next(new AppError("no document found with that id", 404));
    }

    res.status(204).json({
      status: "success",
      message: "succesfully removed",
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      //null is a falsy value
      return next(new AppError("no tour found with that id", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = await Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      //null is falsy
      return next(new AppError("no tour found with that id", 404));
      //posso aggiungere questo snippet ogni volta che controllo i tour per id
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //hack to allow for nested get reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    //execute query
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;

    //send response
    res.status(200).json({
      status: "success",
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
