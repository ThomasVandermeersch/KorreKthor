
const router = require('express-promise-router')();

app.get("/",function(req,res){
    if (hasAcces(req.session.userId,res)) {
        res.render('index',{name:app.locals.users[req.session.userId].displayName})    }
});

function hasAcces(userID,res){
    if(!userID){
        res.redirect("auth/login")
        return false
    }
    return true
}

module.exports = router