const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {ensureAuthenticated} = require('../helpers/auth');

// load models
require('../models/forecastTopic');
const forecastTopic = mongoose.model('forecastTopics');
require('../models/submittedForecast');
const submittedForecast = mongoose.model('submittedForecasts');
require('../models/user');
const User = mongoose.model('users');


router.get('/', (req, res) => {
    res.render('index/welcome');
  });
  
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  submittedForecast
  .find({submittedBy:req.user.id})
    .then((forecasts) =>{
      console.log(req.user.id)
      res.render('index/dashboard',{
        forecasts:forecasts});
  });
});


  router.get('/about', (req, res) => {
    res.render('index/about');
  });
  
  

module.exports = router;