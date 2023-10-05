const express = require('express');
const {  requireAuth } = require('../../utils/auth');
const router = express.Router();

const { SpotImage, sequelize,Spot } = require('../../db/models');

const { deleteItem } = require('../../utils/management');
const { handleValidationErrors, checkOwner, checkExists,checkA } = require('../../utils/validation');
const { checkDB } = require('../../utils/checker');

const validateSpotImageDeletion = [
    requireAuth,
    checkExists("SpotImage",{
        include: [{model:Spot,attributes:['ownerId'] }],
        
        //attributes: {include:['Spot.ownerId']}
       }),
    checkOwner("Spot Image"),
    
    handleValidationErrors
];

router.delete('/:imageId',
    validateSpotImageDeletion,
    async (req, res) => {
        console.log('heloooo')
        const id = parseInt(req.params.imageId);
        await deleteItem("SpotImage", {where: {id: id}})
    res.json({"message": "Successfully deleted"})
});
module.exports = router;