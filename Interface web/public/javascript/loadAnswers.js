function post(path, params, method='post') {
    /**
     * "handmade" javascript POST function
     * This function make a posts request to path with params as args
     */

    const form = document.createElement('form');
    form.method = method;
    form.action = path;
    form.enctype = "multipart/form-data"
  
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

//Add a choice to a question
document.querySelectorAll(".addChoice").forEach(item=>{
    item.addEventListener("click",function(){
        var table = item.parentNode.parentNode.parentNode
        var row = table.rows[item.parentNode.parentNode.rowIndex]
        row.insertCell(4).innerHTML +=  "<input type='checkbox' class='checkboxClass'  id='subscribeNews' name='subscribe' value='newsletter'>"
    })
})

// Add a question to a version
document.querySelectorAll(".addQuestion").forEach(item=>{
    item.addEventListener("click",function(){
        var table = item.parentNode.childNodes[1]
        var nbRows = table.rows.length
        var row = table.insertRow()
        row.insertCell(0).innerHTML = "Question " + (nbRows + 1)
        for(let i=1; i < 4; i++ ){
            row.insertCell(i).innerHTML = "<input type='checkbox' class='checkboxClass'  id='subscribeNews' name='subscribe' value='newsletter'>"
        }

        var button = document.createElement("button")
        button.type = "button"
        button.innerHTML = "+"
        row.insertCell(4).appendChild(button)

        button.addEventListener("click",function(){
            var row2 = table.rows[button.parentNode.parentNode.rowIndex]
            var cell2 = row2.insertCell(4)
            cell2.innerHTML +=  "<input type='checkbox' class='checkboxClass'  id='subscribeNews' name='subscribe' value='newsletter'>" 
        })
    })
})

//Remove last line in a version
document.querySelectorAll(".removeQuestion").forEach(item=>{
    item.addEventListener('click',function(){
        var table =  item.parentNode.childNodes[1]
        var lastRowIndex = table.rows.length  - 1
        if ( lastRowIndex > 0){
            table.deleteRow(lastRowIndex);
        }
    })
})

//Send question to the server
document.getElementById("send").addEventListener("click", function(){
    var responseObject = {}
    document.getElementById("questions").childNodes.forEach(childNode=>{
        //Prepare the response object
        responseObject[childNode.id] = [[]] //add the first div
        var table = childNode.childNodes[1] //get table of first div
        for(let i=0; i<table.rows.length -1; i++){
            responseObject[childNode.id].push([])
        }
    })
    //Fill in the responseObject
    document.querySelectorAll(".checkboxClass").forEach(item=>{
        //associate the item to a table.
        var id = item.parentNode.parentNode.parentNode.parentNode.parentNode.id //lol
        var row = item.parentNode.parentNode.rowIndex
        var col = item.parentNode.cellIndex
        responseObject[id][row][col -1] = item.checked
    })

    var files = document.getElementById("filesList")
    
    post("/quest", {"liste":JSON.stringify(responseObject), "filename":document.getElementById("filename").innerText, "files":JSON.stringify(files.value)})
})