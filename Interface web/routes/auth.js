const { User } = require("../node_scripts/database/models");
const convertMatricule = require('./../node_scripts/convertMatricule')
/* GET auth callback. */
const router = require('express-promise-router')();

router.get("/login",function(req,res){
    //On est pas supposé se connecter si on l'est déjà
    if(!req.session.userId) res.render("auth/login")
    else res.redirect('/')
})

router.get('/signin',
  async function (req, res) {
    const urlParameters = {
      scopes: process.env.OAUTH_SCOPES.split(','),
      redirectUri: process.env.OAUTH_REDIRECT_URI
    };

    try {
      const authUrl = await req.app.locals
        .msalClient.getAuthCodeUrl(urlParameters);
      res.redirect(authUrl);
    }

    catch (error) {
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

      // Get the matricule and the role 
      var checkUser = await User.findOne({where:{email:response.account.username}})
      if (checkUser === null){
        var role;
        
        var matricule = convertMatricule.emailToMatricule(response.account.username)
        let re = /^\d/
        
        if (re.test(matricule)) role = 0
        else role = 1
        
        var user = await User.create({
          "fullName":response.account.name, 
          "email":response.account.username, 
          "matricule":matricule, 
          "role":role, 
          "authorizations":3
        })

        req.session["userObject"] = user
      }
      else{
        if(checkUser.fullName == 'Unknow-Name'){
          checkUser.fullName = response.account.name
          await checkUser.save()
        }
        req.session["userObject"] = checkUser
      }

    } catch(error) {
      console.log(error)
      req.flash('error_msg', {
        message: 'Error completing authentication HERE',
        debug: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });
    }
    
    //REDIRECTION
    if(req.session["requestedURL"]) res.redirect(req.session["requestedURL"])
    else res.redirect('/');
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