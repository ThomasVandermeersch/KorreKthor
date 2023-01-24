const { Copy, Exam } = require("./database/models");
const { v4: uuidv4 } = require('uuid');
const correction = require('./correction_new')
const copyLayout = require('../node_scripts/copyLayout')
const fs = require("fs");
const request = require('request');
const http = require('http');
const unzipper = require("unzipper")

function callCorrectionAPI(APIendpoint, exam, filename){
    return new Promise((resolve,reject)=>{
        
        const formData = {
            exam_id: exam.id,
            gridLayouts : copyLayout.getCopyLayout(JSON.parse(exam.corrections)),
            file: fs.createReadStream(`uploads/${filename}`),
        }
    
        request.post({url:`${APIendpoint}/run`, formData:formData}, (err, httpResponse, body)=> {
            
            if (err || !body ||JSON.parse(body).error){
                exam.status = 3 // 3 = correction error
                exam.save().catch(err=>console.log(err))
            }
            else resolve(JSON.parse(body))
        })
    })
}

function loadCopiesImages(APIendpoint,zipFile,imageLocation ){
    // Create a folder for the copies images
    if (!fs.existsSync('copies')) {
        fs.mkdirSync('copies')
    }
    fs.mkdirSync('copies/' + imageLocation)


    // Get the zipfile from the correction API
    const file = fs.createWriteStream(`zips/${zipFile}`);
    http.get(`${APIendpoint}/static/${zipFile}`, (response) => {
        response.pipe(file);
    });
    
    // Unzip the zipfile
    file.on("finish", ()=>{
        fs.createReadStream(`zips/${zipFile}`).pipe(unzipper.Extract({ path: 'copies/' + imageLocation }));
    })
}

function loadScannedCopiesInDB(exam, scanResult, imageLocation){

    scanResult.forEach( (scannedCopy) =>{
        if (scannedCopy.error == "None"){
            query = {where:{userMatricule: scannedCopy.qrcode.matricule, examId:exam.id}, include:[{model:Exam, as:"exam"}]}
            Copy.findOne(query).then( (copy) =>{
                copy.file = imageLocation + '/' + scannedCopy.file
                copy.status = "not_submitted"  // in case the copy is re-uploaded
                copy = correction.correctionCopy( copy, scannedCopy.answers, JSON.parse(copy.exam.corrections),JSON.parse(copy.exam.correctionCriterias))
                copy.save().catch( (err) =>console.log(err))
            }).catch(err=>{
                console.log(scannedCopy)
                console.log(err)
            })
        }
    })
}

function completeExamHistory(exam,scanResult, pdfFile, correctorsName){
    var pagesInErrorNumberList = []

    scanResult.forEach( (scannedCopy) =>{
        if (scannedCopy.error != "None") pagesInErrorNumberList.push((scannedCopy.filename.split(`/`)[1]).split('.')[0])
    })

    historic = JSON.parse(exam.historic)
    newHistory = {
        date : Date(),
        user : correctorsName,
        fileName : pdfFile,
        pagesError : pagesInErrorNumberList
    }
    historic.push(newHistory)
    exam.historic = JSON.stringify(historic)

    exam.save().catch(err=> console.log(err))

}

function loadScannedCopies(pdfFile, exam, correctorsName){
    
    const APIendpoint = `http://${process.env.PYTHON_SERVER_HOST}:${process.env.PYTHON_SERVER_PORT}`

    callCorrectionAPI(APIendpoint, exam, pdfFile).then( response =>{
        if (typeof response.zipFile !== 'undefined'){
            imageLocation = uuidv4()
            loadCopiesImages(APIendpoint, response.zipFile, imageLocation)
            loadScannedCopiesInDB(exam, response.data, imageLocation)
            completeExamHistory(exam, response.data, pdfFile, correctorsName)
        }   
    })
}

exports.loadScannedCopies = loadScannedCopies