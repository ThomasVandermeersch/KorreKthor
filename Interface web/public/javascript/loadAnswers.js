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



function addChoice(row){
    if (row.cells.length <= 13){
        row.insertCell(row.cells.length - 2).innerHTML +=  `<input type='checkbox' class='form-check-input checkboxClass'  id='question' name='${row.cells.length-4}' value='yes'>`
    }
}

function removeChoice(row){
    if(row.cells.length > 4){
        row.deleteCell(row.cells.length - 3)
    }
}

//Add a choice to a question
document.querySelectorAll(".addChoice").forEach(item=>{
    item.addEventListener("click",function(){
        var table = item.parentNode.parentNode.parentNode
        var row = table.rows[item.parentNode.parentNode.rowIndex]
        addChoice(row)
    })
})

//Remove a choice to a question
document.querySelectorAll(".removeChoice").forEach(item=>{
    item.addEventListener("click",function(){
        var table = item.parentNode.parentNode.parentNode
        var row = table.rows[item.parentNode.parentNode.rowIndex]
        removeChoice(row)
    })
})


function addQuestion(nbRows,table, nbProp=3){
    var row = table.insertRow()
    row.insertCell(0).innerHTML = "Question " + nbRows 

    for(let i=1; i < nbProp + 1; i++ ){
        row.insertCell(i).innerHTML = `<input type='checkbox' class='form-check-input checkboxClass'  id='question' name='${i-1}' value='yes'>`
    }

    var button = document.createElement("button")
    button.classList.add("btn", "btn-secondary", "btn-sm", "addChoice-0")
    button.innerHTML = "+"

    var removeButton = document.createElement("button")
    removeButton.classList.add("btn", "btn-secondary", "btn-sm", "removeChoice-0")
    removeButton.innerHTML = "-"

    row.insertCell(4).appendChild(removeButton)
    row.insertCell(5).appendChild(button)
    
    removeButton.parentNode.classList.add("px-0", "mx-0")
    button.parentNode.classList.add("px-0", "mx-0")


    button.addEventListener("click",function(){
        var row2 = table.rows[button.parentNode.parentNode.rowIndex]
        if (row2.cells.length <= 13){
            row.insertCell(row.cells.length - 2).innerHTML +=  `<input type='checkbox' class='form-check-input checkboxClass'  id='question' name='${row2.cells.length-4}' value='yes'>`
        }
    })

    removeButton.addEventListener("click",function(){
        var row = table.rows[button.parentNode.parentNode.rowIndex]
        if(row.cells.length > 4){
            row.deleteCell(row.cells.length - 3)
        }
    })
}

function removeQuestion(table){
    var lastRowIndex = table.rows.length  - 1
    if ( lastRowIndex > 0){
        table.deleteRow(lastRowIndex);   
    }
}


document.querySelectorAll(".nbPropDefault").forEach(item=>{
    item.addEventListener('change',function(event){
        var table = item.parentNode.parentNode.childNodes[1]
        var nbRows = table.rows.length
        if(this.value > 10)  this.value = 10
        else if(this.value < 1) this.value =1

        
        for(var i =0;i<nbRows;i++){
            nbRowChoice = table.rows[i].cells.length - 3
            
            while(nbRowChoice != this.value){
                if(nbRowChoice < this.value) addChoice(table.rows[i])
                else removeChoice(table.rows[i])
                nbRowChoice = table.rows[i].cells.length - 3
            }
        }
    })
})

document.querySelectorAll(".nbQuestions").forEach(item=>{
    item.addEventListener('change',function(event){
        var table = item.parentNode.parentNode.childNodes[1]
        var nbRows = table.rows.length
        if(this.value > 30)  this.value = 30
        else if(this.value < 1) this.value =1

        var diff = this.value - nbRows
        
        if(diff>0){
            for(var i=0;i<diff;i++){
                nbRows = nbRows + 1
                addQuestion(nbRows, table)
            }
        }

        else{
            for(var i=0; i>diff; i--)
            {
                removeQuestion(table)
            } 
        }
    })
})

// // Add a question to a version
// document.querySelectorAll(".addQuestion").forEach(item=>{
//     item.addEventListener("click", function(){
//         var table = item.parentNode.parentNode.childNodes[1]
//         var nbRows = table.rows.length

//         if (nbRows < 30){
//             var row = table.insertRow()
//             row.insertCell(0).innerHTML = "Question " + (nbRows + 1)

//             for(let i=1; i < 4; i++ ){
//                 row.insertCell(i).innerHTML = `<input type='checkbox' class='form-check-input checkboxClass'  id='question' name='${i-1}' value='yes'>`
//             }

//             var button = document.createElement("button")
//             button.classList.add("btn", "btn-secondary", "btn-sm", "addChoice-0")
//             button.innerHTML = "+"

//             var removeButton = document.createElement("button")
//             removeButton.classList.add("btn", "btn-secondary", "btn-sm", "removeChoice-0")
//             removeButton.innerHTML = "-"

//             row.insertCell(4).appendChild(removeButton)
//             row.insertCell(5).appendChild(button)
            
//             removeButton.parentNode.classList.add("px-0", "mx-0")
//             button.parentNode.classList.add("px-0", "mx-0")


//             button.addEventListener("click",function(){
//                 var row2 = table.rows[button.parentNode.parentNode.rowIndex]
//                 if (row2.cells.length <= 13){
//                     row.insertCell(row.cells.length - 2).innerHTML +=  `<input type='checkbox' class='form-check-input checkboxClass'  id='question' name='${row2.cells.length-4}' value='yes'>`
//                 }
//             })

//             removeButton.addEventListener("click",function(){
//                 var row = table.rows[button.parentNode.parentNode.rowIndex]
//                 if(row.cells.length > 4){
//                     row.deleteCell(row.cells.length - 3)
//                 }
//             })
//         }
//     })
// })

// //Remove last line in a version
// document.querySelectorAll(".removeQuestion").forEach(item=>{
//     item.addEventListener('click',function(){
//         var table =  item.parentNode.parentNode.childNodes[1]
//         var lastRowIndex = table.rows.length  - 1
//         if ( lastRowIndex > 0){
//             table.deleteRow(lastRowIndex);
//         }
//     })
// })

//Send question to the server
document.getElementById("send").addEventListener("click", function(){
    var responseObject = {}
    document.querySelectorAll(".tableClass").forEach(table =>{
        responseObject[table.id] = []

        for(let i=0; i<table.rows.length ; i++){
            responseObject[table.id].push([])
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

    post("/create/quest", {"liste":JSON.stringify(responseObject), "files":JSON.stringify(files.value)})
})