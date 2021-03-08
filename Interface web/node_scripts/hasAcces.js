const { nextTick } = require("async")
const user = require("./database/models/user")

function hasAcces(req,res,next){
    if(!req.session.userObject){
        return res.redirect("/auth/login")
    }

    var user = req.session.userObject
    if (req.originalUrl.includes("/create") && user.role == 1){
        return next()
    }
    else{
        return res.redirect("/fjne")
    }
}

exports.hasAcces = hasAcces
