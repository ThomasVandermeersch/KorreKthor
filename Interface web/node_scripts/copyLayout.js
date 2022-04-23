
function getCopyLayout(corrections) {
    copyLayout = {}
    copyLayout["markers"] = [[530, 10], [530, 765], [10, 765]] //[Bottom-left, Bottom-right, Top-right]  
    copyLayout["circle_size"] = 40

    // Grid Layout

    gridLayouts = {}
    for (var [key, value] of Object.entries(corrections)) {
        gridLayout = []
        value.forEach((question, questionIndex) => {
            questLayout = []
            if (question.type == 'qcm') {
                question.response.forEach((prop, propIndex) => {
                    questLayout.push([135 + (propIndex * 35), 170 + (questionIndex * 20)])
                })
            }
            else if (question.type == 'version') {
                for (propIndex = 0; propIndex < question.nbVersion; propIndex++) {
                    questLayout.push([135 + (propIndex * 35), 170 + (questionIndex * 20)])
                }
                key = 'X'
            }
            gridLayout.push(questLayout)
        })
        gridLayouts[key] = gridLayout
    }


    copyLayout["versions"] = gridLayouts

    return JSON.stringify(copyLayout)
}

exports.getCopyLayout = getCopyLayout 


// Test this function :

// correction = { "A": [{ "type": "version", "nbVersion": 2 }, { "type": "qcm", "response": [false, false, true, false, false], "weight": "1" }, { "type": "qcm", "response": [false, false, true, false, false], "weight": "1" }, { "type": "qcm", "response": [false, false, true, false, false], "weight": "1" }, { "type": "qcm", "response": [false, false, false, true, false], "weight": "1" }, { "type": "qcm", "response": [false, false, false, false, true], "weight": "1" }, { "type": "qcm", "response": [false, false, false, false, true], "weight": "1" }, { "type": "qcm", "response": [false, false, true, false, false], "weight": "2" }, { "type": "qcm", "response": [false, true, false, false, false], "weight": "2" }, { "type": "qcm", "response": [false, false, true, false, false], "weight": "2" }, { "type": "qcm", "response": [false, true, false, false, false], "weight": "1" }], "B": [{ "type": "version", "nbVersion": 2 }, { "type": "qcm", "response": [true, false, false, false, false], "weight": "1" }, { "type": "qcm", "response": [false, true, false, false, false], "weight": "1" }, { "type": "qcm", "response": [false, false, false, false, true], "weight": "1" }, { "type": "qcm", "response": [false, false, true, false, false], "weight": "1" }, { "type": "qcm", "response": [false, true, false, false, false], "weight": "1" }, { "type": "qcm", "response": [false, false, false, false, true], "weight": "1" }, { "type": "qcm", "response": [false, false, false, true, false], "weight": "2" }, { "type": "qcm", "response": [false, false, true, false, false], "weight": "2" }, { "type": "qcm", "response": [true, false, false, false, false], "weight": "2" }, { "type": "qcm", "response": [false, false, true, false, false], "weight": "1" }] }
// console.table(getCopyLayout(correction))

