
const graph = require('./graph')
const matriculeConverter = require('./convertMatricule')
const { User } = require("../node_scripts/database/models");
const { GraphError } = require('@microsoft/microsoft-graph-client');

function getUser(email, req, createIfNotExist=true){
    // STEP 1 : Search User in the database
    return new Promise((resolve,reject)=>{
        User.findOne({where:{email:email}})
        .then(user=>{
            if(user) resolve(user)
            
            else if(createIfNotExist){
                //Call Graph API to find users displayName
                graph.getName(email, req.app.locals.msalClient, req.session.userId)
                    .then(graphUser=>{
                        const matricule = matriculeConverter.emailToMatricule(email)
                        // Determine user role
                        const re = /^\d/
                        if (re.test(matricule)) role = 0
                        else role = 1
                        
                        // Add graphUser to the databse
                        User.create({
                            "fullName": graphUser, 
                            "matricule": matricule, 
                            "email": email, 
                            "authorizations":3, 
                            "role":role
                        })
                            .then(user=>{
                                resolve(user)
                            })
                            .catch(err=> reject(err))
                    }).catch(err=>{
                        if (err instanceof GraphError){
                            User.create({fullName:"", matricule:matriculeConverter.emailToMatricule(email), authorizations:3, role:0, email:email}).then(user=>{
                                resolve(user)
                            })
                        }
                        else{
                            console.log('User does not exist in Graph API')
                            reject(err)
                        }
                    })
            }
            else{
                resolve('No user found')
            }
        })
        .catch(err=>{
            reject(err)
        })
    })    
}

exports.getUser = getUser