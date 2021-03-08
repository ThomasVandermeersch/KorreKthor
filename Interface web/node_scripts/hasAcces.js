const { nextTick } = require("async")
const user = require("./database/models/user")

function hasAcces(req,res,next){
    console.log(req.originalUrl)
    if(!req.session.userObject){
        return res.redirect("/auth/login")
    }

    var user = req.session.userObject
    console.log(user)
    if (req.originalUrl.includes("/create") && user.role == 1){
        return next()
    }
    else{
        // return next()

        return res.redirect("/fjne")
    }

}

exports.hasAcces = hasAcces
