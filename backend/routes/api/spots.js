const express = require('express');
const {  requireAuth } = require('../../utils/auth');
const router = express.Router();
const { User,Spot,Review,SpotImage,ReviewImage,Booking, sequelize } = require('../../db/models');
const { Op } = require('sequelize');
const { check } = require('express-validator');
const { handleValidationErrors, checkOwner, checkExists, checkReviewExists } = require('../../utils/validation');
const { deleteItem } = require('../../utils/management');
const { Checker } = require('../../utils/checker');

//const Checker = new Checker;

const validateSpotCreation = [
    requireAuth,
    check('address')
      .exists({ checkFalsy: true })
      .withMessage('Street address is required'),
    check('city')
      .exists({ checkFalsy: true })
      .withMessage('City is required'),
    check('state')
      .exists({ checkFalsy: true })
      .withMessage('State is required'),
    check('country')
      .exists({ checkFalsy: true })
      .withMessage('Country is required'),
    check('lat').isFloat({min:-90,max:90})
      .exists({ checkFalsy: true })
      //.isLatLong({ checkDMS: false })
      .withMessage('Latitude is not valid'),
    check('lng').isFloat({min:-180,max:180})
      .exists({ checkFalsy: true })
      //.isLatLong({ checkDMS: false })
      .withMessage('Longitude is not valid'),
    check('name')
      .exists({ checkFalsy: true })
      .isLength({ max: 50 })
      .withMessage('Name must be less than 50 characters'),
    check('description')
      .exists({ checkFalsy: true })
      .withMessage('Description is required'),
    check('price')
      .exists({ checkFalsy: true })
      .isFloat({min:0})
      .withMessage('Price per day is required'),
    handleValidationErrors
];

const validateSpotDeletion = [
    requireAuth,
    //(req,res,next)=>new Checker("Spot",{}).itemExists().checkOwner(),
    checkExists('Spot'),
    checkOwner('Spot'),
    handleValidationErrors
];
const validateBookingCreation = [
    requireAuth, 
    checkExists("Spot"),
    handleValidationErrors
];
const validateSpotEdit = [
    checkExists('Spot'),
    checkOwner('Spot'),
    handleValidationErrors
];
const validateSpotImageCreation = [
    requireAuth,
    checkExists('Spot'),
    checkOwner('Spot'),
    check('url')
      .exists({checkFalsy: true})
      .isURL()
      .withMessage('Enter the spot\'s image url'),
    check('preview')
      .exists()
      .isBoolean()
      .withMessage('Enter true or false whether to show preview of image'),
    handleValidationErrors
];

const validateSpotReviewCreation = [
    requireAuth,
    checkExists('Spot'),
    checkReviewExists,
    check('review')
      .exists({checkFalsy: true})
      .withMessage("Review text is required"),
    check('stars')
      .exists({ checkFalsy: true })
      .isInt({ min: 1, max: 5 })
      .withMessage("Stars must be an integer from 1 to 5"),
    handleValidationErrors
];
const validateSpotSearchFilters = [
    check('page').isInt({min:1}).optional({nullable:true}).withMessage("Page must be greater than or equal to 1"),
    check('size').isInt({min:1}).optional({nullable:true}).withMessage("Size must be greater than or equal to 1"),
    check('maxLat').isFloat({min:-90,max:90}).optional({nullable:true}).withMessage('Maximum latitude is invalid'),
    check('minLat').isFloat({min:-90,max:90}).optional({nullable:true}).withMessage('Minimum latitude is invalid'),
    check('minLng').isFloat({min:-180,max:180}).optional({nullable:true}).withMessage('Maximum longitude is invalid'),
    check('maxLng').isFloat({min:-180,max:180}).optional({nullable:true}).withMessage('Minimum longitude is invalid'),
    check('minPrice').isFloat({min:0}).optional({nullable:true}).withMessage('Minimum price must be greater than or equal to 0'),
    check('maxPrice').isFloat({min:0}).optional({nullable:true}).withMessage('Maximum price must be greater than or equal to 0'),
    handleValidationErrors

];
router.get('/current', 
    requireAuth,
    async (req, res) => {
        const {user} = req;
        const userSpots = await Spot.scope({method: ["ratingAndPreview"]}).findAll({where: { ownerId: user.id}});
        userSpots.forEach(s=>{
            s.dataValues.lat = parseFloat(s.dataValues.lat);
            s.dataValues.lng = parseFloat(s.dataValues.lng);
            s.dataValues.price = parseFloat(s.dataValues.price)
            
        })
        res.json({"Spots":userSpots})
    }
 );
router.get('/',
validateSpotSearchFilters,
    async (req,res) => {
        const {maxLat,minLat,minLng,maxLng,minPrice,maxPrice} = req.query;
        const where = {  
        };
        maxLat?where.lat = {[Op.lte]:maxLat}:null;
        minLat?where.lat = {[Op.gte]:minLat}:null;
        maxLng?where.lng = {[Op.lte]:maxLng}:null;
        minLng?where.lng = {[Op.gte]:minLng}:null;
        maxPrice?where.price = {[Op.lte]:maxPrice}:null;
        minPrice?where.price = {[Op.gte]:minPrice}:null;
        const page = req.query.page === undefined || (1>req.query.page>10) ? 1 : parseInt(req.query.page);
        const size = req.query.size === undefined || (1>req.query.size>20)? 20 : parseInt(req.query.size);
        const limit = size;
        const offset = size * (page-1);
        const spot = await Spot.findAll({where: where,limit: limit,offset:offset,include:[{model:Review,attributes:{exclude:['createdAt','updatedAt','id','spotId','userId','review']}},{model:SpotImage,attributes:{exclude:['id','preview','createdAt','updatedAt','spotId']}}]});
        spot.forEach(s=>{
            s.dataValues.lat = parseFloat(s.dataValues.lat)
            s.dataValues.lng = parseFloat(s.dataValues.lng)
            s.dataValues.price = parseFloat(s.dataValues.price);
            s.dataValues.createdAt = s.dataValues.createdAt.toISOString().slice(0,10)
            s.dataValues.updatedAt = s.dataValues.updatedAt.toISOString().slice(0,10)
            let p = s.dataValues.SpotImages[0];
            let r = s.dataValues.Reviews[0];
            if (r){
                //console.log(s.dataValues.Reviews[0].stars)
                const avgRating = s.dataValues.Reviews.reduce((a,b)=>parseFloat(a.stars)+parseFloat(b.stars))/s.dataValues.Reviews.length;
                const avgR = avgRating||s.dataValues.Reviews[0].stars;
                delete s.dataValues.Reviews;
                s.dataValues.avgRating = avgR;
            }
            if(s.dataValues.Reviews) delete s.dataValues.Reviews;
            if (p) s.dataValues.previewImage = s.dataValues.SpotImages[0].url
            delete s.dataValues.SpotImages;
        });
        const theSpots = {"Spots":spot,page:page,size:size}
        res.json(theSpots)
    }
);
router.get('/:spotId/bookings',
    requireAuth,
    checkExists("Spot"),
    async (req,res)=> {
        const {spotId} = req.params;
        const {user} = req;

        const spotBookings = await Booking.findAll({where:{spotId:spotId},include:[{model:User},{model:Spot,attributes:{exclude:['id','address','city','state','country','lat','lng','name','description','price','createdAt','updatedAt']}}]});
        spotBookings.forEach(i=>{
            if(user.id!=i.Spot.ownerId){
            delete i.dataValues.User
            delete i.dataValues.id;
            delete i.dataValues.userId;
            delete i.dataValues.createdAt;
            delete i.dataValues.updatedAt
            }
            delete i.User.dataValues.username
            delete i.Spot.dataValues
        })
        
        res.json({Bookings: spotBookings})
    }
);
router.get('/:spotId/reviews',
    checkExists("Spot"),
    async (req,res) => {
        const spotsByReview = await Review.findAll({where:{spotId:req.params.spotId},include:[{model:User,attributes:{exclude:['username','email','hashedPassword','createdAt','updatedAt']}},{model:ReviewImage,attributes:{exclude:['createdAt','updatedAt','reviewId']}}]})
        res.json({Reviews:spotsByReview})
    }
);
router.get('/:spotId',
checkExists("Spot"),
    async (req,res) =>{
        const spotFull = await Spot.scope([{method: ["countReviews"]},{method: ["ratingAndPreview"]}]).findByPk(parseInt(req.params.spotId),{include:[{model:User}]});
        const spotImages = await SpotImage.findAll({where: {spotId: req.params.spotId}})
        let s = spotFull.dataValues;
        const usr = {id:s.User.id,firstName:s.User.firstName,lastName:s.User.lastName} 
        delete s.previewImage;
        delete s.User
        delete s.idk;
        s.lat = parseFloat(s.lat);
        s.lng = parseFloat(s.lng)
        s.price = parseFloat(s.price);
        s.numReviews = parseInt(s.numReviews);
        s.avgRating = parseFloat(s.avgRating);
        s.SpotImages = spotImages;
        s.Owner = usr

        res.json(s)
    }
);

router.post('/:spotId/bookings',
    validateBookingCreation,
    async (req,res) => {
        const {startDate,endDate} = req.body;
        const {user} = req;
        const {spotId} = req.params;
        if(endDate<=startDate){
            res.statusCode = 400;
        return res.json({"message":"endDate cannot come before startDate"})
        }
        const spotOwn = await Spot.findByPk(spotId)
        if (spotOwn.ownerId == user.id) {
            res.statusCode = 403;
        return res.json({"message":"Spot must NOT belong to the current user"})
        }
        const bookingConflict = await Booking.findOne({where:{spotId:req.params.spotId,[Op.or]:[{startDate:{[Op.between]:[startDate,endDate]}},{endDate:{[Op.between]:[startDate,endDate]}}]}})
        console.log(bookingConflict)
        if(bookingConflict) {
        res.statusCode = 403;
        return res.json({"message":"Sorry, this spot is already booked for the specified dates"})
      }

        const newBooking = await Booking.create({spotId:spotId,userId:user.id,startDate:startDate,endDate:endDate});
        res.json(newBooking)
    }
);
router.post('/:spotId/reviews',
    validateSpotReviewCreation,
    async (req,res) =>{
        const {review,stars} = req.body;
        const {user} = req;
        const spotId = req.params.spotId;
        const createdReview = await Review.create({userId:user.id,spotId:parseInt(spotId),review:review,stars:stars});
        res.json(createdReview)
    }
)
router.post('/:spotId/images',
    validateSpotImageCreation,
    async (req, res) => {
        const { url, preview} = req.body;
        const spotId = req.params.spotId;

        const newSpotImage = await SpotImage.create({spotId,url,preview});
        const safeSpotImage = {
            id: newSpotImage.id,
            url: newSpotImage.url,
            preview: newSpotImage.preview
        }
        res.json(safeSpotImage)  
    }
);
router.post('/',
    validateSpotCreation,
    async (req,res) => {
        const {address,city,state,country,lat,lng,name,description,price} = req.body;
        
        const {user} = req;
        const ownerId = user.id;

        const spot = await Spot.create({ownerId,address,city,state,country,lat,lng,name,description,price})
        const spotFull = await Spot.findByPk(spot.id)
        spotFull.dataValues.lat = parseFloat(spotFull.dataValues.lat);
        spotFull.dataValues.lng = parseFloat(spotFull.dataValues.lng);
        spotFull.dataValues.price = parseFloat(spotFull.dataValues.price)
        res.json(spotFull)
    }

);

router.delete('/:spotId',
    validateSpotDeletion,
    async (req, res) => {
        await deleteItem("Spot", {where: {id: req.params.spotId}})
    res.json({"message": "Successfully deleted"})
});


router.put('/:spotId', 
    validateSpotCreation,
    validateSpotEdit,
    async (req, res) => {
        const {address,city,state,country,lat,lng,name,description,price} = req.body;
        await Spot.update({address:address,city:city,state:state,country:country,lat:lat,lng:lng,name:name,description:description,price:price},{where: {id: req.params.spotId}});
        const updatedSpot = await Spot.findByPk(req.params.spotId)
        updatedSpot.dataValues.lat = parseFloat(updatedSpot.dataValues.lat);
        updatedSpot.dataValues.lng = parseFloat(updatedSpot.dataValues.lng);
        updatedSpot.dataValues.price = parseFloat(updatedSpot.dataValues.price)
        res.json(updatedSpot.dataValues);
    }
);

module.exports = router;