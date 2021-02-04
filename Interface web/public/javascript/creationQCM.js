
var nbquestion = 5;
const table = document.getElementById("table");
const addQuestionButton = document.getElementById("addQuestion")


function post(path, params, method='post') {
    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
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
        var row = table.rows[item.parentNode.parentNode.rowIndex]
        row.insertCell(4).innerHTML +=  "<input type='checkbox' class='checkboxClass'  id='subscribeNews' name='subscribe' value='newsletter'>"
    })
})


//Add a question
addQuestionButton.addEventListener("click", function(event){
    nbquestion +=1  
    var row = table.insertRow(nbquestion-1)
    row.insertCell(0).innerHTML = "Question " + nbquestion
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

});


//Send question to the server
document.getElementById("send").addEventListener("click", function(){
    // console.log("hello world")
    responseArr = []

    for(let i=0; i<table.rows.length; i++){
        responseArr.push([])
    }
    const test = []
    document.querySelectorAll(".checkboxClass").forEach(item=>{

        var row = item.parentNode.parentNode.rowIndex
        var col = item.parentNode.cellIndex
        responseArr[row][col -1] = item.checked
        test.push(item.checked)
    })

    post("/quest", {"liste":JSON.stringify(responseArr), "filename":JSON.stringify(document.getElementById("filename").innerText)})

})

//Remove last column
document.getElementById("removeLast").addEventListener("click",function(){
    if (nbquestion > 1){
        table.deleteRow(table.rows.length -1);
        nbquestion = nbquestion -1
    }
})