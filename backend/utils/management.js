const { Spot,SpotImage,Booking,Review,ReviewImage } = require('../db/models');

const deleteItem = async function(table,options){
    const selectedTable = {
        "Spot": Spot,
        "Booking": Booking,
        "SpotImage": SpotImage,
        "Review": Review,
        "ReviewImage": ReviewImage
    }
    console.log(selectedTable[table])
    await selectedTable[table].destroy(options)
};


module.exports = {
    deleteItem
};