
submitUserButton = document.getElementById('submitUserButton')

if(submitUserButton){
  submitUserButton.addEventListener('click', async ()=>{
    matricule = document.getElementById('newMatricule').value
    const response = await fetch('https://fluke.ecam.be:9898/correction/getUserName/'+ matricule);
    const myJson = await response.json(); //extract JSON from the http response
    if('error' in myJson) alert( myJson.error)
    
    else{
      if(confirm("Voulez-vous assigner : " + myJson.name + " à l'examen ?")){
        post("/correction/updateUser/" + document.getElementById('copyId').value,{"newMatricule":myJson.matricule,"examId":document.getElementById('examId').value})
      }
    }
  })
}

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


document.getElementById('submitAnswersButton').addEventListener("click",function(){
    console.log('Try to submit the file')
    table_rows = document.getElementById('tableId').rows

    const responseList = []
    for(var i=0;i< table_rows.length; i++){
        var propList = []
        for(var j=1; j < table_rows[i].cells.length - 2; j++){
            if(table_rows[i].cells[j].children[0].checked) propList.push(1)
            else propList.push(0)
            //propList.push(table_rows[i].cells[j].children[0].checked)
        }
        responseList.push(propList)
    }
    post("/correction/modifyImageTreatment/"+document.getElementById('copyId').value,{"response":JSON.stringify(responseList)})
})
