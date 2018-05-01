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
  
//dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => {

    if (req.user.memberOrganizations[0]==="wipunen"){
        console.log("meni wipuseen");

        forecastTopic.find({organizations:"wipunen"})
        .populate('submits.user')
        .sort({date:'desc'})
        .then((forecastTopic) => {
            console.log("meni findin läpi");
console.log(forecastTopic.length);
            var loggedUser = req.user._id;
            var loggedUserLatestBriers =[];
            var loggedUserTopics = [];
            //filter out submits from other than logged user
            for (i = 0; i<forecastTopic.length; i++) {
                var loggedUserSubmits = [];
                var tama = forecastTopic[i];
                var subArray = forecastTopic[i].submits;
                    if(subArray.length>0){
                        for(j = 0; j<subArray.length; j++){
                            //converting to strings bc objects dont work in comparison

                            var nokka = String(req.user._id);
                            var pokka = String(subArray[j].user._id);
                                    if(nokka===pokka) {
                                        loggedUserTopics.push(i);
                                        loggedUserSubmits.push(subArray[j]);
                                    } 
                        }
                        tama.submits = loggedUserSubmits;

                        if(loggedUserSubmits[0].brierScore!="Unresolved") {loggedUserLatestBriers.push(parseFloat(loggedUserSubmits[0].brierScore))};
                    
                    }
            };
            //count topics participated by logged user
            forecastTopic.count=forecastTopic.length;
            function countUnique(iterable) {
                return new Set(iterable).size;
            }      

            forecastTopic.loggedUserTopics=countUnique(loggedUserTopics);
            console.log("ennen brieriä")

            //find logged users brier score avg
            if(loggedUserLatestBriers.length>0){
            var ownSum = loggedUserLatestBriers.reduce( (accumulator, currentValue) => accumulator + currentValue );
            forecastTopic.ownAvg = Math.round((ownSum/loggedUserLatestBriers.length*100))/100;
            console.log("töökkö")
        }
            res.render('index/dashboard',{
                forecastTopic:forecastTopic
            });

            
        })
    } else {
        console.log("meni ei-wipuseen");

        forecastTopic.find()
        .populate('submits.user')
        .sort({date:'desc'})
        .then((forecastTopic) => {
            
            var loggedUser = req.user._id;
            var loggedUserLatestBriers =[];
            var loggedUserTopics = [];
            //filter out submits from other than logged user
            for (i = 0; i<forecastTopic.length; i++) {
                var loggedUserSubmits = [];
                var tama = forecastTopic[i];
                var subArray = forecastTopic[i].submits;
                    if(subArray.length>0){
                        for(j = 0; j<subArray.length; j++){
                            //converting to strings bc objects dont work in comparison
                            var nokka = String(req.user._id);
                            var pokka = String(subArray[j].user._id);
                                    if(nokka===pokka) {
                                        loggedUserTopics.push(i);
                                        loggedUserSubmits.push(subArray[j]);
                                    } 
                        }
                        tama.submits = loggedUserSubmits;
                        if(loggedUserSubmits[0].brierScore!="Unresolved") {loggedUserLatestBriers.push(parseFloat(loggedUserSubmits[0].brierScore))};
                    
                    }
            };
            //count topics participated by logged user
            forecastTopic.count=forecastTopic.length;
            function countUnique(iterable) {
                return new Set(iterable).size;
            }      
            forecastTopic.loggedUserTopics=countUnique(loggedUserTopics);

            //find logged users brier score avg
            var ownSum = loggedUserLatestBriers.reduce( (accumulator, currentValue) => accumulator + currentValue );
            forecastTopic.ownAvg = Math.round((ownSum/loggedUserLatestBriers.length*100))/100;

            res.render('index/dashboard',{
                forecastTopic:forecastTopic
            }  
        );
        });

        router.get('/about', (req, res) => {
            res.render('index/about');
        });
    }
});
  

module.exports = router;