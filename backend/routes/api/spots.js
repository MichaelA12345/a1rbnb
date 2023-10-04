const express = require('express');
const {  requireAuth } = require('../../utils/auth');
const router = express.Router();
const { Spot,Review,SpotImage, sequelize } = require('../../db/models');

const { check } = require('express-validator');
const { handleValidationErrors, checkOwner, checkExists } = require('../../utils/validation');
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
    check('lat')
      .exists({ checkFalsy: true })
      //.isLatLong({ checkDMS: false })
      .withMessage('Latitude is not valid'),
    check('lng')
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
      .isNumeric()
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
const validateSpotEdit = [
    
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


router.get('/',
    async (req,res) => {
        const spot = await Spot.findAll({
            attributes: {
               // where: [sequelize.where(sequelize.col('Spots.id'),sequelize.col('Reviews.spotId'))],
                include: [
                    [
                        sequelize.fn('AVG', sequelize.col("Reviews.stars")),'avgRating'
                    ],
                    [sequelize.col("SpotImages.url"), 'previewImage']
                ]
            },
            include: [{
                model: Review,
                attributes: []
            },
            {
                model: SpotImage,
                attributes: []
            }]
        })
        res.json(spot)
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
    validateSpotEdit,
    async (req, res) => {

    }
);

module.exports = router;