const router = require('express-promise-router')();
const { User } = require("../node_scripts/database/models");
const acces = require('../node_scripts/hasAcces')


router.get('/', acces.hasAcces, async (req,res)=>{
    var users = await User.findAll({order:[['matricule', 'ASC']]})
    var mapping = users.map(user=>(user.dataValues))
    
    res.render('admin/adminUsers',{users:mapping})
})

router.get('/:matricule', acces.hasAcces, async (req,res)=>{
    var user = await User.findOne({where:{matricule:req.params.matricule}})
    res.render('admin/adminModifyUser', {user:user})
})

router.post('/modifyUser', acces.hasAcces, async(req,res)=>{
    var auth;

    if(req.body.createQCM && req.body.makeAdmin) auth=0
    else if(req.body.createQCM) auth=1
    else if (req.body.makeAdmin) auth=2
    else auth= 3

    //Vérifier qu'on ne modifie pas un admin
    var user = await User.findOne({where:{matricule:req.body.matricule}})
    if ((user.authorizations != 0 && user.authorizations != 2) || user.email == req.session.userObject.email) {
        user.authorizations = auth
        await user.save()
    }
    res.redirect("/admin")
})

module.exports = router;
