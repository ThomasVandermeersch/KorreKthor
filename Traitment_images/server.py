from bottle import run, get, post, request, BaseRequest
import main
import os
from pathlib import Path
from datetime import datetime
@get("/")
def resp():
    return "Hello"

@post('/run')
def index():
    print("got")
    pdf_file = request.files.get("my_file")
    print(pdf_file)
    Path("./saves/").mkdir(parents=True, exist_ok=True)
    
    now = datetime.now().strftime("%Y_%m_%d__%H_%M_%S")
    file = f"./saves/{now}_{pdf_file.filename}"
    pdf_file.save(file)
    print("file in:", file) 
    return main.compute(file)

BaseRequest.MEMFILE_MAX = 1000000000

run(host='0.0.0.0', port=8080)
