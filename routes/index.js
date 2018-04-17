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
  
//dashboard uusi
router.get('/dashboard', ensureAuthenticated, (req, res) => {
console.log("lähtee")
  forecastTopic.find()
  .populate('submits.user')
  .sort({date:'desc'})
  .then((forecastTopics) => {
      console.log("sortin jälkeen")
      console.log(`topic 3: `)
      var loggedUser = req.user._id;
      console.log(forecastTopics.length);
      for (i = 0; i<forecastTopics.length; i++) {
          console.log(`loopissa nro: ${i}`);

          var loggedUserSubmits = [];
          var tama = forecastTopics[i];
          var subArray = forecastTopics[i].submits;
          //ennen submitteja homma toimi
              if(subArray.length>0){
                  for(j = 0; j<subArray.length; j++){
                      //laitan stringeiksi koska muuten type on jostain syystä objekti jolloin ei toimi ifissä
                      var nokka = String(req.user._id);
                      var pokka = String(subArray[j].user._id);
                              if(nokka===pokka) {
                                  loggedUserSubmits.push(subArray[j]);
                              } 
                  }
              }
          tama.submits = loggedUserSubmits
      };

      res.render('index/dashboard',{
        forecasts:forecastTopics
      });

});
})



  router.get('/about', (req, res) => {
    res.render('index/about');
  });
  
  

module.exports = router;