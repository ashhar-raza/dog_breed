
const express = require('express');
const router = express.Router();
const breedController = require('../controller/breed.controller');

router.get('/', breedController.getBreeds);

module.exports = router;