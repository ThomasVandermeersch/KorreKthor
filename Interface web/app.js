const express = require("express")
const path = require("path")
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('express-flash');
const msal = require('@azure/msal-node');
const https = require('https');
const fs = require("fs");
require('dotenv').config();
const env = process.env.NODE_ENV || 'development';
const config = require('./node_scripts/database/config/config')[env]
const access = require('./node_scripts/hasAccess')

var credentials = {
  key: fs.readFileSync("certificates/fluke_ecam.key"),
  cert: fs.readFileSync("certificates/fluke_ecam.cer")
}

// var credentials = {
//   key: fs.readFileSync("certificates/key.pem"),
//   cert: fs.readFileSync("certificates/cert.pem")
// }

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
          //console.log(message); //Message des requêtes de l'API Graph et MSal
        },
        piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Verbose,
      }
    }
  };
  
app = express()

// Create msal application object
app.locals.msalClient = new msal.ConfidentialClientApplication(msalConfig);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  unset: 'destroy',
  cookie: {
    expires: 1000 * 60 * 45 //La sesssion expire après 45 minutes d'inactivité
  }
}));

app.use(flash());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static('public')); //Load files from 'public' -> (CSS, image, JS...)
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req,res,next){
  res.locals.session = req.session;
  next();
});

// Import routes
const createRouter = require("./routes/create");
const indexRouter = require("./routes/index")
const authRouter = require("./routes/auth")
const uploadRouter = require("./routes/upload")
const adminRouter = require("./routes/admin")
const seeRouter = require("./routes/see")
const correctionRouter = require("./routes/correction")

app.use('/create', createRouter);
app.use('',indexRouter)
app.use('/auth',authRouter)
app.use('/upload', uploadRouter)
app.use('/admin',adminRouter)
app.use('/see',seeRouter)
app.use('/correction',correctionRouter)

//Si aucune route n'est trouvée
app.get("*", access.hasAccess, function (req, res) {
  res.status("404")
  res.render("index/error");   
});


// Application https port 9898
const httpsServer = https.createServer(credentials, app)

httpsServer.listen(9898)
//app.listen(8282)

console.log("-------------------------------------")
console.log("| RUNNING KorrKthor on: " + env + " |")
console.log("-------------------------------------")
console.log(" [Listening] https://" + process.env.ENDPOINT + "/")
console.log(" [PostgrSQL]    " + config.host + ":" + config.port +"/")
console.log(" [Python]     http://" + process.env.PYTHON_SERVER_HOST + ":" + process.env.PYTHON_SERVER_PORT + "/" )
console.log("-------------------------------------")
