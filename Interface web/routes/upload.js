const router = require('express-promise-router')();
const request = require('request');
const fs = require("fs");
const correction = require("../node_scripts/correction")
const { User, Exam, Copy } = require("../node_scripts/database/models");

var multer  = require('multer'); // Specific import for files 
var storage = multer.diskStorage(
    {
        destination: 'uploads/',
        filename: function(req, file, cb){
            cb(null, file.originalname)
        }
    }
)
var upload = multer({ storage: storage})

router.post("/scans", upload.single("file"), async (req, res) => {
	const formData = {
		my_field: "file",
		my_file: fs.createReadStream(`uploads/${req.file.originalname}`),
	}

	request.post({url:'http://localhost:8080/run', formData:formData}, function (err, httpResponse, body) {
        if (err){
            res.status("500")
            res.send({"error":"something went wrong with the correction server.", "errorCode":1000})
        }
        else{
            correction.correctAll(body)
            res.send({"message":"done"})

            // var exam;
            // console.log(body)
            // JSON.parse(body).foreach(async (copy) => {
            //     if (copy.error === "None"){
            //         if (exam == undefined){
            //             exam = await Exam.findOne({where:{id:copy.qrcode.lessonId}})
            //         }

            //         // resp = JSON.parse(exam.corrections[copy.version])
            //         resp = [[true, false, false], [true, false, false], [true, false, false], [true, false, false], [true, false, true]]
            //         //result = correction.correctionNormal(copy.answers, resp, 1, 0, 0)
                    
            //         if (points != null){
            //             user = await User.findOne({where:{matricule:copy.qrcode.matricule}})
            //             await Copy.create({"userId": user.id,"examId":exam.id, "version":copy.qrcode.version, "result": result, "file":`uploads/${req.file.originalname}`})
            //         }
            //     }
            // })
        }
	})
})


module.exports = router;