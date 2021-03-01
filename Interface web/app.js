const express = require("express")
const path = require("path")
const bodyParser = require('body-parser');
const url = require('url')

app = express()

/*authentification parameters*/

var createError = require('http-errors');
var cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const msal = require('@azure/msal-node');
require('dotenv').config();

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
    secret: 'fjoirznthoirucnhçep@@@298Y7974869nthoirucnhçep@@@298Y79748693838Y398ronthoirucnhçep@@@298Y797486938intchgorungehg',
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




const functions = require("./node_scripts/functions")
const QCM_automatisation = require("./node_scripts/QCM_automatisation")
var multer  = require('multer') // Specific import for files 
var storage = multer.diskStorage(
    {
        destination: './uploads/',
        filename: function(req, file, cb){
            cb(null, file.originalname)
        }
    }
)
var upload = multer({ storage: storage})


// Initializing the app
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static('public')); //Load files from 'public' -> (CSS, image, JS...)
app.use(bodyParser.urlencoded({ extended: true }));


// Main route

app.get("/",function(req,res){
    
    if (hasAcces(req.session.userId,res)) {
        res.render('index',{name:app.locals.users[req.session.userId].displayName})    }
});


app.get("/login",function(req,res){
    //On est pas supposé se connecter si on l'est déjà
    if(!req.session.userId) res.render("login")
    else res.redirect('/')
})

// Download final pdf route 
app.get("/create/downloadresult", (req, res) => {
    if (hasAcces(req.session.userId,res)){
        res.download(
            path.join('downloads', "ResultatFinal.pdf" ),
            (err) => {
              if (err) res.status(404).send("<h1>File Not found: 404</h1>");
            }
          );
    }

});

app.get("/create/downloadcorrection", (req, res) => {
    if (hasAcces(req.session.userId,res)){
        res.download(
            path.join('downloads', "Correction.pdf" ),
            (err) => {
                if (err) res.status(404).send("<h1>File Not found: 404</h1>");
            }
        );
    }
})

// Route to upload file
app.get("/create/Step1",function(req,res){
    if (hasAcces(req.session.userId,res)){
        res.render('uploadFile', {title:"QCM CREATOR"})
    }
})

// Route to upload questions
app.get("/create/Step2",function(req,res){
    if (hasAcces(req.session.userId,res)){
        var versions = JSON.parse(req.query.versions)
        res.render('loadQuestions', {title:"QCM CREATOR", "uploadedFilename":req.query.filename, "versions":versions})
    }
})

// Route to load the answers
app.get("/create/Step3", function(req, res){
    if (hasAcces(req.session.userId,res)){

        res.render('loadAnswers', {title:"QCM CREATOR", "uploadedFilename": req.query.filename, "versions":JSON.parse(req.query.versions), "files":JSON.parse(req.query.files)})
    }
})


//Route de cotation
app.get("/create/Step4",function(req,res){
    if (hasAcces(req.session.userId,res)){
        res.render('cotation.pug')
    }
})

// Route to the download page
app.get("/create/Step5",function(req,res){
    if (hasAcces(req.session.userId,res)){
        res.render('downloadPDF')
    }
})


// Route to send answers
app.post("/quest", upload.single("studentList"), async (req, res, next)=>{
    const filename = req.body.filename
    const students = await functions.importStudents("./uploads/"+filename)
    const answers = JSON.parse(req.body.liste)
    const files = JSON.parse(req.body.files)

    QCM_automatisation.createInvoice(students, 'Math', answers, files).then(res.redirect("./create/Step4"));
})

// Route to upload the student list file
app.post("/sendList", upload.single("studentList"), async function(req, res, next) {
    var versions = await functions.getVersions("./uploads/"+req.file.originalname)

    res.redirect(url.format({
        pathname:"/create/Step2",
        query: { filename: req.file.originalname, versions:JSON.stringify(versions)}
    }))     
})

// Route to upload the question files
app.post("/sendQuestions", upload.array("question", 4), async (req, res, next)=>{
    var files = {}
    var liste = JSON.parse(req.body.versions)

    var i;
    for (i = 0; i < liste.length; i++) {
        files[liste[i]] = req.files[i].filename
    }

    res.redirect(url.format({
        pathname:"/create/Step3",
        query: { filename: req.body.listeEtu, versions:req.body.versions, files:JSON.stringify(files)}
    }))

})


app.post("/sendNormalCotationCriteria", (req,res)=>{
    console.log(req.body)
    res.redirect('/create/Step5')
})

app.post("/sendAdvancedCotationCriteria",(req,res)=>{
    console.log(req.body)
    res.redirect('/create/Step5')
})







//Login

/* GET auth callback. */
app.get('/signin',
  async function (req, res) {
    console.log("Hello World Helllooooooooooooooooo")
    const urlParameters = {
      scopes: process.env.OAUTH_SCOPES.split(','),
      redirectUri: process.env.OAUTH_REDIRECT_URI
    };
    console.log(urlParameters)

    try {
      console.log("Ici c'est l'erreur .1111s")
      const authUrl = await req.app.locals
        .msalClient.getAuthCodeUrl(urlParameters);
      console.log("ICI c'est lerreur")
      res.redirect(authUrl);
    }

    catch (error) {
      console.log(`Erroooor: ${error}`);
      req.flash('error_msg', {
        message: 'Error getting auth URL  coucou .',
        debug: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });
      res.redirect('/');
    }
  }
);

// <CallbackSnippet>
app.get('/auth/callback',
  async function(req, res) {
    console.log("Je rentre ici")
    console.log(req.query)
    const tokenRequest = {
      code: req.query.code,
      scopes: process.env.OAUTH_SCOPES.split(','),
      redirectUri: process.env.OAUTH_REDIRECT_URI
    };

    console.log(tokenRequest)

    try {
      const response = await req.app.locals
        .msalClient.acquireTokenByCode(tokenRequest);

      // Save the user's homeAccountId in their session
      console.log("On arrive ici 3       ????????????????,")

      req.session.userId = response.account.homeAccountId;
      console.log(req.session.userId)
      console.log(response)
      //console.log(response.accessToken)
      
      
      /*const user = await graph.getUserDetails(response.accessToken);
      console.log(user)
      console.log("On arrive ici 2       ????????????????,")
      // Add the user to user storage
      console.log(req.app.locals.users)*/
      req.app.locals.users[req.session.userId] = {
        displayName: response.account.name,
        email: response.account.username
      };

    } catch(error) {
      console.log("Il y a une erreur ")
      console.log(error)
      req.flash('error_msg', {
        message: 'Error completing authentication  HERE',
        debug: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });
    }

    res.redirect('/');
  }
);
// </CallbackSnippet>
app.get('/logout',
  async function(req, res) {
    // Sign out
    if (req.session.userId) {
      // Look up the user's account in the cache
      const accounts = await req.app.locals.msalClient
        .getTokenCache()
        .getAllAccounts();

      const userAccount = accounts.find(a => a.homeAccountId === req.session.userId);

      // Remove the account
      if (userAccount) {
        req.app.locals.msalClient
          .getTokenCache()
          .removeAccount(userAccount);
      }
    }

    // Destroy the user's session
    req.session.destroy(function (err) {
      res.redirect('/');
    });
  }
);
function hasAcces(userID,res){
    if(!userID){
        res.redirect("/login")
        return false
    }
    return true
}


// Application port 8000
app.listen(8000)