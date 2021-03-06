const express = require("express")
const path = require("path")
const bodyParser = require('body-parser');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const msal = require('@azure/msal-node');

require('dotenv').config();


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


const acces = require('./node_scripts/hasAcces')

//Si aucune route n'est trouvée
app.get("*", acces.hasAcces, function (req, res) {
  res.render("error");   
});

// Application port 8000
app.listen(8000)