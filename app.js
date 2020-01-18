var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//---------------------------------------------------
const hbs = require('hbs');
const MongoClient = require('mongodb').MongoClient;
const passport = require('passport');
const Strategy = require('passport-local').Strategy;
const authUtils = require('./utils/auth');
const session = require('express-session');
const flash = require('connect-flash');
// --------------------------------------------------

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var comediansRouter = require ('./routes/comedians');

// Add new routes
// --------------------------------------------------
const authRouter = require('./routes/auth');
// --------------------------------------------------

var app = express();

// Connect to db
// --------------------------------------------------
MongoClient.connect('mongodb://DannyMac:password1@ds011830.mlab.com:11830/heroku_pcx2vsx4', {useUnifiedTopology: true}, (err, client) => {
  if (err) {
    throw err;
  }
  const db = client.db('heroku_pcx2vsx4');
  const users = db.collection('bitsgigsdb');
  app.locals.users = users;
});
// const mongoose = require('mongoose');

// mongoose.connect("mongodb://DannyMac:password1@ds011830.mlab.com:11830/heroku_pcx2vsx4", {
//   useNewUrlParser: true,
// });
// --------------------------------------------------


// Configure passport
// --------------------------------------------------
passport.use(new Strategy(
  (username, password, done) => {
    app.locals.users.findOne({ username }, (err, user) => {
      if (err) {
        return done(err);
      }

      if (!user) {
        return done(null, false);
      }

      if (user.password != authUtils.hashPassword(password)) {
        return done(null, false);
      }

      return done(null, user);
    });
  }
));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  done(null, { id });
});
// --------------------------------------------------


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Set partials for handlebars
// --------------------------------------------------
hbs.registerPartials(path.join(__dirname, 'views/partials'));
// --------------------------------------------------

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Configure session, passport, flash
// --------------------------------------------------
app.use(session({
  secret: 'session secret',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
  res.locals.loggedIn = req.isAuthenticated();
  next();
});

app.use((req, res, next) => {
  res.locals.loggedOut = !req.isAuthenticated();
  next();
});

// --------------------------------------------------

// test page
app.get('/test',(req, res)=> {
  res.sendFile(path.join(__dirname, "test.html"))

});

app.use('/', indexRouter);
app.use('/comedians', comediansRouter);
app.use('/users', usersRouter);

// Add new routes
// --------------------------------------------------
app.use('/auth', authRouter);
// --------------------------------------------------



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
