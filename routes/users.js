const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

module.exports = router;

// load models
require('../models/forecastTopic');
const forecastTopic = mongoose.model('forecastTopics');
require('../models/submittedForecast');
const submittedForecast = mongoose.model('submittedForecasts');
require('../models/user');
const User = mongoose.model('users');

// user login route
router.get('/login', (req, res)=> {
    res.render("users/login")
});

// user register route
router.get('/register', (req, res)=> {
    res.render("./users/register")
});

// Login Form POST
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
      successRedirect:'/forecasts',
      failureRedirect: '/users/login',
      failureFlash: true
    })(req, res, next);
  });
    

// register form post
router.post('/register', (req, res)=>{
    let errors = [];

    if(req.body.password != req.body.password){
        errors.push({text: 'passwords dont match'})
    }
    if(errors.length > 0){
        console.log(errors)
        res.render('users/register', {
            errors: errors,
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            password2: req.body.password2
        });
    }
       else{
        User.findOne({email: req.body.email})
            .then(user => {
                if(user){
                    req.flash('error_msg', 'Email already registered');
                    res.redirect('/users/register');
                }
                else {
                    const newUser = new User({
                        name: req.body.name,
                        email: req.body.email,
                        password: req.body.password,
                    });
                    bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if(err) throw err;
                            newUser.password = hash;
                            newUser.save()

                                .then(user => {
                                    req.flash('success_msg', 'You are now registered and can login')
                                    res.redirect('/users/login')
                                })

                                .catch(err => {
                                    console.log(err);
                                    return;
                                });
                            });
                          });
                }
            });
    }
});

  //delete forecastTopic
router.delete('/:id', (req, res) => {
    forecastTopic.remove({_id: req.params.id})
        .then(() => {
            req.flash('success_msg', 'Topic removed');
            res.redirect('/forecasts');            
        });
});
