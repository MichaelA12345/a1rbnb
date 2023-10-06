'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Spot extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Spot.belongsTo(models.User, { foreignKey: 'ownerId'})
      Spot.hasMany(models.Booking, { foreignKey: 'spotId', onDelete: 'CASCADE',  hooks: true })
      Spot.hasMany(models.Review, { foreignKey: 'spotId', onDelete: 'CASCADE',  hooks: true })
      Spot.hasMany(models.SpotImage, { foreignKey: 'spotId', onDelete: 'CASCADE',  hooks: true })
      
    }
  }
  Spot.init({
    ownerId: {
      type: DataTypes.INTEGER,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    address: {
      type: DataTypes.STRING
    },
    city: {
      type: DataTypes.STRING
    },
    state: {
      type: DataTypes.STRING
    },
    country: {
      type: DataTypes.STRING
    },
    lat: {
      type: DataTypes.DECIMAL
    },
    lng: {
      type: DataTypes.DECIMAL
    },
    name: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.STRING
    },
    price: {
      type: DataTypes.DECIMAL
    },
  }, {
    sequelize,
    modelName: 'Spot',
    scopes: {
      ratingAndPreview(){
        const { Review,SpotImage } = require('../models');
        return {
          include: [{model:Review,attributes:[]},{model:SpotImage,attributes:[]}],
          group: ['Spot.id'],
          attributes: {
            include: [
              [
                sequelize.fn('AVG', sequelize.col("Reviews.stars")),'avgRating'
              ],
              [sequelize.col("SpotImages.url"), 'previewImage']
            ]
          }
          
        }
      },
      preview(){
        const {SpotImage} = require('../models');
        return {
          include: [{model:SpotImage,attributes:[]}],
          attributes: {
            include: [[sequelize.col("SpotImages.url"), 'previewImage']]
          }
        }
      },
      countReviews(){
        const { Review,SpotImage } = require('../models');
        return {
          include: [{model:Review,attributes:[]}],
          attributes: {
            include: [
              [
                sequelize.fn('COUNT', sequelize.col("Reviews.id")),'numReviews'
              ]
            ]
          }
        }
      }
      
    }
  });
  return Spot;
};