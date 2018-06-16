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

//active topics page
router.get('/', ensureAuthenticated, (req, res) => {
    console.log("mennään")
    filters.filterTopicsByUserSubmits(req.user._id, res)
        .then((userTopics) => {filters.getOrgs(req.user._id, userTopics)
            .then((userTopics)=> {
                console.log("tässä ritari ässä")
                console.log(userTopics)
                filters.shortenGuessArrays(userTopics)
                    .then((okTopics)=>{
                        console.log("okka")
                        res.render('forecasts/forecastsIndex',{
                            forecastTopics:okTopics
                        })
                    })
            })
            .catch((errormsg) => {
                console.log(`errori: ${errormsg}`)
                res.render('forecasts/forecastsIndex')
            });
        })
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
            forecastTopic[0].options.push(`${req.body.options0}`)
            }
            if(req.body.options1){
            forecastTopic[0].options.push(` ${req.body.options1}`)
            }
            if(req.body.options2){
            forecastTopic[0].options.push(` ${req.body.options2}`)
            }
            if(req.body.options3){
            forecastTopic[0].options.push(` ${req.body.options3}`)
            }
            if(req.body.options4){
            forecastTopic[0].options.push(` ${req.body.options4}`)
            }
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
    .populate('organizations')
    .then((forecastTopic) => {
            filters.shortenGuessArrays(forecastTopic)
                .then((forecastTopic)=> {
                    res.render('forecasts/show', {
                        forecastTopic:forecastTopic,
                    });
                })
            .catch((err)=>{
                console.log(err)
                res.redirect('/');
            })
    })   
});

//submit guess
router.put('/submitGuess/:id', ensureAuthenticated, (req, res) => {

    //lets try to make array of the guesses that we can then feed somewhere
    var guessArray = [];

    //converting undefineds to zero
    let a = req.body.submittedProbability0 || 0
    let b = req.body.submittedProbability1 || 0
    let c = req.body.submittedProbability2 || 0
    let d = req.body.submittedProbability3 || 0
    let e = req.body.submittedProbability4 || 0
    
    guessArray[0] = Number(a);
    guessArray[1] = Number(b);
    guessArray[2] = Number(c);
    guessArray[3] = Number(d);
    guessArray[4] = Number(e);

    const newGuess = {
        title: req.body.title,
        submittedBy: req.user.id,
        user: req.user.id,
        submittedProbability: guessArray,
        details: req.body.details,
    };

    //error handling
    let errors = [];

    //number out of 0-100
    if(a<0 || a>100) {
        errors.push("Please enter values between 0 and 100");}
    if(b<0 || b>100) {
        errors.push("Please enter values between 0 and 100");}
    if(c<0 || c>100) {
        errors.push("Please enter values between 0 and 100");}
    if(d<0 || d>100) {
        errors.push("Please enter values between 0 and 100");}
    if(e<0 || e>100) {
        errors.push("Please enter values between 0 and 100");}

//probabilities must sum to 100
    var sum = 0;
    for(i = 0; i<guessArray.length; i++){
       sum += guessArray[i]}

    if(sum != 100){
        errors.push(`The guesses must add to 100. Yours added to ${sum}`);}

    if(errors.length>0) {
        req.flash('error_msg', `Error: ${errors}`);
        res.redirect('/forecasts')
    } else {
        //if no errors, save the guesses to database
        forecastTopic.findOne({title:req.body.title})
            .then((forecastTopic) => {
                forecastTopic.submits.unshift(newGuess);
                forecastTopic.save()
                    req.flash('success_msg', `Your guess for "${forecastTopic.title}" was updated`);
                    res.redirect('/forecasts')
                });
    }
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

//scoreboard to be added
router.get('/scoreboard', (req, res)=>{
    res.render('scoreBoard');
});
