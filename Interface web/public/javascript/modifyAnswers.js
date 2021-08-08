function post(path, params, method='post') {
    /**
     * "handmade" javascript POST function
     * This function make a posts request to path with params as args
     */

    const form = document.createElement('form');
    form.method = method;
    form.action = path;
  
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        const hiddenField = document.createElement('input');
        hiddenField.type = 'hidden';
        hiddenField.name = key;
        hiddenField.value = params[key];
        form.appendChild(hiddenField);
      }
    }

    document.body.appendChild(form);
    form.submit();
}

document.getElementById("send").addEventListener("click", function(){
    var responseObject = {}
    document.querySelectorAll(".tableClass").forEach(table =>{
        responseObject[table.id] = []

        for(let i=0; i<table.rows.length ; i++){
            object = {type:'qcm',response:['e'],weight:1}
            responseObject[table.id].push(object)
        }
    })

    //Fill in the responseObject
    document.querySelectorAll(".checkboxClass").forEach(item=>{
        //associate the item to a table.
        var id = item.parentNode.parentNode.parentNode.parentNode.id //lol
        var row = item.parentNode.parentNode.rowIndex
        var col = item.parentNode.cellIndex
        responseObject[id][row].response[col -1] = item.checked
    })
    var nbVersionHTML = document.getElementById("nbVersion")
    if(nbVersionHTML) post("/correction/modifyAnswers/"+document.getElementById('examId').value, {"liste":JSON.stringify(responseObject),nbVersion:nbVersionHTML.value})
    else post("/correction/modifyAnswers/"+document.getElementById('examId').value, {"liste":JSON.stringify(responseObject)})
})