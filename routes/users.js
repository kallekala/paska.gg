const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const {ensureAuthenticated, ensureGuest} = require('../helpers/auth');


module.exports = router;

// load models
require('../models/forecastTopic');
const forecastTopic = mongoose.model('forecastTopics');
require('../models/user');
const User = mongoose.model('users');
require('../models/organization');
const organization = mongoose.model('organizations');


// // user login route
// router.get('/login', (req, res)=> {
//     res.render("users/login")
// });

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
    
//show user
router.get('/show/:id', (req, res) => {
    User.findOne({
      _id: req.body.id
    })
    //jatka tästä
//     .populate('memberOrganizations')
    .then(user => {
//         var omat = [];
//         for (i = 0; i<forecastTopic.submits.length; i++) { 
//             if(forecastTopic.submits[i].user._id==req.user.id) {
//                 omat.push(forecastTopic.submits[i]);

//             }
//         }
//         forecastTopic.submits = omat;

        res.render('users/show', {
            user:user,
        });
    })
});




// add user to organization 
router.put('/modify', ensureAuthenticated, (req, res) => {
    let errors = [];
    console.log(req.body)
    if(!req.body.selectedUser){
        errors.push("Select User")
    }
    if(!req.body.selectedOrganization){
        errors.push(" Select Organization")
    }
    if(errors.length>0){
        req.flash('error_msg', `${errors}`)
        res.redirect('../admin');
    } else {
    User
        .findOne({
        _id: req.body.selectedUser
        })
        .then(user => {
            console.log(user.memberOrganizations[0])
            let errors = [];
                for (i = 0; i < user.memberOrganizations.length; i++)
                if(user.memberOrganizations[i]==req.body.selectedOrganization){
                    errors.push(` User Already in Organization`)
                }
                if(errors.length>0){
                    req.flash('error_msg', `${errors}`)
                    res.redirect('../admin');
                }            
                 else {
                    user.memberOrganizations.push(req.body.selectedOrganization)
                    user.save();
                    req.flash('success_msg', `User Added to Organization`)
                    res.redirect('../admin');
                }   
        });
    };
    });