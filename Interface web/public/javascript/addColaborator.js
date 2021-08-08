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


document.getElementById('submitUserButton').addEventListener('click', async ()=>{
    matricule = document.getElementById('newMatricule').value
    const response = await fetch('https://localhost:9898/correction/getUserName/'+ matricule);
    const myJson = await response.json(); //extract JSON from the http response
    if('error' in myJson) alert( myJson.error)
    
    else{
      if(confirm("Voulez-vous ajouter : " + myJson.name + " comme collaborateur ?")){
        post("/see/collaborators/" + document.getElementById('examId').value,{"newCollaborator":myJson.matricule,"examId":document.getElementById('examId').value})
      }
    }
  })