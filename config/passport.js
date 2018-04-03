const LocalStrategy = require('passport-local')
.Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const keys = require('./keys');

//load user model
const User = mongoose.model('users');

//old stuff
module.exports = function(passport){
    passport.use(new LocalStrategy({usernameField: 'email'}, (email, password, done) => {
      // Match user
      User.findOne({
        email:email
      }).then(user => {
        if(!user){
          return done(null, false, {message: 'No User Found'});
        } 
  
        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if(err) throw err;
          if(isMatch){
            return done(null, user);
          } else {
            return done(null, false, {message: 'Password Incorrect'});
          }
        })
      })
    }));

    passport.use(
      new GoogleStrategy({
          clientID: keys.googleClientID,
          clientSecret: keys.googleClientSecret,
          callbackURL:'/auth/google/callback',
          proxy: true
      }, (accessToken, refreshToken, profile, done)=> {
          console.log(accessToken);
          console.log(profile);
      })
  )

  
    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });
    
    passport.deserializeUser(function(id, done) {
      User.findById(id, function(err, user) {
        done(err, user);
      });
    });
  }

  //new stuff
//   module.exports = function(passport){
//     passport.use(
//         new GoogleStrategy({
//             clientID: keys.googleClientID,
//             clientSecret: keys.googleClientSecret,
//             callbackURL:'/auth/google/callback',
//             proxy: true
//         }, (accessToken, refreshToken, profile, done)=> {
//             console.log(accessToken);
//             console.log(profile);
//         })
//     )
// }