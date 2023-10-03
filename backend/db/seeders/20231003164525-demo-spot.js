'use strict';

const { Review,Spot,User } = require('../models');
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  async up (queryInterface, Sequelize) {
    await Spot.bulkCreate([
      {
        ownerId: 1,
        address: '45 34th St',
        city: 'Los Angeles',
        state: 'CA',
        country: 'US',
        lat: 1.5,
        lng: 5.1,
        name: 'space',
        description: 'great nice',
        price: 5.0,
      }
    ], { validate: false });
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Spots';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      ownerId: { [Op.in]: [1, 2] }
    }, {});
  }
};