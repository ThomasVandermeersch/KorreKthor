const selectElement = document.getElementById('correctionType');

selectElement.addEventListener('change', (event) => {
    var normalDiv = document.getElementById("normal")
    var advancedDiv = document.getElementById("advanced")

    if(event.target.value == 'normal'){
        normalDiv.style.display = "block";
        advancedDiv.style.display = "none";
    }
    if(event.target.value == 'advanced'){
        normalDiv.style.display = "none";
        advancedDiv.style.display = "block";
    }
});


const checkBoxProposition = document.getElementById('checkBoxProposition');

checkBoxProposition.addEventListener('change',(event)=>{
  var lastPropostionDiv = document.getElementById("lastPropostion")

  if(lastPropostionDiv.style.display == 'none'){
      lastPropostionDiv.style.display = "block";
  }
  else{
    lastPropostionDiv.style.display = 'none'
  }
})