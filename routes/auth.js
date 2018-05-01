const express = require('express');
const router = express.Router();
const passport = require('passport');

router.get('/google', passport.authenticate('google', {scope:['profile', 'email']}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
(req, res) =>  {
    // Successful authentication, redirect home.
    res.redirect('/forecasts');
  });


router.get('/verify', (req, res) => {
    if(req.user){
    } else {
    }
})

//logout user d
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/');
  });


module.exports =router;