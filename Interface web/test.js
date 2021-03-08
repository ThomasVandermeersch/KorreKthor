

email = "17976@ecam.be"
if(email.startsWith('19')) { 
    console.log(String(parseInt(email.split('@')[0], 10) - 176000))
    console.log("student")
}
else{
    start = String(email.split('@')[0])
    let re = /^\d/
    if (re.test(start)){
        console.log("student")
    }
    else{
        console.log("prof")
    }
}