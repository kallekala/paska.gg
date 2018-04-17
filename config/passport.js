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

          const image = profile.photos[0].value.substring(0, profile.photos[0].value.indexOf('?'));

          const newUser = {
            googleID: profile.id,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value,
            image: image
          };

          //check for existing user
          User.findOne({
            googleID: profile.id
          }).then(user => {
            if(user){
              //return user
              done(null, user);
            } else {
              //create user
              new User(newUser)
                .save()
                .then(user => done(null, user))
            }
          })
        })
  );

  
    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });
    
    passport.deserializeUser((id, done) => {
      User.findById(id).then(user=> done(null, user));
      });
  }

