var mongoose = require("mongoose");
var express = require('express');
const path = require('path');
var exphbs  = require('express-handlebars');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const passport = require('passport');

const app = express();

// load models
require('./models/forecastTopic');
const forecastTopic = mongoose.model('forecastTopics');
require('./models/submittedForecast');
const submittedForecast = mongoose.model('submittedForecasts');
require('./models/user');
const User = mongoose.model('users');

//load routes
const forecasts = require('./routes/forecasts');
const users = require('./routes/users')

//passport config
require('./config/passport')(passport);

//DB config
const db = require('./config/database');

// handlebars middleware
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// body parser middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

//set public folder to be express static folder
app.use(express.static(path.join(__dirname, 'public')));

// method override middleware
app.use(methodOverride('_method'))

// Map global promise - get rid of warning
mongoose.Promise = global.Promise;

// connect to mongoose
mongoose.connect(db.mongoURI)
.then(() => console.log('mongodb connected'))
.catch((err)=> console.log("kaapukissa"));

// express-session middleware
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
}))

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());


app.use(flash());

//global variables
app.use(function(req, res, next){
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});

//routes

app.get('/', (req, res) => {
    submittedForecast.find()
    .then(submittedForecasts => {
    res.render('home', {
    submittedForecasts:submittedForecasts}
    )});
});

app.get('/about', (req, res) => {
    res.render('about');
});

//use routes
app.use('/forecasts', forecasts)
app.use('/users', users)

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});




