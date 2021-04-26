function hasAccess(req,res,next){
    // Si l'utilisateur n'est pas connecté
    if(!req.session.userObject){
        req.session["requestedURL"] = req.originalUrl //stocker en session l'URL voulu pour rediriger après authentification.
        return res.redirect("/auth/login")
    }

    const user = req.session.userObject
    
    // L'utilisateur fait une requête vers 'Create'
    if (req.originalUrl.includes("/create")){
        if(user.role == 1 || user.authorizations == 0 || user.authorizations == 1) return next()
        else return res.redirect("/noAcces")
    }

    // L'utilisateur fait une requête vers 'Admin'
    if (req.originalUrl.includes("/admin")){
            if( user.authorizations == 0) return next()
            else return res.redirect("/noAccess")
        }

    next();
}

exports.hasAccess = hasAccess
