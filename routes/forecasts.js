const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {ensureAuthenticated, ensureGuest} = require('../helpers/auth');

module.exports = router;

// load models
require('../models/forecastTopic');
const forecastTopic = mongoose.model('forecastTopics');
require('../models/submittedForecast');
const submittedForecast = mongoose.model('submittedForecasts');
require('../models/user');
const User = mongoose.model('users');

// forecast perussivu {user:req.user.id}
router.get('/', ensureAuthenticated, (req, res) => {
    
    forecastTopic.find({result:"Unresolved"})
    .sort({date:'desc'})

        .then(forecastTopics => {
            submittedForecast.find({submittedBy:req.user.id, result:"Unresolved"})
                .then(submittedForecasts => {
                    submittedForecast.find({submittedBy:req.user.id, $or: [{result:"1"},{result:"0"}]})
                    .then(resolved => {
                        console.log(forecastTopics[0].forecasts[0]);
                        res.render('forecasts/forecastsIndex', {
                        forecastTopics:forecastTopics,
                        submittedForecasts:submittedForecasts,
                        resolved:resolved,
                        forecasts:forecastTopics[1].forecasts
                        })
                    });
                })
        })

});


//add new
router.post('/', ensureAuthenticated, (req, res) => {
    // validation for server side
    let errors = [];
    if (!req.body.title) {
        errors.push({text: 'pls'})
    };
    if (!req.body.details) {
        errors.push({text: 'pls'})
    };
    forecastTopic.find({title:req.body.title})
        .then(titleProposal => {
            console.log(titleProposal);
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

    const newGuess = {
        title: req.body.title,
        submittedBy: req.user.id,
        submittedProbability: req.body.submittedProbability,
        details: req.body.details
    };

    //save to forecastTopic document
    forecastTopic.findOne({title:req.body.title})
        .then((forecastTopic) => {
            forecastTopic.forecasts.unshift(newGuess);
            forecastTopic.save()
        });

    submittedForecast.remove({title:newGuess.title})
        .then(()=>{
            new submittedForecast(newGuess)
            .save()
            .then(submittedForecast => {
                req.flash('success_msg', `Your guess for "${submittedForecast.title}" was updated`);
                res.redirect('/forecasts')
            });            
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
    .then(forecastTopic => {
        res.render('forecasts/show', {
            forecastTopic:forecastTopic
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

//submit result 
router.put('/submitResult/:id', ensureAuthenticated, (req, res) => {
    forecastTopic
        .findOne({
        _id: req.params.id
        })
        .then(forecastTopic => {
            forecastTopic.result = req.body.result;
            forecastTopic.save();
        });
       
    submittedForecast.find({title:req.body.title}).then(submittedForecast => {

        for (i = 0; i < submittedForecast.length; i++) { 
        if (req.body.result==="1"){
            submittedForecast[i].result=1;
            submittedForecast[i].brierScore= Math.pow((1-submittedForecast[i].submittedProbability/100), 2)*2;
            submittedForecast[i].save();
        }
        else {
            submittedForecast[i].result=0;
            submittedForecast[i].brierScore=Math.pow((0-submittedForecast[i].submittedProbability/100), 2)*2;
            submittedForecast[i].save();
        }
        };
        req.flash('success_msg', `The outcome for "${req.body.title}" was submitted and the topic was archived`);
        res.redirect('/forecasts');

    });
});

// Add Comment
router.post('/comment/:id', (req, res) => {
    Story.findOne({
      _id: req.params.id
    })
    .then(story => {
      const newComment = {
        commentBody: req.body.commentBody,
        commentUser: req.user.id
      }
  
      // Add to comments array
      story.comments.unshift(newComment);
  
      story.save()
        .then(story => {
          res.redirect(`/stories/show/${story.id}`);
        });
    });
  });
  