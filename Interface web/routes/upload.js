const router = require('express-promise-router')();
const request = require('request');
const fs = require("fs");
const correction = require("../node_scripts/correction")

var multer  = require('multer') // Specific import for files 
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
            res.send({"error":"something went wrong", "errorCode":1000})
        }
        else{
            JSON.parse(body).forEach(copy => {
                if (copy.error === "None"){
                    console.log(copy.student)
                    resp = [[true, false, false], [true, false, false], [true, false, false], [true, false, false], [true, false, true]]
                    console.log(correction.correctionNormal(copy.answers, resp, 1, 0, 0))
                }
            })

            res.send({"message":"done"})
        }
	})
})


module.exports = router;