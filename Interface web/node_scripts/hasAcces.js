const { nextTick } = require("async")
const user = require("./database/models/user")

function hasAcces(req,res,next){
    //Si l'utilisateur n'est pas connecté
    if(!req.session.userObject){
        return res.redirect("/auth/login")
    }

    //Recherche des données complètes sur l'utilisateur
    var user = req.session.userObject
    console.log(user)
    
    //SI l'utilisateur a accès à une route create
    if (req.originalUrl.includes("/create")){
        if(user.role == 1 || user.authorizations == 0){
            return next()
        }  
        else{
            return res.redirect("/noAcces")
        }
    }

    //Sinon, il peut continuer
    next();
}

exports.hasAcces = hasAcces
