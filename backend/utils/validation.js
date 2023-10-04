const { validationResult } = require('express-validator');
const { Spot,Booking,SpotImage,Review,ReviewImage } = require('../db/models');

const selectedTable = {
  "Spot": {
      id: 'spotId',
      t: Spot,
      o: 'ownerId'
  },
  "Booking": {
      id: 'bookingId',
      t: Booking,
      o: 'userId'
  },
  "SpotImage": {
      id: 'spotImageId',
      t: SpotImage
  },
  "Review": {
      id: 'reviewId',
      t: Review,
      o: 'userId'
  },
  "ReviewImage": {
      id: 'reviewImageId',
      t: ReviewImage
  }
}

const checkExists = (table,options = {})=>{
  return async function (req, res, next) {
    const idName = selectedTable[table].id;
  const existsDB = await selectedTable[table].t.findByPk(req.params[idName],options);
  if (existsDB) {
    req.tryOwner = existsDB[selectedTable[table].o]
    return next();}
  const err = new Error(`${table} couldn\'t be found`)
  err.status = 404;
  err.title = `${table} couldn\'t be found`
  err.errors = { message: `${table} couldn\'t be found` }
  return next(err);
}};


const checkOwner = (table) =>{
 return function (req,res, next) {
 // const idName = selectedTable[table].id;
  if(req.tryOwner == req.user.id) return next();
  const err = new Error(`${table} must belong to the current user`);
  err.status = 403;
  return next(err)
}};

// middleware for formatting errors from express-validator middleware
// (to customize, see express-validator's documentation)
const handleValidationErrors = (req, _res, next) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) { 
    const errors = {};
    validationErrors
      .array()
      .forEach(error => errors[error.path] = error.msg);

    const err = Error("Bad request.");
    err.errors = errors;
    err.status = 400;
    err.title = "Bad request.";
    next(err);
  }
  next();
};

module.exports = {
  handleValidationErrors,
  checkOwner,
  checkExists
};