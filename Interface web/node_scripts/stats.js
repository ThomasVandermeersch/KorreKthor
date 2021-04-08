function computeMean(copies){
    sum = 0
    copies.forEach(copy => {
        sum += (copy.result[0]/copy.result[1])*20
    })
    return Math.round((sum/copies.length)*100)/100
}

function computeVariance(copies, mean)
{
    var v = 0;
    for(var i=0;i<copies.length;i++)
    {
        var val = (copies[i].result[0]/copies[i].result[1])*20
        v = v + (val - mean) * (val - mean);
    }
    return Math.round(Math.sqrt(v / copies.length)*100)/100;
}

function computeZero(copies){
    var count = 0
    copies.forEach(copy => {
        console.log(copy.result)
        if (copy.result[0] <= 0){
            count++
        }
    });
    return count
}

function computeParticipants(copies){
    return copies.length
}

function computeBestQuestion(copies){
    return copies.length
}

function computeWorstQuestion(copies){
    return copies.length
}

// Exam.findOne({where:{name:"Stabilité"}, include:[{model:Copy, as:'copies'}]}).then(async(exam) => {
//     console.log(computeVariance(exam.copies, computeMean(exam.copies)))
//     console.log(computeZero(exam.copies))
//     console.log(computeParticipants(exam.copies))
//     console.log(computeBestQuestion(exam.copies))
//     console.log(computeWorstQuestion(exam.copies))
// })

exports.computeMean = computeMean
exports.computeVariance = computeVariance
exports.computeZero = computeZero
exports.computeParticipants = computeParticipants