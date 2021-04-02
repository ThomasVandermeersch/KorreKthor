
function post(path, params, method='post') {
    /**
     * "handmade" javascript POST function
     * This function make a posts request to path with params as args
     */

    const form = document.createElement('form');
    form.method = method;
    form.action = path;
    //form.enctype = "multipart/form-data"
  
    for (const key in params) {
        console.log("oui oui")
        console.log(key)
        console.log(params[key])
      if (params.hasOwnProperty(key)) {
        console.log('oui oui oui oui oui')
        const hiddenField = document.createElement('input');
        hiddenField.type = 'hidden';
        hiddenField.name = key;
        hiddenField.value = params[key];
        form.appendChild(hiddenField);
      }
    }
    document.body.appendChild(form);
    console.log('oui')
    form.submit();
  }


document.getElementById('submitButton').addEventListener("click",function(){
    table_rows = document.getElementById('tableId').rows

    const responseList = []
    for(var i=0;i< table_rows.length; i++){
        var propList = []
        for(var j=1; j < table_rows[i].cells.length; j++){
            propList.push(table_rows[i].cells[j].children[0].checked)
        }
        responseList.push(propList)
    }
    console.log(JSON.stringify(responseList))
    console.log(document.getElementById('copyId').value)
    post("/modifyImageTreatment/"+document.getElementById('copyId').value,{"hello": "bonjour les amis","response":JSON.stringify(responseList)})
})
