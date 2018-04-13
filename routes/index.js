const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {ensureAuthenticated, ensureGuest} = require('../helpers/auth');

// load models
require('../models/forecastTopic');
const forecastTopic = mongoose.model('forecastTopics');
require('../models/user');
const User = mongoose.model('users');


router.get('/', (req, res) => {  
    res.render('index/welcome');
  });
  
router.get('/dashboard', ensureAuthenticated, (req, res) => {

  forecastTopic.find()
  .populate('submits')
  .then((forecastTopic)=>{
    var omat = [];

    const length = forecastTopic[0].submits.length;
    
    for (i = 0; i<length; i++) { 
      if(forecastTopic[0].submits[i].user==req.user.id) {
        omat.push(forecastTopic[0].submits[i])}
    };
    forecastTopic.submits = omat;

    if(forecastTopic.result=1){
      var truth = true
    } else if(forecastTopic.result=0){

    }

      res.render('index/dashboard',{
        forecasts:forecastTopic
      });

});
})

  router.get('/about', (req, res) => {
    res.render('index/about');
  });
  
  

module.exports = router;