require('isomorphic-fetch');
var graph = require('@microsoft/microsoft-graph-client');
const converter = require('./convertMatricule')

//This function recieves user email and returns a Promise containing his full Name
function getName(email, msalClient, userId){
    return new Promise(async(resolve, reject)=>{
        getAccessToken(userId, msalClient)
            .then(accessToken=>{
                const client = getAuthenticatedClient(accessToken);
                client
                .api('/users/'+ email)
                .select('displayName,userPrincipalName')
                .get()
                .then(user=>{
                    resolve(user.displayName)
      
                }).catch(err=>{
                    console.log('Could not find client')
                    reject(err)
                })
            })
            .catch(err=>{
                console.log('Could not get accesToken')
                reject(err)
            })
    })
}

async function getAccessToken(userId, msalClient) {
  return new Promise(async(resolve, reject) =>{
    try {
      const accounts = await msalClient
        .getTokenCache()
        .getAllAccounts();

      if (!accounts) return reject("Account not found, error 665")
  
      const userAccount = accounts.find(a => a.homeAccountId === userId);
  
      // Get the token silently
      const response = await msalClient.acquireTokenSilent({
        scopes: process.env.OAUTH_SCOPES.split(','),
        redirectUri: process.env.OAUTH_REDIRECT_URI,
        account: userAccount
      });
  
      if (response) return resolve(response.accessToken);
      else return reject("Response empty, error 666")

    } catch (err) {
      console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      reject(err)
    }    
  })
}

function getAuthenticatedClient(accessToken) {
    // Initialize Graph client
    const client = graph.Client.init({
      // Use the provided access token to authenticate
      // requests
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
  
    return client;
}

exports.getName = getName
