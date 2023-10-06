const express = require('express');
const {  requireAuth } = require('../../utils/auth');
const router = express.Router();

const { SpotImage,Booking, sequelize,Spot } = require('../../db/models');
const { Op } = require('sequelize');
const { check } = require('express-validator');
const { handleValidationErrors, checkOwner, checkExists, checkBookingOwner,  } = require('../../utils/validation');
const { deleteItem } = require('../../utils/management');


const validateBookingDeletion = [
    requireAuth,
    checkExists("Booking",{
        include: [{model:Spot,attributes:['ownerId'] }]
    }),
    checkBookingOwner,
    
    handleValidationErrors
];

const validateBookingEdit = [
    requireAuth,
    checkExists("Booking"),
    checkOwner("Booking"),
    handleValidationErrors
];

router.get('/current',
    requireAuth,
    async (req,res) => {
        const {user} = req;
        
        const bookings = await Booking.findAll({where:{userId:user.id},include:{model:Spot,attributes:{exclude:['updatedAt','createdAt']},include:{model:SpotImage}}});
        
        for (let b of bookings){
            console.log(Object.keys(b.Spot.SpotImages).length)
            if(b.Spot.SpotImages.length)b.Spot.dataValues['previewImage'] = b.Spot.SpotImages[0]['url'];
            console.log(b.Spot['previewImage'] )
            delete b.Spot.dataValues.SpotImages;
          
        }
        
        //delete bookings[0].Spot.dataValues.SpotImages
        res.json(bookings)
    }
);

router.put('/:bookingId',
    validateBookingEdit,
    async(req,res,next)=>{
        let {startDate,endDate} = req.body;
        const {bookingId} = req.params;
        startDate = new Date(startDate);
        endDate = new Date(endDate);
        if(endDate<startDate){
            res.statusCode = 400;
        return res.json({"message":"endDate cannot come before startDate"})
        }
        const updatedBooking = await Booking.findByPk(bookingId);
        if(updatedBooking.endDate<new Date()){
            res.statusCode = 403;
        return res.json({"message":"Past bookings can\'t be modified"})
        }
        const bookingConflict = await Booking.findOne({where:{spotId:updatedBooking.spotId,[Op.or]:[{startDate:{[Op.between]:[startDate,endDate]}},{endDate:{[Op.between]:[startDate,endDate]}}]}})
        console.log(bookingConflict)
        if(bookingConflict) {
        res.statusCode = 403;
        return res.json({"message":"Sorry, this spot is already booked for the specified dates"})
      }
        await Booking.update({startDate:startDate,endDate:endDate},{where:{id:bookingId}})
        const update = await Booking.findByPk(bookingId);
        res.json(update)
    }
);

router.delete('/:bookingId',
    validateBookingDeletion,
    async (req, res) => {

        const id = parseInt(req.params.bookingId);
        const b = await Booking.findByPk(id);
        let startDate = b.startDate;
        let now = new Date();
        if(startDate.getTime()<=now.getTime()){
            res.statusCode = 400;
            return res.json({"message":"Bookings that have been started can\'t be deleted"})
        }
        await deleteItem("Booking", {where: {id: id}})
    res.json({"message": "Successfully deleted"})
});

module.exports = router;