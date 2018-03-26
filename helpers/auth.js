module.exports = {
    ensureAuthenticated: function(req, res, next){
        //isAuthenticated on suoraan passportista
        if(req.isAuthenticated()){
            return next();
        }
        req.flash('error_msg', 'Not Authorized');
        res.redirect('/users/login/');
    }
}