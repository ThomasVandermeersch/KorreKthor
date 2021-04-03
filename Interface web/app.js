const express = require("express")
const path = require("path")
const bodyParser = require('body-parser');
// const createError = require('http-errors');
// const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const msal = require('@azure/msal-node');
const https = require('https');
const fs = require("fs");
// const acces = require('./node_scripts/hasAcces')
// const Sequelize = require('sequelize');
// const { User, Exam, Copy } = require("./node_scripts/database/models");

require('dotenv').config();
const email = require('./node_scripts/sendEmail')

var credentials = {
  key: fs.readFileSync("certificates/key.pem"),
  cert: fs.readFileSync("certificates/cert.pem")
}

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
    unset: 'destroy',
    cookie: {
      expires: 1000 * 60 * 45 //La sesssion expire après 45 minutes d'inactivité
    }
  }));

  app.use(flash());

// Initializing the app
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static('public')); //Load files from 'public' -> (CSS, image, JS...)
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req,res,next){
  res.locals.session = req.session;
  next();
});

// Import routes
var createRouter = require("./routes/create");
var indexRouter = require("./routes/index")
var authRouter = require("./routes/auth")
var uploadRouter = require("./routes/upload")
var adminRouter = require("./routes/admin")
var seeRouter = require("./routes/see")
var correctionRouter = require("./routes/correction")

app.use('/create', createRouter);
app.use('',indexRouter)
app.use('/auth',authRouter)
app.use('/upload', uploadRouter)
app.use('/admin',adminRouter)
app.use('/see',seeRouter)
app.use('/correction',correctionRouter)



//Si aucune route n'est trouvée
app.get("*", function (req, res) {
  res.status("404")
  res.render("index/error");   
});

// Application http port 9898
// app.listen(9898)

// Application https port 9898
var httpsServer = https.createServer(credentials, app)
httpsServer.listen(9898)
console.log("Listening on : https://localhost:9898/")
console.log("PostgrSQL host : " + process.env.POSTGRES_HOST )

// (async function () {
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
// })()

//const test = require('./test')