
//This function recieves user matricule and returns a Promise containing his full Name

require('isomorphic-fetch');
var graph = require('@microsoft/microsoft-graph-client');
const converter = require('./convertMatricule')

function getName(email,msalClient,userId){
    return new Promise(async(resolve,reject)=>{
        
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
    // Look up the user's account in the cache
    try {
      const accounts = await msalClient
        .getTokenCache()
        .getAllAccounts();
  
      const userAccount = accounts.find(a => a.homeAccountId === userId);
  
      // Get the token silently
      const response = await msalClient.acquireTokenSilent({
        scopes: process.env.OAUTH_SCOPES.split(','),
        redirectUri: process.env.OAUTH_REDIRECT_URI,
        account: userAccount
      });
  
      return response.accessToken;
    } catch (err) {
      console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
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
