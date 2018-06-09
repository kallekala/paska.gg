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

//load helpers for database filtering
const filters = require('../helpers/filters.js')


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
      _id: req.params.id
    })
    .populate('memberOrganizations')
    .populate('submits')
    .then(user => {
        filters.filterTopicsByUserSubmits(user._id)
            .then((userTopics)=>{
                res.render('users/show', {
                    user:user,
                    userTopics:userTopics
                });
            })
            .catch((err)=>{console.log("catchiin")
                res.render('/welcome');
            })
    })
});


// add user to organization 
router.put('/modify', ensureAuthenticated, (req, res) => {
    let errors = [];
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

    //show organization
router.get('/show/organizations/:id', (req, res) => {
    organization.findOne({
      _id: req.params.id
    })
        .then((organization)=>{
            filters.fillOrgsMembers(organization)
                .then((organization) => {
                    filters.getTopicsForOrgs(organization)
                        .then((filteredTopics)=>{
                            res.render('users/organization', {
                                organization:organization,
                                topics:filteredTopics
                            });
                        })
                })
        })
});