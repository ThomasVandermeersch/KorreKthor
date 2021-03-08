const { User, Exam, Copy } = require("../node_scripts/database/models");

/* GET auth callback. */
const router = require('express-promise-router')();

router.get("/login",function(req,res){
    //On est pas supposé se connecter si on l'est déjà
    if(!req.session.userId) res.render("login")
    else res.redirect('/')
})

router.get('/signin',
  async function (req, res) {
    const urlParameters = {
      scopes: process.env.OAUTH_SCOPES.split(','),
      redirectUri: process.env.OAUTH_REDIRECT_URI
    };
    //console.log(urlParameters)

    try {
      const authUrl = await req.app.locals
        .msalClient.getAuthCodeUrl(urlParameters);
      res.redirect(authUrl);
    }

    catch (error) {
      console.log(`Erroooor: ${error}`);
      req.flash('error_msg', {
        message: 'Error getting auth URL ',
        debug: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });
      res.redirect('/');
    }
  }
);

// <CallbackSnippet>
router.get('/callback',
  async function(req, res) {
    //console.log(req.query)
    const tokenRequest = {
      code: req.query.code,
      scopes: process.env.OAUTH_SCOPES.split(','),
      redirectUri: process.env.OAUTH_REDIRECT_URI
    };

    try {
      const response = await req.app.locals
        .msalClient.acquireTokenByCode(tokenRequest);

      // Save the user's homeAccountId in their session

      req.session.userId = response.account.homeAccountId;
      //console.log(req.session.userId)
      //console.log(response)
      //console.log(response.accessToken)
      
      
      /*const user = await graph.getUserDetails(response.accessToken);
      console.log(user)
      console.log("On arrive ici 2       ????????????????,")
      // Add the user to user storage
      console.log(req.app.locals.users)*/

      // Get the matricule and the role 
      var checkUser = await User.findOne({where:{email:response.account.username}})
      if (checkUser === null){
        var matricule;
        var role;
        if(response.account.username.startsWith('19')) { 
          matricule = String(parseInt(response.account.username.split('@')[0], 10) - 176000)
        }
        else{
          matricule = String(response.account.username.split('@')[0])
          let re = /^\d/
          if (re.test(matricule)){
            role = 0
          }
          else{
            role = 1
          }
        }
        
        var user = await User.create({
          "fullName":response.account.name, 
          "email":response.account.username, 
          "matricule":matricule, 
          "role":role, 
          "authorizations":0
        })

        req.session["userObject"] = user
      }
      else{
        req.session["userObject"] = checkUser
      }

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
router.get('/logout',
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

module.exports = router