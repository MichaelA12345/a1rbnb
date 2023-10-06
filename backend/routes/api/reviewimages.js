const express = require('express');
const {  requireAuth } = require('../../utils/auth');
const router = express.Router();

const { ReviewImage,Review, sequelize,Spot } = require('../../db/models');

const { deleteItem } = require('../../utils/management');
const { handleValidationErrors, checkOwner, checkExists } = require('../../utils/validation');

const validateReviewImageDeletion = [
    requireAuth,
    checkExists("ReviewImage",{
        include: [{model:Review,attributes:['userId'] }]
       }),
    checkOwner("Review Image"),
    
    handleValidationErrors
];

router.delete('/:imageId',
    validateReviewImageDeletion,
    async (req, res) => {
        const id = parseInt(req.params.imageId);
        await deleteItem("ReviewImage", {where: {id: id}})
    res.json({"message": "Successfully deleted"})
});
module.exports = router;