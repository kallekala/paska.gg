const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {ensureAuthenticated, ensureGuest} = require('../helpers/auth');
const bodyParser = require('body-parser');

//load helpers for database filtering
const filters = require('../helpers/filters.js')

// load models
require('../models/forecastTopic');
const forecastTopic = mongoose.model('forecastTopics');
require('../models/user');
const User = mongoose.model('users');
require('../models/organization');
const organization = mongoose.model('organizations');


//welcome page
router.get('/', (req, res) => { 
           res.render('index/welcome')
});
    
//admin page
router.get('/admin', (req, res) => {
    //i put this workaround authentication. should improve with req.user
    if(req.user.admin){
        User.find()
            .then(users => {
                organization.find()
                    .then(organizations=> {
        res.render('index/admin', {
            users:users,
            organizations:organizations
        });
        });
            });
        }
        else {
            res.render('index/about');
        }
        }         
);

//create new org process
router.post('/addOrg', ensureAuthenticated, (req, res) => {
    const newOrg = {
        name: req.body.newOrgName,
    };
      //check for existing org
      organization.findOne({
        name: req.body.newOrgName
      })
        .then(org => {
        if(org){
          //return org
          done(null, user);
        } else {
          //create org
          new organization(newOrg)
            .save()
            .then(() => {
                    req.flash('success_msg', `Organization "${req.body.newOrgName}" was created`);
                    res.redirect('/');
                })
        }
        });
})

//dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => {
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
                        if(loggedUserSubmits[0]){
                            if(loggedUserSubmits[0].brierScore!="Unresolved") {loggedUserLatestBriers.push(parseFloat(loggedUserSubmits[0].brierScore))};
                            }
                        }
            };

            //count topics participated by logged user
            forecastTopic.count=forecastTopic.length;
            function countUnique(iterable) {
                return new Set(iterable).size;
            }

            forecastTopic.loggedUserTopics=countUnique(loggedUserTopics);

            //find logged users brier score avg
            if(loggedUserLatestBriers.length>0){
            var ownSum = loggedUserLatestBriers.reduce( (accumulator, currentValue) => accumulator + currentValue );
            forecastTopic.ownAvg = Math.round((ownSum/loggedUserLatestBriers.length*100))/100;
        }

            //shorten guessarrays
            filters.shortenGuessArrays(forecastTopic)
                .then((forecastTopic)=> {
                    //find user's orgs
                    filters.listOwnOrgs(req.user._id)
                        .then(ownOrgs=>{

                            filters.fillOrgsMembers(ownOrgs)
                                .then(orgs => {
                                    res.render('index/dashboard',{
                                        forecastTopic:forecastTopic,
                                        organizations:orgs,
                                    });
                                })
                        })
                        .catch(()=> {
                            console.log("vituiksi")
                            res.render('index/welcome',);
                            })
                .catch((err)=>{
                    console.log(`error from shortening the guessarrays: ${err}`)
                    res.render('index/welcome',);
            })
            })
        })
});

//stats page
router.get('/statistics', (req, res) => {
    res.render('index/statistics');
});

//about page
router.get('/about', (req, res) => {
    res.render('index/about');
});


module.exports = router;