// routing for our api
const express = require('express');
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');

//declare our router
const router = express.Router();
// get routes
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
// post routes
router.post('/users', UsersController.postNew);

module.exports = router;
