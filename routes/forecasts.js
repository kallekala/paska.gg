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

// forecast perussivu {user:req.user.id} 
    //challenge is to filter out submits that are not from user
router.get('/', ensureAuthenticated, (req, res) => {
    forecastTopic.find({result:"Unresolved"})
        .populate('submits.user')
        .sort({date:'desc'})
            .then((forecastTopics) => {
                loggedUser = req.user._id;
                for (i = 0; i<forecastTopics.length; i++) {
                    var loggedUserSubmits = [];
                    var subArray = forecastTopics[i].submits;
                    var tama = forecastTopics[i]
                        if(subArray.length>0){
                            for(i = 0; i<subArray.length; i++){
                                //laitan stringeiksi koska muuten type on jostain syystä objekti jolloin ei toimi ifissä
                                var nokka = String(req.user._id)
                                var pokka = String(subArray[i].user._id) 
                                        if(nokka===pokka) {
                                            loggedUserSubmits.push(subArray[i]);
                                        } 
                            }
                        }
                    tama.submits = loggedUserSubmits
                };
                res.render('forecasts/forecastsIndex', {
                forecastTopics:forecastTopics,
                })
            });
});

//add new
router.post('/', ensureAuthenticated, (req, res) => {
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
                {
                    res.render('./forecasts/addForecast', {
                        errors: errors,
                        title: req.body.title,
                        details: req.body.details,
                    })
                }
                else {
                    const newUser = {
                        title: req.body.title,
                        details: req.body.details,
                        user: req.user.id,
                    }
                    new forecastTopic(newUser)
                    .save()
                    .then(forecastTopic => {
                        req.flash('success_msg', `Forecast topic "${forecastTopic.title}" was added`);
                        res.redirect('/forecasts')
                    });
                };
    });    
});

router.get('/add', ensureAuthenticated, (req, res)=>{
       res.render('./forecasts/addForecast');
});

//submit guess
router.put('/submitGuess/:id', ensureAuthenticated, (req, res) => {

console.log(typeof req.body.submittedProbability);

    const newGuess = {
        title: req.body.title,
        submittedBy: req.user.id,
        user: req.user.id,
        submittedProbability: req.body.submittedProbability,
        details: req.body.details,
    };

    let errors = [];

    if(req.body.submittedProbability<0 || req.body.submittedProbability>100) {
        console.log(typeof req.body.submittedProbability);
        errors.push("Please enter a value between 0 and 100");
    }

    if(errors.length>0) {
        req.flash('error_msg', `Error: ${errors}`);
        res.redirect('/forecasts')
    }

    //save to forecastTopic document
    forecastTopic.findOne({title:req.body.title})
        .then((forecastTopic) => {
            forecastTopic.submits.unshift(newGuess);
            forecastTopic.save()
                req.flash('success_msg', `Your guess for "${forecastTopic.title}" was updated`);
                res.redirect('/forecasts')
            });            
        });


router.get('/scoreboard', (req, res)=>{
    res.render('scoreBoard');
});


// Show Single forecast
router.get('/show/:id', (req, res) => {
    forecastTopic.findOne({
      _id: req.params.id
    })
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
  


//submit result 
router.put('/submitResult/:id', ensureAuthenticated, (req, res) => {
    forecastTopic
        .findOne({
        _id: req.params.id
        })
        .then(forecastTopic => {

            var result = req.body.result;
            forecastTopic.result = result;
            
            for (i = 0; i < forecastTopic.submits.length; i++)
                if(result=="True"){
                    forecastTopic.submits[i].brierScore= Math.pow((1-forecastTopic.submits[i].submittedProbability/100), 2)*2;
                    forecastTopic.save();    
                } else if(result=="False"){
                    forecastTopic.submits[i].brierScore=Math.pow((0-forecastTopic.submits[i].submittedProbability/100), 2)*2;
                    forecastTopic.save();    
                };

            forecastTopic.save();
        });
               req.flash('success_msg', `The outcome for "${req.body.title}" was submitted and the topic was archived`);
        res.redirect('/forecasts');
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