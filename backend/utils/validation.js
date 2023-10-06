const { validationResult } = require('express-validator');
const { Spot,Booking,SpotImage,Review,ReviewImage,sequelize } = require('../db/models');

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
      id: 'imageId',
      t: SpotImage,
      o: 'ownerId',
      p: 'imageId'
  },
  "Review": {
      id: 'reviewId',
      t: Review,
      o: 'userId',
      uid: 'userId'
  },
  "ReviewImage": {
      id: 'reviewImageId',
      t: ReviewImage
  }
}

const checkExists = (table,options = {}, method=null,idName=undefined)=>{
  return async function (req, res, next) {
    if (!idName)  idName = selectedTable[table].id;
    const existsDB = await selectedTable[table].t.findByPk(req.params[idName],options);
   console.log(existsDB)
    if (existsDB || method) {
      req.tryOwner = existsDB[selectedTable[table].o] || Object.values(existsDB).pop()[selectedTable[table].o];
      req.tryUserId = existsDB[selectedTable[table].uid] || 0;
      console.log(req.tryOwner,req.tryUserId,table)
      if(method) {
        const err = method(req.tryOwner,req.tryUserId);
        if (err) return next(err);
        return next()
      }
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

const checkReviewExists = async (req,res,next)=>{
  const {user} = req;
  const review = await Review.findOne({where: {spotId:req.params.spotId,userId:user.id}})
  if(review) {
    const err = new Error("User already has a review for this spot")
    err.status = 403;
    return next(err);
  } return next();
} 
const checkMaxReviewImages = async (req,res,next)=>{
  const review = await ReviewImage.count({where: {reviewId:req.params.reviewId}})
  if(review>=10) {
    const err = new Error("Maximum number of images for this resource was reached")
    err.status = 403;
    return next(err);
  } return next();
} 
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
  checkExists,
  checkReviewExists,
  checkMaxReviewImages
};