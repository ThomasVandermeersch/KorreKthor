
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

    post("/correction/modifyImageTreatment/"+document.getElementById('copyId').value,{"response":JSON.stringify(responseList)})
})
