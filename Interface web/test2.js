require('dotenv').config();

var user = null;

const GraphService = require('graph-service');
const ClientCredentials = require('client-credentials');

const tenant = 'ecam';
const clientId = process.env.OAUTH_APP_ID;
const clientSecret = process.env.OAUTH_APP_SECRET;

const credentials = new ClientCredentials('', clientId, clientSecret);

const service = new GraphService(credentials);

service.all('/users').then(response => {
      console.log(response.data);
    //   response.data.forEach(function(item) {
    //       if (item.userPrincipalName == "lgomez@my-company.com"){
    //         user = item;
    //         break;
    //       }
    //   });
    });