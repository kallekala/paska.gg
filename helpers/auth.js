// module.exports = {
//     ensureAuthenticated: function(req, res, next){
//         //isAuthenticated on suoraan passportista
//         if(req.isAuthenticated()){
//             return next();
//         }
//         req.flash('error_msg', 'Not Authorized');
//         res.redirect('/users/login/');
//     }
// }

module.exports = {
    ensureAuthenticated: function(req, res, next){
      if(req.isAuthenticated()){
        return next();
      }
      req.flash('error_msg', 'Not Authorized'); 
      res.redirect('/');
    },
    ensureGuest: function(req, res, next){
      if(req.isAuthenticated()){
        res.redirect('/dashboard');
      } else {
        return next();
      }
    }
  }