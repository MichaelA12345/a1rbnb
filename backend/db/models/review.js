'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
        Review.hasMany(
          models.ReviewImage,
          { foreignKey: 'reviewId', onDelete: 'CASCADE',  hooks: true  }
        );
        Review.belongsTo(models.User, { foreignKey: 'userId'})
        Review.belongsTo(models.Spot, { foreignKey: 'spotId'})
    }
  }
  Review.init({
    spotId: {
      type: DataTypes.INTEGER,
      references: { model: 'Spots', key: 'id' },
      onDelete: 'CASCADE'
    },
    userId: {
      type: DataTypes.INTEGER,
      references: { model: 'Users', key: 'id' }, 
      onDelete: 'CASCADE'
    },
    review: {
      type: DataTypes.STRING
    },
    stars: {
      type: DataTypes.INTEGER
    },
  }, {
    sequelize,
    modelName: 'Review',
  });
  return Review;
};