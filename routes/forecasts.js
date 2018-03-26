const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {ensureAuthenticated} = require('../helpers/auth');

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
                        res.render('forecasts/forecastsIndex', {
                        forecastTopics:forecastTopics,
                        submittedForecasts:submittedForecasts,
                        resolved:resolved
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
    // lisää console login tilalle kunnon validation for server side
        forecastTopic.findById(req.params.id, (err,doc) => {
            if (err) {
                console.log('kapa')
            } else {
            const newUser = {
                title: req.body.title,
                submittedBy: req.user.id,
                submittedProbability: req.body.submittedProbability,
                details: req.body.details
            };
            //hyödynnä newUser-objektia etsimään mongoosella onko collectionissa samalla titlellä olemassa
            submittedForecast.remove({title:newUser.title})
            .then(()=>{
                new submittedForecast(newUser)
                .save()
                .then(submittedForecast => {
                    req.flash('success_msg', `Your guess for "${submittedForecast.title}" was updated`);
                    res.redirect('/forecasts')
                })
            })
        }
    });    
});


router.get('/scoreboard', (req, res)=>{
    res.render('scoreBoard');
});

//edit forecast topic form process
router.put('/:id', ensureAuthenticated, (req, res) => {
    forecastTopic
        .findOne({
        _id: req.params.id
    })
        .then(forecastTopic => {
            forecastTopic.submittedProbability = req.body.submittedProbability;
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