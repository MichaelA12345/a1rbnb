const express = require('express');
const {  requireAuth } = require('../../utils/auth');
const router = express.Router();

const { SpotImage, sequelize,Spot } = require('../../db/models');

const { deleteItem } = require('../../utils/management');
const { handleValidationErrors, checkOwner, checkExists } = require('../../utils/validation');

const validateSpotImageDeletion = [
    requireAuth,
    checkExists("SpotImage",{
        include: [{model:Spot,attributes:['ownerId'] }]
       }),
    checkOwner("Spot Image"),
    
    handleValidationErrors
];

router.delete('/:imageId',
    validateSpotImageDeletion,
    async (req, res) => {
        const id = parseInt(req.params.imageId);
        await deleteItem("SpotImage", {where: {id: id}})
    res.json({"message": "Successfully deleted"})
});
module.exports = router;