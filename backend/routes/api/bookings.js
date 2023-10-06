const express = require('express');
const {  requireAuth } = require('../../utils/auth');
const router = express.Router();

const { check } = require('express-validator');
const { handleValidationErrors, checkOwner, checkExists, checkReviewExists } = require('../../utils/validation');
const { deleteItem } = require('../../utils/management');



module.exports = router;