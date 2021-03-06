const express = require("express")
const path = require("path")
const bodyParser = require('body-parser');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const msal = require('@azure/msal-node');
require('dotenv').config();
const Sequelize = require('sequelize');


app = express()
app.locals.users = {};   //base de données NULLE A CHIER des users

//Configuration de msal

const msalConfig = {
    auth: {
      clientId: process.env.OAUTH_APP_ID,
      authority: process.env.OAUTH_AUTHORITY,
      clientSecret: process.env.OAUTH_APP_SECRET
    },
    system: {
      loggerOptions: {
        loggerCallback(loglevel, message, containsPii) {
          console.log(message);
        },
        piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Verbose,
      }
    }
  };
  
  //console.log(msalConfig)
  // Create msal application object
  app.locals.msalClient = new msal.ConfidentialClientApplication(msalConfig);
  // </MsalInitSnippet>
  
  // <SessionSnippet>
  // Session middleware
  // NOTE: Uses default in-memory session store, which is not
  // suitable for production
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    unset: 'destroy'
  }));

  app.use(flash());

// Set up local vars for template layout
app.use(function(req, res, next) {
  // Read any flashed errors and save
  // in the response locals
  res.locals.error = req.flash('error_msg');

  // Check for simple error string and
  // convert to layout's expected format
  var errs = req.flash('error');
  for (var i in errs){
    res.locals.error.push({message: 'An error occurred', debug: errs[i]});
  }

  // Check for an authenticated user and load
  // into response locals
  if (req.session.userId) {
    res.locals.user = app.locals.users[req.session.userId];
  }

  next();
});


// Initializing the app
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static('public')); //Load files from 'public' -> (CSS, image, JS...)
app.use(bodyParser.urlencoded({ extended: true }));


var createRouter = require('./routes/create');
var indexRouter = require("./routes/index")
var authRouter = require("./routes/auth")
app.use('/create', createRouter);
app.use('',indexRouter)
app.use('/auth',authRouter)

// Application port 8000
app.listen(8000)

const { User, Exam, Copy } = require("./node_scripts/database/models");

(async function () {
  // var user = await User.create({"fullName":"Tom"})
  // var exam = await Exam.create({"name":"Exam 1", "numberOfVersion":4, "userId":user.id})
  // var copyA = await Copy.create({"version":"A", "userId":user.id, "examId":exam.id})
  // var copyB = await Copy.create({"version":"B", "userId":user.id, "examId":exam.id})
  
  // var examS = (await Exam.findAll())[0]
  // console.log(await examS.getUser())
  // console.log(await examS.getCopies())

  // var userS = (await User.findAll())[0]
  // console.log(await userS.getExams())
  // console.log(await userS.getCopies())

  // var copyS = (await Copy.findAll())[0]
  // console.log(await copyS.getUser())
  // console.log(await copyS.getExam())
})()