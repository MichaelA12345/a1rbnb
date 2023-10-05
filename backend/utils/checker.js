const { Spot,Booking,SpotImage,Review,ReviewImage } = require('../db/models');
const selectedTable = {
    "Spot": {
        id: 'spotId',
        t: Spot
    },
    "Booking": {
        id: 'bookingId',
        t: Booking
    },
    "SpotImage": {
        id: 'spotImageId',
        t: SpotImage
    },
    "Review": {
        id: 'reviewId',
        t: Review
    },
    "ReviewImage": {
        id: 'reviewImageId',
        t: ReviewImage
    }
}
class Checker {
    constructor(table,options) {
        this.table = table;
        this.options = options;
    }
    
    existsDB = (req,res,next) =>{
        console.log('worksssssssssssssss')
        this.table = '34'
        return next();
    }
    test = () => {
        console.log('wragainnnnnnn',this.table)
    }

    async itemExists(req,res,next) {
        const selected = selectedTable[this.table];
        const existsDB = await selected.t.findByPk(req.params.selected.id);
        if(existsDB) {
            req.tryOwner = existsDB.ownerId
            return next();}
        const err = new Error('Spot couldn\'t be found')
        err.status = 404;
        err.title = 'Spot couldn\'t be found'
        err.errors = { message: 'Spot couldn\'t be found' }
        return next(err);
    }
    

    checkOwner(req, res, next) {
        if(req.tryOwner == req.user.id) return next();
        const err = new Error('Spot must belong to the current user');
        err.status = 403;
        return next(err)
    }
    
}

const checkDB = () =>  {
    existsDB = (req,res,next) =>{
        console.log('worksssssssssssssss')
        this.table = '34'
        return next();
    },
    test = () => {
        console.log('wragainnnnnnn',this.table)
    }
    msg = () => {
        return {

        }
    }
}

module.exports = {
    checkDB
}