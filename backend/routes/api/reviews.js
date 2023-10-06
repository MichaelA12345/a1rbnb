const express = require('express');
const {  requireAuth } = require('../../utils/auth');
const router = express.Router();

const { User,Spot,Review,SpotImage,ReviewImage, sequelize } = require('../../db/models');
const { check } = require('express-validator');
const { handleValidationErrors, checkOwner, checkExists, checkMaxReviewImages } = require('../../utils/validation');
const { deleteItem } = require('../../utils/management');

const validateReviewImage = [
    requireAuth,
    checkExists('Review'),
    checkOwner('Review'),
    check('url')
      .exists({checkFalsy: true})
      .isURL()
      .withMessage('Enter valid image url'),
    handleValidationErrors
];
const validateReviewEdit = [
    requireAuth,
    checkExists('Review'),
    checkOwner('Review'),
    check('review')
      .exists({checkFalsy: true})
      .withMessage("Review text is required"),
    check('stars')
      .exists({ checkFalsy: true })
      .isInt({ min: 1, max: 5 })
      .withMessage("Stars must be an integer from 1 to 5"),
    handleValidationErrors
];
const validateReviewDeletion = [
    requireAuth,
    checkExists('Review'),
    checkOwner('Review'),
    handleValidationErrors
];

router.get('/current',
    requireAuth,
    async (req,res) => {
        const {user} = req;
        let reviews = await Review.findAll({where:{userId:user.id},include:[{model:User,attributes:{exclude:['username','email','hashedPassword','createdAt','updatedAt']}},{model:Spot,attributes:{exclude:['createdAt','updatedAt']}},{model:ReviewImage,attributes:{exclude:['createdAt','updatedAt','reviewId']}}]});
        reviews.forEach(r=>{
            console.log(r.ReviewImages[0])
            if(r.ReviewImages[0])r.Spot.dataValues.previewImage = r.ReviewImages[0].dataValues.url
        })
        res.json({'Reviews':reviews})
    }
);

router.post('/:reviewId/images',
    validateReviewImage,
    checkMaxReviewImages,
    async(req,res,next) => {
        const url = req.body.url;
        const reviewImage = await ReviewImage.create({reviewId:req.params.reviewId,url:url});
        const safeRes = {
            id: reviewImage.dataValues.id,
            url: reviewImage.dataValues.url
        }
        res.json(safeRes);
    }
);

router.put('/:reviewId',
    validateReviewEdit,
    async(req,res)=>{
        const {review,stars} = req.body;
        await Review.update({review:review,stars:stars},{where: {id: req.params.reviewId}})
        const updatedReview = await Review.findByPk(req.params.reviewId);
        res.json(updatedReview)
    }  
);

router.delete('/:reviewId',
    validateReviewDeletion,
    async (req,res)=>{
        const id = parseInt(req.params.reviewId);
        await deleteItem("Review", {where: {id: id}})
        res.json({"message": "Successfully deleted"})
    }
);
module.exports = router;