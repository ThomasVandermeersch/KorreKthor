const express = require("express")
const path = require("path")
const bodyParser = require('body-parser');


app = express()
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static('public')); //Load files from 'public' -> (CSS, image, JS...)
app.use(bodyParser.urlencoded({ extended: true }));


app.get("/",function(req,res){
    res.render('creation',{title:"QCM CREATOR"})
})


app.post("/quest",(req,res)=>{
    console.log(JSON.parse(req.body.liste))
    res.end("<h1> Hello World </h1>")
})
app.listen(8000)