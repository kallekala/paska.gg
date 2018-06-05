const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {ensureAuthenticated, ensureGuest} = require('../helpers/auth');

module.exports = router;

// load models
require('../models/forecastTopic');
const forecastTopic = mongoose.model('forecastTopics');
require('../models/user');
const User = mongoose.model('users');
require('../models/organization');
const organization = mongoose.model('organizations');

//load helpers for database filtering
const filters = require('../helpers/filters.js')

//forecast perussivu
router.get('/', ensureAuthenticated, (req, res) => {
    filters.getOrgs(req.user._id, res)
        .then((okTopics) => {
                    var loggedUser = req.user._id;
                    for (i = 0; i<okTopics.length; i++) {
                        var loggedUserSubmits = [];
                        var subArray = okTopics[i].submits;
                        var tama = okTopics[i]
                            if(subArray.length>0){
                                for(j = 0; j<subArray.length; j++){
                                    //laitan stringeiksi koska muuten type on jostain syystä objekti jolloin ei toimi ifissä
                                    var nokka = String(req.user._id)
                                    var pokka = String(subArray[j].user) 
                                            if(nokka===pokka) {
                                                loggedUserSubmits.push(subArray[j]);
                                            } 
                                }
                            }
                        tama.submits = loggedUserSubmits
                    };
            res.render('forecasts/forecastsIndex',{
                forecastTopics:okTopics
            })
        })
        .catch((errormsg) => {
            console.log(`errori: ${errormsg}`)
            res.render('forecasts/forecastsIndex')
        });
    })

//page I for adding new topics
router.get('/add', ensureAuthenticated, (req, res)=>{
    User.find({_id:req.user._id})
        .populate('memberOrganizations')
        .then(user => {
            var organizations = user[0].memberOrganizations;
            res.render('./forecasts/addForecast', {
                organizations:organizations
           });
        });
    });

//add new topic process form for both pages I and II
router.post('/', ensureAuthenticated, (req, res) => {

    //bubblegum version of checking if the request comes from page II of adding process
    if(req.body.second){
        var optionsArray = [];
        //couldnt get loop to work so made with ifs
        forecastTopic.find({title:req.body.title})
        .then(forecastTopic => {
            forecastTopic[0].options = [];
            if(req.body.options0){
            forecastTopic[0].options.push(req.body.options0)
            }
            if(req.body.options1){
            forecastTopic[0].options.push(req.body.options1)
            }
            if(req.body.options2){
            forecastTopic[0].options.push(req.body.options2)
            }
            if(req.body.options3){
            forecastTopic[0].options.push(req.body.options3)
            }
            if(req.body.options4){
            forecastTopic[0].options.push(req.body.options4)
            }
            console.log(forecastTopic[0].options)
            forecastTopic[0].save();
            req.flash('success_msg', `${forecastTopic[0].title} was created`);
            res.redirect('/forecasts')
        })
    } else {
    // validation for server side
    let errors = [];
    if (!req.body.title) {
        errors.push({text: 'Please add title'})
    };

    forecastTopic.find({title:req.body.title})
        .then(titleProposal => {
            if(titleProposal.length>0){
            errors.push({text: 'This title already exists'})
            };
        })
            .then(()=>{
                if (errors.length > 0) 
                    {User.find({_id:req.user._id})
                        .populate('memberOrganizations')
                        .then(user => {
                        var organizations = user[0].memberOrganizations;
                        res.render('./forecasts/addForecast', {
                            errors: errors,
                            title: req.body.title,
                            details: req.body.details,
                            nOfOptions: req.body.nOfOptions,
                            organizations: organizations
                        })
                    })
                }

                else {
                    var orgut = [];

                    for (i = 0; i<req.user.memberOrganizations.length; i++) {
                        var org = req.user.memberOrganizations[i];
                        if(req.body[org]){orgut.push(req.user.memberOrganizations[i])
                        }
                    }

                    if(req.body.nOfOptions){
                        const nOfOptions = req.body.nOfOptions;
                        var options = [];

                        for (i = 0; i < nOfOptions; i++){
                            options.push(i)
                        }
                    }

                    const newUser = {
                        title: req.body.title,
                        details: req.body.details,
                        organizations: orgut,
                        user: req.user.id,
                        options: options
                    }

                    new forecastTopic(newUser)

                    .save()
                    .then(forecastTopic=> {
                        //then goes to page II of adding process
                        res.render('./forecasts/addForecastII', {
                            forecastTopic: forecastTopic,
                        })
                    })
                };   
            });    
        }
});

//edit page
router.get('/edit/:id', ensureAuthenticated, (req, res) => {
    forecastTopic.findOne({
      _id: req.params.id
    })
    .then(forecastTopic => {
      if(forecastTopic.user != req.user.id){
        res.redirect('/');
      } else {
        res.render('forecasts/edit', {
          forecastTopic: forecastTopic
        });
      }
    });
  });

//edit forecast topic form process. hmm
router.put('/:id', ensureAuthenticated, (req, res) => {
    forecastTopic
        .findOne({
        _id: req.params.id
    })
        .then(forecastTopic => {
            forecastTopic.submittedProbability = req.body.submittedProbability;
            forecastTopic.title = req.body.title;
            forecastTopic.details = req.body.details;
            forecastTopic.save()
                .then(forecastTopic => {
                    req.flash('success_msg', `Your guess for "${forecastTopic.title}" was updated`);
                    res.redirect('/forecasts');
                })
        })
});


// Show Single forecast
router.get('/show/:id', (req, res) => {
    forecastTopic.findOne({_id: req.params.id})
    .populate('user')
    .populate('comments.commentUser')
    .populate('submits.user')
    .then(forecastTopic => {
        var omat = [];
        for (i = 0; i<forecastTopic.submits.length; i++) { 
            if(forecastTopic.submits[i].user._id==req.user.id) {
                omat.push(forecastTopic.submits[i]);
            }
        }
        forecastTopic.submits = omat;

        res.render('forecasts/show', {
            forecastTopic:forecastTopic,
        });
    })
});


//submit guess
router.put('/submitGuess/:id', ensureAuthenticated, (req, res) => {

    //lets try to make array of the guesses that we can then feed somewhere
    var guessArray = [];

    if(req.body.submittedProbability0){guessArray[0] = req.body.submittedProbability0}
    else {guessArray[0] = 0}
    if(req.body.submittedProbability1){guessArray[1] = req.body.submittedProbability1}
    else {guessArray[1] = 0}
    if(req.body.submittedProbability2){guessArray[2] = req.body.submittedProbability2}
    else {guessArray[2] = 0}
    if(req.body.submittedProbability3){guessArray[3] = req.body.submittedProbability3}
    else {guessArray[3] = 0}
    if(req.body.submittedProbability4){guessArray[4] = req.body.submittedProbability4}
    else {guessArray[4] = 0} 

    console.log(`guessarray: ${guessArray}`)

    const newGuess = {
        title: req.body.title,
        submittedBy: req.user.id,
        user: req.user.id,
        submittedProbability: guessArray,
        details: req.body.details,
    };

    //error handling
    let errors = [];
    if(req.body.submittedProbability<0 || req.body.submittedProbability>100) {
        errors.push("Please enter a value between 0 and 100");
    }
    if(errors.length>0) {
        req.flash('error_msg', `Error: ${errors}`);
        res.redirect('/forecasts')
    }

    //if no errors, save to forecastTopic document
    forecastTopic.findOne({title:req.body.title})
        .then((forecastTopic) => {
            forecastTopic.submits.unshift(newGuess);
            forecastTopic.save()
                req.flash('success_msg', `Your guess for "${forecastTopic.title}" was updated`);
                res.redirect('/forecasts')
            });            
});

//submit status 
router.put('/submitResult/:id', ensureAuthenticated, (req, res) => {
    forecastTopic
        .findOne({
        _id: req.params.id
        })
        .then(topic => {
            var status = req.body.status;
            topic.status = status;
            topic.save();

            filters.openOrClosed(topic, status)
                .then((topic)=>{
                    var status = req.body.status;
                    status = String(status);
                    if(status != "Unresolved and open" && status != "Unresolved and closed"){
                        //status prolly redundant but will leave it for now
                        filters.setResult(req.params.id, status)
                            .then((topic)=>{
                                filters.calculateBriers(topic)
                                    .then((topic)=> {
                                        req.flash('success_msg', `The status for "${req.body.title}" was submitted`);
                                        res.redirect('/forecasts');
                                    })
                                    .catch((err)=>{
                                        console.log(err);
                                        res.redirect('/forecasts');
                                    })
                            })
                    } else {
                        req.flash('success_msg', `The status for "${req.body.title}" was submitted`);
                        res.redirect('/forecasts');
                    }
                })
                //tää catch menee tulosten alle. fixaa ylös päin
                .catch((err) => {
                console.log("open or closed failas");
                res.redirect('/forecasts')
                });
                
        })
});

// Add Comment
router.post('/comment/:id', (req, res) => {
    forecastTopic.findOne({
      _id: req.params.id
    })
    .then(forecastTopic => {

      const newComment = {
        commentBody: req.body.commentBody,
        commentUser: req.user.id
      }
  
      // Add to comments array
      forecastTopic.comments.unshift(newComment);
  
      forecastTopic.save()
        .then(forecastTopic => {
          res.redirect(`/forecasts/show/${forecastTopic.id}`);
        });
    });
  });
  
  //delete topic
  router.get('/edit/delete/:id', (req, res) => {
      forecastTopic.remove({_id: req.params.id})
        .then(() => {
            req.flash('success_msg', 'Topic deleted');
            res.redirect('/forecasts');            
        });
});

  //delete forecastTopic alternate that was in users-route
  router.delete('/:id', (req, res) => {
    forecastTopic.remove({_id: req.params.id})
        .then(() => {
            req.flash('success_msg', 'Topic removed');
            res.redirect('/forecasts');            
        });
});

//scoreboard to be added
router.get('/scoreboard', (req, res)=>{
    res.render('scoreBoard');
});
